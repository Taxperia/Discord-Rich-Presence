import * as vscode from "vscode";
import { SimpleDiscordRPC } from "./simple-rpc";

const CURSOR_APP_ID = "1553496746720624841";
const THROTTLE_MS = 2000;

type LanguageMeta = {
    name: string;
    assetKey: string;
    logoAssetKey?: string;
    outlineAssetKey: string;
};

type EditorMeta = {
    name: string;
    assetKey: string;
    embeddedKey: "cursor" | "vscode";
};

type DisplayLanguage = "auto" | "en" | "tr";
type LargeImageMode = "editor" | "languageText" | "languageTextEditor" | "languageOutline" | "languageOutlineEditor" | "languageLogo";

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

const languageMeta = (
    name: string,
    assetKey: string,
    hasLogo: boolean = true
): LanguageMeta => ({
    name,
    assetKey,
    logoAssetKey: hasLogo ? `${assetKey}-logo` : undefined,
    outlineAssetKey: `${assetKey}-outline`,
});

const CODE_META = languageMeta("Code", "code", false);

const LANGUAGE_BY_ID: Record<string, LanguageMeta> = {
    javascript: languageMeta("JavaScript", "javascript"),
    typescript: languageMeta("TypeScript", "typescript"),
    python: languageMeta("Python", "python"),
    java: languageMeta("Java", "java"),
    cpp: languageMeta("C++", "cpp"),
    c: languageMeta("C", "c"),
    csharp: languageMeta("C#", "csharp"),
    go: languageMeta("Go", "go"),
    rust: languageMeta("Rust", "rust"),
    ruby: languageMeta("Ruby", "ruby"),
    php: languageMeta("PHP", "php"),
    swift: languageMeta("Swift", "swift"),
    kotlin: languageMeta("Kotlin", "kotlin"),
    html: languageMeta("HTML", "html"),
    css: languageMeta("CSS", "css"),
    scss: languageMeta("SCSS", "scss"),
    json: languageMeta("JSON", "json"),
    markdown: languageMeta("Markdown", "markdown"),
    yaml: languageMeta("YAML", "yaml"),
    xml: languageMeta("XML", "xml"),
    sql: languageMeta("SQL", "sql"),
    shellscript: languageMeta("Shell", "shell"),
    powershell: languageMeta("PowerShell", "powershell"),
    dockerfile: languageMeta("Docker", "docker"),
    toml: languageMeta("TOML", "toml", false),
    ini: languageMeta("INI", "ini", false),
    vue: languageMeta("Vue", "vue"),
    svelte: languageMeta("Svelte", "svelte"),
    javascriptreact: languageMeta("React JSX", "react"),
    typescriptreact: languageMeta("React TSX", "react"),
    graphql: languageMeta("GraphQL", "graphql"),
    lua: languageMeta("Lua", "lua"),
    dart: languageMeta("Dart", "dart"),
    r: languageMeta("R", "r"),
    elixir: languageMeta("Elixir", "elixir"),
    erlang: languageMeta("Erlang", "erlang"),
    haskell: languageMeta("Haskell", "haskell"),
    clojure: languageMeta("Clojure", "clojure"),
    scala: languageMeta("Scala", "scala"),
    solidity: languageMeta("Solidity", "solidity"),
    terraform: languageMeta("Terraform", "terraform"),
    hcl: languageMeta("HCL", "hcl", false),
};

const LANGUAGE_BY_EXTENSION: Record<string, LanguageMeta> = {
    js: LANGUAGE_BY_ID.javascript,
    ts: LANGUAGE_BY_ID.typescript,
    py: LANGUAGE_BY_ID.python,
    java: LANGUAGE_BY_ID.java,
    cpp: LANGUAGE_BY_ID.cpp,
    c: LANGUAGE_BY_ID.c,
    cs: LANGUAGE_BY_ID.csharp,
    go: LANGUAGE_BY_ID.go,
    rs: LANGUAGE_BY_ID.rust,
    rb: LANGUAGE_BY_ID.ruby,
    php: LANGUAGE_BY_ID.php,
    swift: LANGUAGE_BY_ID.swift,
    kt: LANGUAGE_BY_ID.kotlin,
    html: LANGUAGE_BY_ID.html,
    css: LANGUAGE_BY_ID.css,
    scss: LANGUAGE_BY_ID.scss,
    json: LANGUAGE_BY_ID.json,
    md: LANGUAGE_BY_ID.markdown,
    yaml: LANGUAGE_BY_ID.yaml,
    yml: LANGUAGE_BY_ID.yaml,
    xml: LANGUAGE_BY_ID.xml,
    sql: LANGUAGE_BY_ID.sql,
    sh: LANGUAGE_BY_ID.shellscript,
    bash: languageMeta("Bash", "bash"),
    ps1: LANGUAGE_BY_ID.powershell,
    toml: LANGUAGE_BY_ID.toml,
    ini: LANGUAGE_BY_ID.ini,
    vue: LANGUAGE_BY_ID.vue,
    svelte: LANGUAGE_BY_ID.svelte,
    jsx: LANGUAGE_BY_ID.javascriptreact,
    tsx: LANGUAGE_BY_ID.typescriptreact,
    graphql: LANGUAGE_BY_ID.graphql,
    lua: LANGUAGE_BY_ID.lua,
    dart: LANGUAGE_BY_ID.dart,
    r: LANGUAGE_BY_ID.r,
    ex: LANGUAGE_BY_ID.elixir,
    exs: LANGUAGE_BY_ID.elixir,
    erl: LANGUAGE_BY_ID.erlang,
    hs: LANGUAGE_BY_ID.haskell,
    clj: LANGUAGE_BY_ID.clojure,
    scala: LANGUAGE_BY_ID.scala,
    sol: LANGUAGE_BY_ID.solidity,
    tf: LANGUAGE_BY_ID.terraform,
    hcl: LANGUAGE_BY_ID.hcl,
};

let rpc: SimpleDiscordRPC | null = null;
let startTime: number = Date.now();
let throttleTimer: NodeJS.Timeout | null = null;
let statusBarItem: vscode.StatusBarItem;
let reconnectEnabled = true;

function getLanguageMeta(document: vscode.TextDocument): LanguageMeta {
    const fileName = document.fileName;
    const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
    const known = LANGUAGE_BY_EXTENSION[ext] ?? LANGUAGE_BY_ID[document.languageId];
    if (known) return known;

    const fallbackName = document.languageId !== "plaintext"
        ? document.languageId
        : ext || "Unknown";

    return {
        name: fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1),
        assetKey: "code",
        outlineAssetKey: "code-outline",
    };
}

function getEditorMeta(): EditorMeta {
    const appName = vscode.env.appName;
    const isCursor = appName.toLowerCase().includes("cursor") ||
        vscode.env.uriScheme.toLowerCase().includes("cursor");

    return isCursor
        ? { name: "Cursor", assetKey: "cube_2d_dark", embeddedKey: "cursor" }
        : { name: "Visual Studio Code", assetKey: "vscode-alt", embeddedKey: "vscode" };
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
    const editor = getEditorMeta();
    const largeImage = config.largeImageMode === "editor"
        ? editor.assetKey
        : config.largeImageMode === "languageLogo"
            ? language.logoAssetKey ?? language.assetKey
            : config.largeImageMode === "languageTextEditor"
                ? `${language.assetKey}-${editor.embeddedKey}`
            : config.largeImageMode === "languageOutlineEditor"
                ? `${language.outlineAssetKey}-${editor.embeddedKey}`
            : config.largeImageMode === "languageOutline"
                ? language.outlineAssetKey
            : language.assetKey;
    const largeText = config.largeImageMode === "editor"
        ? editor.name
        : language.name.length >= 2 ? language.name : `${language.name} language`;

    const assets: Record<string, string> = {
        large_image: largeImage,
        large_text: largeText,
    };

    if (
        config.largeImageMode !== "editor" &&
        config.largeImageMode !== "languageTextEditor" &&
        config.largeImageMode !== "languageOutlineEditor" &&
        config.showSmallEditorIcon
    ) {
        assets.small_image = editor.assetKey;
        assets.small_text = editor.name;
    }

    return assets;
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

    rpc = new SimpleDiscordRPC(CURSOR_APP_ID);

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
        console.error("Cursor Discord RPC error:", err.message);
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
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        0
    );
    statusBarItem.tooltip = "Cursor Discord RPC";
    statusBarItem.command = "cursorDiscord.openSettings";
    context.subscriptions.push(statusBarItem);
    statusBarItem.show();

    const initialConfig = getConfig();
    updateStatusBar(initialConfig.enabled
        ? message("connecting", initialConfig)
        : message("disabled", initialConfig));
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
    reconnectEnabled = false;
    if (throttleTimer) clearTimeout(throttleTimer);
    if (rpc) {
        try { rpc.disconnect(); } catch {}
        rpc = null;
    }
}
