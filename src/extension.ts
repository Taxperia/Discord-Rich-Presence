import * as vscode from "vscode";
import { SimpleDiscordRPC } from "./simple-rpc";
import { activityAssets, BUNDLED_MANIFEST, CODE_META, LanguageMeta, LargeImageMode, resolveEditor, resolveLanguage } from "./asset-catalog";
import { AssetCatalogLoader, CATALOG_REFRESH_MS } from "./asset-catalog-loader";
import {
    ActivityIdleTracker,
    DEFAULT_SENSITIVE_FILE_PATTERNS,
    isSensitiveFile,
    isWorkspaceExcluded,
    normalizeActivityText,
    selectWorkspaceName,
} from "./presence-utils";

const DISCORD_APPLICATION_ID = "1553496746720624841";
const THROTTLE_MS = 2000;
const RECONNECT_DELAYS_MS = [5000, 10000, 30000] as const;

type DisplayLanguage = "auto" | "en" | "tr";
type IdleBehavior = "idle" | "clear";

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
    idleTimeout: number;
    idleBehavior: IdleBehavior;
    hideSensitiveFiles: boolean;
    hiddenFilePatterns: string[];
    disabledWorkspacePatterns: string[];
    idleMessage: string;
    customDetails: string;
    customState: string;
};

let catalog: AssetCatalogLoader;
let catalogDisposed = false;

let rpc: SimpleDiscordRPC | null = null;
let startTime: number = Date.now();
let throttleTimer: NodeJS.Timeout | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let reconnectAttempt = 0;
let activeConnection: { client: SimpleDiscordRPC; promise: Promise<void> } | null = null;
let statusBarItem: vscode.StatusBarItem;
let reconnectEnabled = true;
let presencePaused = false;
let idleTracker: ActivityIdleTracker | null = null;

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
        retrying: "Connection failed. Retrying in {seconds}s...",
        disabled: "Disabled",
        paused: "Paused",
        workspaceExcluded: "Hidden in this workspace",
        failed: "Failed - Is Discord running?",
        unknown: "Unknown",
        pauseAction: "Pause Presence",
        resumeAction: "Resume Presence",
        disableAction: "Disable Presence",
        enableAction: "Enable Presence",
        privacyOnAction: "Enable Privacy Mode",
        privacyOffAction: "Disable Privacy Mode",
        reconnectAction: "Reconnect",
        settingsAction: "Open Settings",
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
        retrying: "Bağlantı başarısız. {seconds} sn sonra yeniden denenecek...",
        disabled: "Kapalı",
        paused: "Duraklatıldı",
        workspaceExcluded: "Bu çalışma alanında gizli",
        failed: "Bağlantı başarısız - Discord açık mı?",
        unknown: "Bilinmeyen",
        pauseAction: "Presence'ı Duraklat",
        resumeAction: "Presence'ı Sürdür",
        disableAction: "Presence'ı Kapat",
        enableAction: "Presence'ı Aç",
        privacyOnAction: "Gizlilik Modunu Aç",
        privacyOffAction: "Gizlilik Modunu Kapat",
        reconnectAction: "Yeniden Bağlan",
        settingsAction: "Ayarları Aç",
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
        idleTimeout: config.get<number>("idleTimeout", 300),
        idleBehavior: config.get<IdleBehavior>("idleBehavior", "idle"),
        hideSensitiveFiles: config.get<boolean>("hideSensitiveFiles", true),
        hiddenFilePatterns: config.get<string[]>("hiddenFilePatterns", [...DEFAULT_SENSITIVE_FILE_PATTERNS]),
        disabledWorkspacePatterns: config.get<string[]>("disabledWorkspacePatterns", []),
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

function getWorkspaceName(document: vscode.TextDocument, config: PresenceConfig): string {
    const documentWorkspace = vscode.workspace.getWorkspaceFolder(document.uri);
    return selectWorkspaceName(
        documentWorkspace?.name,
        vscode.workspace.workspaceFolders?.[0]?.name,
        message("noWorkspace", config)
    );
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
        details: normalizeActivityText(details),
        state: normalizeActivityText(state),
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

function recordEditorActivity() {
    const config = getConfig();
    const wasIdle = idleTracker?.recordActivity(config.idleTimeout) ?? false;
    if (wasIdle && !presencePaused) throttleUpdate(() => updatePresence());
}

function clearPublishedActivity() {
    if (!rpc?.isConnected()) return;
    try { rpc.clearActivity(); }
    catch (error) { console.error("Failed to clear activity:", error); }
}

async function updatePresence() {
    const config = getConfig();
    if (!config.enabled) {
        updateStatusBar(message("disabled", config));
        return;
    }
    if (presencePaused) {
        clearPublishedActivity();
        updateStatusBar(message("paused", config));
        return;
    }
    if (!rpc || !rpc.isConnected()) return;

    const editor = vscode.window.activeTextEditor;

    if (editor) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
        if (isWorkspaceExcluded(
            workspaceFolder?.name,
            workspaceFolder?.uri.fsPath,
            config.disabledWorkspacePatterns
        )) {
            clearPublishedActivity();
            updateStatusBar(message("workspaceExcluded", config));
            return;
        }
    }

    if (!editor || idleTracker?.isIdle) {
        if (config.idleBehavior === "clear") {
            clearPublishedActivity();
            updateStatusBar(message("idle", config));
            return;
        }
        const state = config.idleMessage.trim() || message("idle", config);
        await setActivity(vscode.env.appName, state, true, CODE_META, config);
        updateStatusBar(message("idle", config));
        return;
    }

    const document = editor.document;
    const fileName = document.fileName;
    const baseName = fileName.split(/[/\\]/).pop() ?? "unknown";
    const language = getLanguageMeta(document);
    const workspace = getWorkspaceName(document, config);
    const sensitiveFile = config.hideSensitiveFiles && isSensitiveFile(fileName, config.hiddenFilePatterns);
    const displayedFileName = config.privacyMode || sensitiveFile
        ? message("privateFile", config)
        : baseName;
    const templateValues = {
        file: displayedFileName,
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
        details = `${message("editing", config)}: ${displayedFileName}`;
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

function clearReconnectTimer() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
}

async function connectRpc(): Promise<void> {
    const config = getConfig();
    if (!config.enabled) {
        reconnectEnabled = false;
        clearReconnectTimer();
        updateStatusBar(message("disabled", config));
        return;
    }
    reconnectEnabled = true;
    clearReconnectTimer();

    if (activeConnection && activeConnection.client === rpc) {
        return activeConnection.promise;
    }

    if (rpc) {
        try { rpc.disconnect(); } catch {}
        rpc = null;
    }

    const client = new SimpleDiscordRPC(DISCORD_APPLICATION_ID);
    rpc = client;

    client.on("ready", async () => {
        if (rpc !== client) return;
        clearReconnectTimer();
        reconnectAttempt = 0;
        const user = client.getUser();
        const readyConfig = getConfig();
        updateStatusBar(`${message("connected", readyConfig)} (${user?.username ?? message("unknown", readyConfig)})`);
        startTime = Date.now();
        await updatePresence();
    });

    client.on("disconnected", () => {
        if (rpc !== client) return;
        const disconnectedConfig = getConfig();
        updateStatusBar(message("disconnected", disconnectedConfig));
        if (reconnectEnabled) scheduleReconnect();
    });

    client.on("error", (err: Error) => {
        console.error("Discord Coding Presence RPC error:", err.message);
    });

    const promise = (async () => {
        updateStatusBar(message("connecting", config));
        try {
            await client.connect();
        } catch (error) {
            if (rpc !== client) return;
            const currentConfig = getConfig();
            console.error("Discord RPC connection failed:", error instanceof Error ? error.message : error);
            updateStatusBar(message("failed", currentConfig));
            scheduleReconnect();
        }
    })();

    activeConnection = { client, promise };
    try {
        await promise;
    } finally {
        if (activeConnection?.client === client) activeConnection = null;
    }
}

function scheduleReconnect() {
    if (reconnectTimer || !reconnectEnabled || !getConfig().enabled) return;
    const delay = RECONNECT_DELAYS_MS[Math.min(reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)];
    reconnectAttempt++;
    const config = getConfig();
    updateStatusBar(message("retrying", config).replace("{seconds}", String(delay / 1000)));
    reconnectTimer = setTimeout(async () => {
        reconnectTimer = null;
        if (reconnectEnabled && getConfig().enabled && (!rpc || !rpc.isConnected())) {
            await connectRpc();
        }
    }, delay);
}

async function pausePresence() {
    const config = getConfig();
    if (!config.enabled) {
        updateStatusBar(message("disabled", config));
        return;
    }
    presencePaused = true;
    clearPublishedActivity();
    updateStatusBar(message("paused", config));
}

async function resumePresence() {
    presencePaused = false;
    const config = getConfig();
    idleTracker?.recordActivity(config.idleTimeout);
    if (!config.enabled) {
        updateStatusBar(message("disabled", config));
    } else if (!rpc?.isConnected()) {
        await connectRpc();
    } else {
        await updatePresence();
    }
}

async function togglePrivacyMode() {
    const configuration = vscode.workspace.getConfiguration("cursorDiscord");
    const enabled = configuration.get<boolean>("privacyMode", false);
    await configuration.update("privacyMode", !enabled, vscode.ConfigurationTarget.Global);
}

async function setPresenceEnabled(enabled: boolean) {
    if (enabled) presencePaused = false;
    await vscode.workspace.getConfiguration("cursorDiscord")
        .update("enabled", enabled, vscode.ConfigurationTarget.Global);
}

async function showQuickMenu() {
    const config = getConfig();
    type MenuAction = "toggleEnabled" | "togglePause" | "togglePrivacy" | "reconnect" | "settings";
    const items: Array<vscode.QuickPickItem & { action: MenuAction }> = [
        {
            label: config.enabled ? `$(circle-slash) ${message("disableAction", config)}` : `$(play) ${message("enableAction", config)}`,
            action: "toggleEnabled",
        },
    ];
    if (config.enabled) {
        items.push({
            label: presencePaused ? `$(play) ${message("resumeAction", config)}` : `$(debug-pause) ${message("pauseAction", config)}`,
            action: "togglePause",
        });
    }
    items.push({
        label: config.privacyMode ? `$(eye) ${message("privacyOffAction", config)}` : `$(eye-closed) ${message("privacyOnAction", config)}`,
        action: "togglePrivacy",
    });
    if (config.enabled) {
        items.push({ label: `$(refresh) ${message("reconnectAction", config)}`, action: "reconnect" });
    }
    items.push({ label: `$(settings-gear) ${message("settingsAction", config)}`, action: "settings" });

    const selected = await vscode.window.showQuickPick(items, { placeHolder: "Discord Coding Presence" });
    if (!selected) return;
    if (selected.action === "toggleEnabled") await setPresenceEnabled(!config.enabled);
    else if (selected.action === "togglePause") await (presencePaused ? resumePresence() : pausePresence());
    else if (selected.action === "togglePrivacy") await togglePrivacyMode();
    else if (selected.action === "reconnect") await vscode.commands.executeCommand("cursorDiscord.reconnect");
    else await vscode.commands.executeCommand("cursorDiscord.openSettings");
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
    statusBarItem.command = "cursorDiscord.showMenu";
    context.subscriptions.push(statusBarItem);
    statusBarItem.show();

    const initialConfig = getConfig();
    idleTracker = new ActivityIdleTracker(() => { void updatePresence(); });
    idleTracker.recordActivity(initialConfig.idleTimeout);
    context.subscriptions.push({ dispose: () => { idleTracker?.dispose(); idleTracker = null; } });
    updateStatusBar(initialConfig.enabled
        ? message("connecting", initialConfig)
        : message("disabled", initialConfig));
    void refreshCatalog();
    await connectRpc();

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => {
            recordEditorActivity();
            throttleUpdate(() => updatePresence());
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document === vscode.window.activeTextEditor?.document) recordEditorActivity();
            throttleUpdate(() => updatePresence());
        })
    );

    context.subscriptions.push(
        vscode.window.onDidChangeTextEditorSelection(event => {
            if (event.textEditor === vscode.window.activeTextEditor) recordEditorActivity();
        })
    );

    context.subscriptions.push(
        vscode.window.onDidChangeWindowState(event => {
            if (event.focused) recordEditorActivity();
            throttleUpdate(() => updatePresence());
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(async event => {
            if (!event.affectsConfiguration("cursorDiscord")) return;

            const config = getConfig();
            idleTracker?.recordActivity(config.idleTimeout);
            if (!config.enabled) {
                reconnectEnabled = false;
                reconnectAttempt = 0;
                presencePaused = false;
                clearReconnectTimer();
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
        vscode.commands.registerCommand("cursorDiscord.showMenu", showQuickMenu),
        vscode.commands.registerCommand("cursorDiscord.pause", pausePresence),
        vscode.commands.registerCommand("cursorDiscord.resume", resumePresence),
        vscode.commands.registerCommand("cursorDiscord.togglePrivacy", togglePrivacyMode)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("cursorDiscord.reconnect", async () => {
            const config = getConfig();
            reconnectEnabled = true;
            reconnectAttempt = 0;
            clearReconnectTimer();
            updateStatusBar(message("reconnecting", config));
            await connectRpc();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("cursorDiscord.disconnect", async () => {
            reconnectEnabled = false;
            reconnectAttempt = 0;
            clearReconnectTimer();
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
    idleTracker?.dispose();
    idleTracker = null;
    clearReconnectTimer();
    if (rpc) {
        try { rpc.disconnect(); } catch {}
        rpc = null;
    }
}
