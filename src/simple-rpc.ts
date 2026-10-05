import * as net from "net";
import * as path from "path";
import { EventEmitter } from "events";

const OPCODE = { HANDSHAKE: 0, FRAME: 1, CLOSE: 3, PING: 4, PONG: 5 };
const IPC_CHANNEL_COUNT = 10;
const PIPE_CONNECT_TIMEOUT_MS = 1500;
const HANDSHAKE_TIMEOUT_MS = 10000;

export function getDiscordIpcPaths(
    platform: NodeJS.Platform = process.platform,
    env: NodeJS.ProcessEnv = process.env
): string[] {
    if (platform === "win32") {
        return Array.from({ length: IPC_CHANNEL_COUNT }, (_, index) => `\\\\.\\pipe\\discord-ipc-${index}`);
    }

    const runtimeDirectory = env.XDG_RUNTIME_DIR || env.TMPDIR || env.TMP || env.TEMP || "/tmp";
    return Array.from(
        { length: IPC_CHANNEL_COUNT },
        (_, index) => path.posix.join(runtimeDirectory.replace(/\\/g, "/"), `discord-ipc-${index}`)
    );
}

export class SimpleDiscordRPC extends EventEmitter {
    private clientId: string;
    private socket: net.Socket | null = null;
    private buffer: Buffer = Buffer.alloc(0);
    private nonce = 0;
    private connected = false;
    private user: any = null;
    private keepAliveTimer: NodeJS.Timeout | null = null;
    private connectionGeneration = 0;

    constructor(clientId: string) {
        super();
        this.clientId = clientId;
    }

    private encode(op: number, data: any): Buffer {
        const payload = Buffer.from(JSON.stringify(data), "utf-8");
        const header = Buffer.alloc(8);
        header.writeUInt32LE(op, 0);
        header.writeUInt32LE(payload.length, 4);
        return Buffer.concat([header, payload]);
    }

    private send(cmd: string, args?: any, evt?: string): void {
        if (!this.socket || !this.connected) return;

        const nonce = `n_${++this.nonce}`;
        const msg: any = { cmd, args: args || {}, nonce };
        if (evt) msg.evt = evt;

        this.socket.write(this.encode(OPCODE.FRAME, msg));
    }

    async connect(): Promise<void> {
        this.disconnect();
        const generation = this.connectionGeneration;
        let lastError: Error = new Error("Discord IPC endpoint not found");

        for (const ipcPath of getDiscordIpcPaths()) {
            try {
                await this.connectToPath(ipcPath);
                if (generation !== this.connectionGeneration) throw new Error("Discord IPC connection cancelled");
                return;
            } catch (error) {
                if (generation !== this.connectionGeneration) throw new Error("Discord IPC connection cancelled");
                lastError = error instanceof Error ? error : new Error(String(error));
            }
        }

        throw lastError;
    }

    private connectToPath(ipcPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const socket = net.createConnection(ipcPath);
            this.socket = socket;
            this.buffer = Buffer.alloc(0);
            let settled = false;
            let connectedToPipe = false;

            const finish = (error?: Error) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                this.removeListener("ready", onReady);
                this.removeListener("error", onProtocolError);

                if (error) {
                    socket.removeAllListeners();
                    socket.destroy();
                    if (this.socket === socket) this.socket = null;
                    reject(error);
                } else {
                    resolve();
                }
            };
            const onReady = () => finish();
            const onProtocolError = (error: Error) => finish(error);
            const onTimeout = () => finish(new Error(
                connectedToPipe
                    ? `Discord IPC handshake timed out at ${ipcPath}`
                    : `Discord IPC connection timed out at ${ipcPath}`
            ));
            let timeout = setTimeout(onTimeout, PIPE_CONNECT_TIMEOUT_MS);

            this.once("ready", onReady);
            this.once("error", onProtocolError);

            socket.on("connect", () => {
                if (settled) return;
                connectedToPipe = true;
                clearTimeout(timeout);
                timeout = setTimeout(onTimeout, HANDSHAKE_TIMEOUT_MS);
                socket.write(this.encode(OPCODE.HANDSHAKE, { v: 1, client_id: this.clientId }));
            });

            socket.on("data", (chunk: Buffer) => {
                if (this.socket !== socket) return;
                this.buffer = Buffer.concat([this.buffer, chunk]);
                this.processBuffer(socket);
            });

            socket.on("error", (error: Error) => {
                if (!settled) finish(error);
                else this.emit("error", error);
            });

            socket.on("close", () => {
                const wasActive = this.socket === socket;
                const wasConnected = wasActive && this.connected;
                if (wasActive) {
                    this.socket = null;
                    this.connected = false;
                    this.stopKeepAlive();
                }
                if (!settled) finish(new Error(`Discord IPC connection closed at ${ipcPath}`));
                else if (wasConnected) this.emit("disconnected");
            });
        });
    }

    private processBuffer(socket: net.Socket): void {
        while (this.buffer.length >= 8) {
            const op = this.buffer.readUInt32LE(0);
            const len = this.buffer.readUInt32LE(4);
            if (this.buffer.length < 8 + len) break;

            let data: any;
            try {
                data = JSON.parse(this.buffer.slice(8, 8 + len).toString("utf-8"));
            } catch (error) {
                this.emit("error", error instanceof Error ? error : new Error(String(error)));
                socket.destroy();
                return;
            }
            this.buffer = this.buffer.slice(8 + len);

            if (op === OPCODE.FRAME) {
                if (data.evt === "READY") {
                    this.connected = true;
                    this.user = data.data.user;
                    this.startKeepAlive();
                    this.emit("ready");
                } else if (data.evt === "ERROR") {
                    this.emit("error", new Error(data.data?.message));
                } else {
                    this.emit("response", data);
                }
            } else if (op === OPCODE.CLOSE) {
                socket.destroy();
            } else if (op === OPCODE.PING) {
                socket.write(this.encode(OPCODE.PONG, data));
            }
        }
    }

    setActivity(activity: any): void {
        this.send("SET_ACTIVITY", {
            pid: process.pid,
            activity,
        });
    }

    clearActivity(): void {
        this.send("SET_ACTIVITY", { pid: process.pid });
    }

    private startKeepAlive(): void {
        this.stopKeepAlive();
        this.keepAliveTimer = setInterval(() => {
            if (this.socket && this.connected) {
                this.socket.write(this.encode(OPCODE.PING, { t: Date.now() }));
            }
        }, 30000);
    }

    private stopKeepAlive(): void {
        if (this.keepAliveTimer) {
            clearInterval(this.keepAliveTimer);
            this.keepAliveTimer = null;
        }
    }

    getUser(): any {
        return this.user;
    }

    disconnect(): void {
        this.connectionGeneration++;
        this.stopKeepAlive();
        const socket = this.socket;
        this.socket = null;
        this.connected = false;
        this.buffer = Buffer.alloc(0);
        if (socket) {
            if (!socket.destroyed && socket.writable) {
                socket.write(this.encode(OPCODE.CLOSE, {}));
            }
            socket.destroy();
        }
    }

    isConnected(): boolean {
        return this.connected;
    }
}
