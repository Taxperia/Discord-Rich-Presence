const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');
const { buildSync } = require('esbuild');

function load(file, overrides = {}) {
    const result = buildSync({ entryPoints: [file], bundle: true, write: false, platform: 'node', format: 'cjs' });
    const module = { exports: {} };
    vm.runInNewContext(result.outputFiles[0].text, {
        module,
        exports: module.exports,
        require,
        console,
        Buffer,
        process,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        ...overrides,
    });
    return module.exports;
}

test('activity text is normalized and kept within Discord limits', () => {
    const { DISCORD_ACTIVITY_TEXT_MAX_LENGTH, normalizeActivityText } = load('src/presence-utils.ts');
    assert.equal(normalizeActivityText('  Editing\n\tindex.ts  '), 'Editing index.ts');
    assert.equal(normalizeActivityText('x'), undefined);
    assert.equal(normalizeActivityText('   '), undefined);
    assert.equal(Array.from(normalizeActivityText('🚀'.repeat(200))).length, DISCORD_ACTIVITY_TEXT_MAX_LENGTH);
});

test('the active document workspace wins in multi-root projects', () => {
    const { selectWorkspaceName } = load('src/presence-utils.ts');
    assert.equal(selectWorkspaceName('api', 'web', 'No Workspace'), 'api');
    assert.equal(selectWorkspaceName(undefined, 'web', 'No Workspace'), 'web');
    assert.equal(selectWorkspaceName(undefined, undefined, 'No Workspace'), 'No Workspace');
});

test('Discord IPC candidates cover channels zero through nine', () => {
    const { getDiscordIpcPaths } = load('src/simple-rpc.ts');
    const windows = Array.from(getDiscordIpcPaths('win32', {}));
    assert.equal(windows.length, 10);
    assert.equal(windows[0], '\\\\.\\pipe\\discord-ipc-0');
    assert.equal(windows[9], '\\\\.\\pipe\\discord-ipc-9');

    const unix = Array.from(getDiscordIpcPaths('linux', { XDG_RUNTIME_DIR: '/run/user/1000' }));
    assert.equal(unix[0], '/run/user/1000/discord-ipc-0');
    assert.equal(unix[9], '/run/user/1000/discord-ipc-9');
});

test('RPC scans failed channels, connects to the available one, and clears handshake timeouts', async () => {
    const attempts = [];
    const sockets = [];
    const pendingTimeouts = new Set();

    const encode = (op, data) => {
        const payload = Buffer.from(JSON.stringify(data));
        const header = Buffer.alloc(8);
        header.writeUInt32LE(op, 0);
        header.writeUInt32LE(payload.length, 4);
        return Buffer.concat([header, payload]);
    };

    class FakeSocket extends EventEmitter {
        constructor(ipcPath) {
            super();
            this.ipcPath = ipcPath;
            this.destroyed = false;
            this.writable = true;
            this.writes = [];
        }

        write(data) {
            this.writes.push(data);
            if (this.ipcPath.endsWith('-2') && data.readUInt32LE(0) === 0) {
                queueMicrotask(() => this.emit('data', encode(1, {
                    evt: 'READY',
                    data: { user: { username: 'tester' } },
                })));
            }
            return true;
        }

        destroy() {
            if (this.destroyed) return;
            this.destroyed = true;
            this.writable = false;
            queueMicrotask(() => this.emit('close'));
        }
    }

    const net = {
        createConnection(ipcPath) {
            attempts.push(ipcPath);
            const socket = new FakeSocket(ipcPath);
            sockets.push(socket);
            queueMicrotask(() => {
                if (ipcPath.endsWith('-2')) socket.emit('connect');
                else socket.emit('error', new Error('missing pipe'));
            });
            return socket;
        },
    };
    const trackedSetTimeout = (callback, delay) => {
        const handle = setTimeout(() => {
            pendingTimeouts.delete(handle);
            callback();
        }, delay);
        pendingTimeouts.add(handle);
        return handle;
    };
    const trackedClearTimeout = handle => {
        pendingTimeouts.delete(handle);
        clearTimeout(handle);
    };

    const { SimpleDiscordRPC } = load('src/simple-rpc.ts', {
        require: id => id === 'net' ? net : require(id),
        process: { platform: 'win32', env: {}, pid: 1234 },
        setTimeout: trackedSetTimeout,
        clearTimeout: trackedClearTimeout,
    });
    const client = new SimpleDiscordRPC('client-id');
    const errors = [];
    let disconnects = 0;
    client.on('error', error => errors.push(error));
    client.on('disconnected', () => disconnects++);

    await client.connect();

    assert.deepEqual(attempts.map(value => value.slice(-1)), ['0', '1', '2']);
    assert.equal(client.isConnected(), true);
    assert.equal(client.getUser().username, 'tester');
    assert.equal(errors.length, 0);
    assert.equal(pendingTimeouts.size, 0);

    sockets[2].destroy();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(client.isConnected(), false);
    assert.equal(disconnects, 1);
});

test('disconnect cancels an in-progress IPC scan without trying later channels', async () => {
    let attempts = 0;

    class HangingSocket extends EventEmitter {
        constructor() {
            super();
            this.destroyed = false;
            this.writable = true;
        }

        write() { return true; }

        destroy() {
            if (this.destroyed) return;
            this.destroyed = true;
            this.writable = false;
            queueMicrotask(() => this.emit('close'));
        }
    }

    const { SimpleDiscordRPC } = load('src/simple-rpc.ts', {
        require: id => id === 'net' ? {
            createConnection() {
                attempts++;
                return new HangingSocket();
            },
        } : require(id),
        process: { platform: 'win32', env: {}, pid: 1234 },
    });
    const client = new SimpleDiscordRPC('client-id');
    const connecting = client.connect();
    await Promise.resolve();
    client.disconnect();

    await assert.rejects(connecting, /cancelled/);
    assert.equal(attempts, 1);
    assert.equal(client.isConnected(), false);
});
