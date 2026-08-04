import * as vscode from "vscode";
import { SimpleDiscordRPC } from "./simple-rpc";

const CURSOR_APP_ID = "1376937466619232256";
const THROTTLE_MS = 2000;

let rpc: SimpleDiscordRPC | null = null;
let startTime: number = Date.now();
let throttleTimer: NodeJS.Timeout | null = null;
let statusBarItem: vscode.StatusBarItem;

function getLanguageFromFileName(fileName: string): string {
    const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
    const langMap: Record<string, string> = {
        js: "JavaScript",
        ts: "TypeScript",
        py: "Python",
        java: "Java",
        cpp: "C++",
        c: "C",
        cs: "C#",
        go: "Go",
        rs: "Rust",
        rb: "Ruby",
        php: "PHP",
        swift: "Swift",
        kt: "Kotlin",
        html: "HTML",
        css: "CSS",
        scss: "SCSS",
        json: "JSON",
        md: "Markdown",
        yaml: "YAML",
        yml: "YAML",
        xml: "XML",
        sql: "SQL",
        sh: "Shell",
        bash: "Bash",
        ps1: "PowerShell",
        dockerfile: "Docker",
        toml: "TOML",
        ini: "INI",
        vue: "Vue",
        svelte: "Svelte",
        jsx: "React JSX",
        tsx: "React TSX",
        graphql: "GraphQL",
        lua: "Lua",
        dart: "Dart",
        r: "R",
        ex: "Elixir",
        exs: "Elixir",
        erl: "Erlang",
        hs: "Haskell",
        clj: "Clojure",
        scala: "Scala",
        sol: "Solidity",
        tf: "Terraform",
        hcl: "HCL",
    };
    return langMap[ext] ?? ext.toUpperCase() ?? "Unknown";
}

function getConfig() {
    const config = vscode.workspace.getConfiguration("cursorDiscord");
    return {
        showWorkspace: config.get<boolean>("showWorkspace", true),
        showFileName: config.get<boolean>("showFileName", true),
        showLanguage: config.get<boolean>("showLanguage", true),
        showElapsedTime: config.get<boolean>("showElapsedTime", true),
        idleMessage: config.get<string>("idleMessage", "Idle"),
    };
}

function getWorkspaceName(): string {
    const workspace = vscode.workspace.workspaceFolders?.[0];
    return workspace?.name ?? "No Workspace";
}

function updateStatusBar(text: string) {
    statusBarItem.text = `$(pulse) Discord RPC: ${text}`;
}

async function setActivity(details: string, state: string, idle: boolean = false) {
    if (!rpc || !rpc.isConnected()) return;

    const config = getConfig();
    const activity: any = {
        details: details || undefined,
        state: state || undefined,
        largeImageText: "Cursor IDE",
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
    if (!rpc || !rpc.isConnected()) return;

    const editor = vscode.window.activeTextEditor;
    const config = getConfig();

    if (!editor) {
        const state = config.idleMessage;
        await setActivity("Cursor IDE", state, true);
        updateStatusBar("Idle");
        return;
    }

    const document = editor.document;
    const fileName = document.fileName;
    const baseName = fileName.split(/[/\\]/).pop() ?? "unknown";
    const language = getLanguageFromFileName(baseName);
    const workspace = getWorkspaceName();

    let details = "";
    let state = "";

    if (config.showFileName) {
        details = `Editing: ${baseName}`;
    }
    if (config.showWorkspace) {
        state = workspace;
    }

    let smallImageText = "";
    if (config.showLanguage) {
        smallImageText = language;
    }

    await setActivity(details, state, false);
    updateStatusBar(`${baseName} (${language})`);
}

async function connectRpc() {
    if (rpc) {
        try { rpc.disconnect(); } catch {}
        rpc = null;
    }

    rpc = new SimpleDiscordRPC(CURSOR_APP_ID);

    rpc.on("ready", async () => {
        const user = rpc?.getUser();
        updateStatusBar(`Connected (${user?.username ?? "unknown"})`);
        startTime = Date.now();
        await updatePresence();
    });

    rpc.on("disconnected", () => {
        updateStatusBar("Disconnected");
        scheduleReconnect();
    });

    rpc.on("error", (err: Error) => {
        console.error("Cursor Discord RPC error:", err.message);
    });

    try {
        updateStatusBar("Connecting...");
        await rpc.connect();
    } catch (err: any) {
        console.error("Discord RPC connection failed:", err.message);
        updateStatusBar("Failed - Is Discord running?");
        scheduleReconnect();
    }
}

function scheduleReconnect() {
    setTimeout(async () => {
        if (!rpc || !rpc.isConnected()) {
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
    context.subscriptions.push(statusBarItem);

    updateStatusBar("Connecting...");
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
        vscode.commands.registerCommand("cursorDiscord.reconnect", async () => {
            updateStatusBar("Reconnecting...");
            await connectRpc();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("cursorDiscord.disconnect", async () => {
            if (rpc) {
                try { rpc.disconnect(); } catch {}
                rpc = null;
            }
            updateStatusBar("Disconnected");
        })
    );
}

export async function deactivate() {
    if (throttleTimer) clearTimeout(throttleTimer);
    if (rpc) {
        try { rpc.disconnect(); } catch {}
        rpc = null;
    }
}
