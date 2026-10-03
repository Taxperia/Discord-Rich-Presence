import * as vscode from "vscode";
import { SimpleDiscordRPC } from "./simple-rpc";
import { activityAssets, BUNDLED_MANIFEST, CODE_META, LanguageMeta, LargeImageMode, resolveEditor, resolveLanguage } from "./asset-catalog";
import { AssetCatalogLoader, CATALOG_REFRESH_MS } from "./asset-catalog-loader";

const DISCORD_APPLICATION_ID = "1553496746720624841";
const THROTTLE_MS = 2000;

type DisplayLanguage = "auto" | "en" | "tr";

type PresenceConfig = {
    enabled: boolean;
    language: DisplayLanguage;
    largeImageMode: LargeImageMode;
    privacyMode: boolean;
    showSmallEditorIcon: boolean;
    showWorkspace: boolean;
    showFileName: boolean;
    showLanguage: boolean;
    showElapsedTime: boolean;
    idleMessage: string;
    customDetails: string;
    customState: string;
};

let catalog: AssetCatalogLoader;
let catalogDisposed = false;

let rpc: SimpleDiscordRPC | null = null;
let startTime: number = Date.now();
let throttleTimer: NodeJS.Timeout | null = null;
let statusBarItem: vscode.StatusBarItem;
let reconnectEnabled = true;

function getLanguageMeta(document: vscode.TextDocument): LanguageMeta {
    return resolveLanguage(catalog?.manifest ?? BUNDLED_MANIFEST, document.fileName, document.languageId);
}

const MESSAGES = {
    en: {
        editing: "Editing",
        idle: "Idle",
        noWorkspace: "No Workspace",
        privateWorkspace: "Private workspace",
        privateFile: "Private file",
        connected: "Connected",
        disconnected: "Disconnected",
        connecting: "Connecting...",
        reconnecting: "Reconnecting...",
        disabled: "Disabled",
        failed: "Failed - Is Discord running?",
        unknown: "Unknown",
    },
    tr: {
        editing: "Düzenliyor",
        idle: "Boşta",
        noWorkspace: "Çalışma Alanı Yok",
        privateWorkspace: "Gizli çalışma alanı",
        privateFile: "Gizli dosya",
        connected: "Bağlandı",
        disconnected: "Bağlantı kesildi",
        connecting: "Bağlanıyor...",
        reconnecting: "Yeniden bağlanıyor...",
        disabled: "Kapalı",
        failed: "Bağlantı başarısız - Discord açık mı?",
        unknown: "Bilinmeyen",
    },
} as const;

type MessageKey = keyof typeof MESSAGES.en;

function getConfig(): PresenceConfig {
    const config = vscode.workspace.getConfiguration("cursorDiscord");
    return {
        enabled: config.get<boolean>("enabled", true),
        language: config.get<DisplayLanguage>("language", "auto"),
        largeImageMode: config.get<LargeImageMode>("largeImageMode", "languageText"),
        privacyMode: config.get<boolean>("privacyMode", false),
        showSmallEditorIcon: config.get<boolean>("showSmallEditorIcon", true),
        showWorkspace: config.get<boolean>("showWorkspace", true),
        showFileName: config.get<boolean>("showFileName", true),
        showLanguage: config.get<boolean>("showLanguage", true),
        showElapsedTime: config.get<boolean>("showElapsedTime", true),
        idleMessage: config.get<string>("idleMessage", ""),
        customDetails: config.get<string>("customDetails", ""),
        customState: config.get<string>("customState", ""),
    };
}

function getMessageLanguage(config: PresenceConfig): "en" | "tr" {
    if (config.language !== "auto") return config.language;
    return vscode.env.language.toLowerCase().startsWith("tr") ? "tr" : "en";
}

function message(key: MessageKey, config: PresenceConfig): string {
    return MESSAGES[getMessageLanguage(config)][key];
}

function getWorkspaceName(config: PresenceConfig): string {
    const workspace = vscode.workspace.workspaceFolders?.[0];
    return workspace?.name ?? message("noWorkspace", config);
}

function applyTemplate(
    template: string,
    values: Record<"file" | "workspace" | "language" | "app", string>
): string {
    return template.replace(/\{(file|workspace|language|app)\}/g, (_, key: keyof typeof values) => values[key]);
}

function updateStatusBar(text: string) {
    statusBarItem.text = `$(pulse) Discord RPC: ${text}`;
}

function getActivityAssets(language: LanguageMeta, config: PresenceConfig) {
    const manifest = catalog?.manifest ?? BUNDLED_MANIFEST;
    const editor = resolveEditor(manifest, vscode.env.appName, vscode.env.uriScheme);
    return activityAssets(manifest, language, editor, config.largeImageMode, config.showSmallEditorIcon);
}

async function setActivity(
    details: string,
    state: string,
    idle: boolean = false,
    language: LanguageMeta = CODE_META,
    config: PresenceConfig = getConfig()
) {
    if (!config.enabled || !rpc || !rpc.isConnected()) return;

    const activity: any = {
        details: details || undefined,
        state: state || undefined,
        assets: getActivityAssets(language, config),
        instance: true,
    };

    if (!idle && config.showElapsedTime) {
        activity.timestamps = { start: Math.floor(startTime / 1000) };
    }

    try {
        rpc.setActivity(activity);
    } catch (err) {
        console.error("Failed to set activity:", err);
    }
}

function throttleUpdate(fn: () => void) {
    if (throttleTimer) clearTimeout(throttleTimer);
    throttleTimer = setTimeout(fn, THROTTLE_MS);
}

async function updatePresence() {
    const config = getConfig();
    if (!config.enabled) {
        updateStatusBar(message("disabled", config));
        return;
    }
    if (!rpc || !rpc.isConnected()) return;

    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        const state = config.idleMessage.trim() || message("idle", config);
        await setActivity(vscode.env.appName, state, true, CODE_META, config);
        updateStatusBar(message("idle", config));
        return;
    }

    const document = editor.document;
    const fileName = document.fileName;
    const baseName = fileName.split(/[/\\]/).pop() ?? "unknown";
    const language = getLanguageMeta(document);
    const workspace = getWorkspaceName(config);
    const templateValues = {
        file: config.privacyMode ? message("privateFile", config) : baseName,
        workspace: config.privacyMode ? message("privateWorkspace", config) : workspace,
        language: language.name,
        app: vscode.env.appName,
    };

    let details = "";
    let state = "";

    if (config.customDetails.trim()) {
        details = applyTemplate(config.customDetails, templateValues);
    } else if (config.privacyMode) {
        details = config.showLanguage
            ? `${message("editing", config)}: ${language.name}`
            : message("editing", config);
    } else if (config.showFileName) {
        details = `${message("editing", config)}: ${baseName}`;
    }

    if (config.customState.trim()) {
        state = applyTemplate(config.customState, templateValues);
    } else if (config.privacyMode) {
        state = message("privateWorkspace", config);
    } else if (config.showWorkspace) {
        state = workspace;
    }

    const presenceLanguage = config.showLanguage
        ? language
        : CODE_META;

    await setActivity(details, state, false, presenceLanguage, config);
    updateStatusBar(`${baseName} (${language.name})`);
}

async function connectRpc() {
    const config = getConfig();
    if (!config.enabled) {
        reconnectEnabled = false;
        updateStatusBar(message("disabled", config));
        return;
    }
    reconnectEnabled = true;

    if (rpc) {
        try { rpc.disconnect(); } catch {}
        rpc = null;
    }

    rpc = new SimpleDiscordRPC(DISCORD_APPLICATION_ID);

    rpc.on("ready", async () => {
        const user = rpc?.getUser();
        const readyConfig = getConfig();
        updateStatusBar(`${message("connected", readyConfig)} (${user?.username ?? message("unknown", readyConfig)})`);
        startTime = Date.now();
        await updatePresence();
    });

    rpc.on("disconnected", () => {
        const disconnectedConfig = getConfig();
        updateStatusBar(message("disconnected", disconnectedConfig));
        if (reconnectEnabled) scheduleReconnect();
    });

    rpc.on("error", (err: Error) => {
        console.error("Discord Coding Presence RPC error:", err.message);
    });

    try {
        updateStatusBar(message("connecting", config));
        await rpc.connect();
    } catch (err: any) {
        console.error("Discord RPC connection failed:", err.message);
        updateStatusBar(message("failed", config));
        scheduleReconnect();
    }
}

function scheduleReconnect() {
    setTimeout(async () => {
        if (reconnectEnabled && getConfig().enabled && (!rpc || !rpc.isConnected())) {
            await connectRpc();
        }
    }, 10000);
}

export async function activate(context: vscode.ExtensionContext) {
    catalogDisposed = false;
    catalog = new AssetCatalogLoader(context.globalState);
    const refreshCatalog = async () => {
        if (catalogDisposed || !getConfig().enabled) return;
        if (await catalog.refresh() && !catalogDisposed && reconnectEnabled) await updatePresence();
    };
    const catalogTimer = setInterval(() => { void refreshCatalog(); }, CATALOG_REFRESH_MS);
    context.subscriptions.push({ dispose: () => { catalogDisposed = true; clearInterval(catalogTimer); } });
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        0
    );
    statusBarItem.tooltip = "Discord Coding Presence";
    statusBarItem.command = "cursorDiscord.openSettings";
    context.subscriptions.push(statusBarItem);
    statusBarItem.show();

    const initialConfig = getConfig();
    updateStatusBar(initialConfig.enabled
        ? message("connecting", initialConfig)
        : message("disabled", initialConfig));
    void refreshCatalog();
    await connectRpc();

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => {
            throttleUpdate(() => updatePresence());
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(() => {
            throttleUpdate(() => updatePresence());
        })
    );

    context.subscriptions.push(
        vscode.window.onDidChangeWindowState(() => {
            throttleUpdate(() => updatePresence());
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(async event => {
            if (!event.affectsConfiguration("cursorDiscord")) return;

            const config = getConfig();
            if (!config.enabled) {
                reconnectEnabled = false;
                if (rpc) {
                    try { rpc.clearActivity(); } catch {}
                    try { rpc.disconnect(); } catch {}
                    rpc = null;
                }
                updateStatusBar(message("disabled", config));
                return;
            }

            reconnectEnabled = true;
            void refreshCatalog();

            if (!rpc || !rpc.isConnected()) {
                await connectRpc();
            } else {
                await updatePresence();
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("cursorDiscord.openSettings", async () => {
            await vscode.commands.executeCommand(
                "workbench.action.openSettings",
                `@ext:${context.extension.id}`
            );
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("cursorDiscord.reconnect", async () => {
            const config = getConfig();
            reconnectEnabled = true;
            updateStatusBar(message("reconnecting", config));
            await connectRpc();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("cursorDiscord.disconnect", async () => {
            reconnectEnabled = false;
            if (rpc) {
                try { rpc.disconnect(); } catch {}
                rpc = null;
            }
            const config = getConfig();
            updateStatusBar(message("disconnected", config));
        })
    );
}

export async function deactivate() {
    catalogDisposed = true;
    reconnectEnabled = false;
    if (throttleTimer) clearTimeout(throttleTimer);
    if (rpc) {
        try { rpc.disconnect(); } catch {}
        rpc = null;
    }
}
