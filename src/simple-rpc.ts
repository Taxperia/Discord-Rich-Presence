import * as net from "net";
import * as path from "path";
import { EventEmitter } from "events";

const OPCODE = { HANDSHAKE: 0, FRAME: 1, CLOSE: 3, PING: 4, PONG: 5 };

export class SimpleDiscordRPC extends EventEmitter {
    private clientId: string;
    private socket: net.Socket | null = null;
    private buffer: Buffer = Buffer.alloc(0);
    private nonce = 0;
    private connected = false;
    private user: any = null;
    private keepAliveTimer: NodeJS.Timeout | null = null;

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
        const pipeName = "\\\\.\\pipe\\discord-ipc-0";

        return new Promise((resolve, reject) => {
            this.socket = net.createConnection(pipeName);

            this.socket.on("connect", () => {
                this.socket!.write(
                    this.encode(OPCODE.HANDSHAKE, { v: 1, client_id: this.clientId })
                );
            });

            this.socket.on("data", (chunk: Buffer) => {
                this.buffer = Buffer.concat([this.buffer, chunk]);
                this.processBuffer();
            });

            this.socket.on("error", (err: Error) => {
                this.emit("error", err);
                reject(err);
            });

            this.socket.on("close", () => {
                this.connected = false;
                this.emit("disconnected");
            });

            const readyHandler = () => {
                this.removeListener("error", errorHandler);
                resolve();
            };
            const errorHandler = (err: Error) => {
                this.removeListener("ready", readyHandler);
                reject(err);
            };
            this.once("ready", readyHandler);
            this.once("error", errorHandler);

            setTimeout(() => {
                this.removeListener("ready", readyHandler);
                this.removeListener("error", errorHandler);
                reject(new Error("Connection timed out"));
            }, 10000);
        });
    }

    private processBuffer(): void {
        while (this.buffer.length >= 8) {
            const op = this.buffer.readUInt32LE(0);
            const len = this.buffer.readUInt32LE(4);
            if (this.buffer.length < 8 + len) break;

            const data = JSON.parse(this.buffer.slice(8, 8 + len).toString("utf-8"));
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
                this.disconnect();
            } else if (op === OPCODE.PING) {
                this.socket?.write(this.encode(OPCODE.PONG, data));
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
        this.stopKeepAlive();
        if (this.socket) {
            this.socket.write(this.encode(OPCODE.CLOSE, {}));
            this.socket.destroy();
            this.socket = null;
        }
        this.connected = false;
    }

    isConnected(): boolean {
        return this.connected;
    }
}
