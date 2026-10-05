const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const { buildSync } = require('esbuild');

function load(file, overrides = {}) {
    const result = buildSync({ entryPoints: [file], bundle: true, write: false, platform: 'node', format: 'cjs' });
    const module = { exports: {} };
    vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require, console: { ...console, warn() {} }, Buffer, setTimeout, clearTimeout, ...overrides });
    return module.exports;
}
const { BUNDLED_MANIFEST: manifest, ASSET_BASE_URL, CODE_META, isAssetManifest, resolveLanguage, resolveEditor, activityAssets } = load('src/asset-catalog.ts');
const { AssetCatalogLoader, CATALOG_REFRESH_MS } = load('src/asset-catalog-loader.ts');
const clone = value => JSON.parse(JSON.stringify(value));
const root = path.resolve('src/image/rich-presence');
const store = cached => ({ get: () => cached, update: async (_key, value) => { cached = value; } });

test('every manifest image exists, has the correct hash, and lives in its own category', () => {
    assert.ok(isAssetManifest(manifest));
    for (const asset of Object.values(manifest.assets)) {
        const data = fs.readFileSync(path.join(root, asset.path));
        assert.equal(createHash('sha256').update(data).digest('hex'), asset.sha256);
        assert.ok(asset.path.includes('/'));
    }
    assert.equal(fs.readdirSync(root).filter(file => file.endsWith('.png')).length, 0);
});

test('all ten modes work for every language and all three editors', () => {
    for (const language of [...Object.values(manifest.languages), CODE_META]) {
        for (const editor of Object.values(manifest.editors)) {
            for (const mode of ['editor', 'languageText', 'languageTextEditor', 'languageOutline', 'languageOutlineEditor', 'languageLogo', 'languageMono', 'languageMonoEditor', 'languageCard', 'languageCardEditor']) {
                const assets = activityAssets(manifest, language, editor, mode, true);
                for (const field of ['large_image', 'small_image']) {
                    if (!assets[field]) continue;
                    assert.ok(assets[field].startsWith(ASSET_BASE_URL));
                    const relative = assets[field].slice(ASSET_BASE_URL.length).split('?')[0];
                    assert.ok(fs.existsSync(path.join(root, relative)), relative);
                }
                const embedded = ['languageTextEditor', 'languageOutlineEditor', 'languageMonoEditor', 'languageCardEditor'].includes(mode);
                assert.equal(!!assets.small_image, mode !== 'editor' && !embedded);
                if (embedded) assert.ok(assets.large_image.includes(`/editors/${editor.embeddedKey}/`));
                assert.equal(activityAssets(manifest, language, editor, mode, false).small_image, undefined);
            }
        }
    }
});

test('extension precedence, language IDs, unknown languages, and editor detection', () => {
    assert.equal(resolveLanguage(manifest, 'file.TSX', 'typescript').name, 'React TSX');
    assert.equal(resolveLanguage(manifest, 'Dockerfile', 'dockerfile').name, 'Docker');
    assert.equal(resolveLanguage(manifest, 'file.bash', 'shellscript').name, 'Bash');
    assert.equal(resolveLanguage(manifest, 'file.m', 'objective-c').name, 'Objective-C');
    assert.equal(resolveLanguage(manifest, 'file.m', 'matlab').name, 'Matlab');
    assert.equal(resolveLanguage(manifest, 'shader.fs', 'glsl').name, 'Glsl');
    assert.equal(resolveLanguage(manifest, 'file.xyz', 'newlang').assetKey, 'code');
    assert.equal(resolveLanguage(manifest, 'constructor', 'constructor').assetKey, 'code');
    assert.equal(resolveEditor(manifest, 'TaxCode', 'vscode').embeddedKey, 'taxcode');
    assert.equal(resolveEditor(manifest, 'Editor', 'cursor').embeddedKey, 'cursor');
    assert.equal(resolveEditor(manifest, 'Visual Studio Code', 'vscode').embeddedKey, 'vscode');
});

test('missing logos and embedded variants fall back to usable language images', () => {
    const custom = clone(manifest);
    delete custom.assets['javascript-outline-taxcode'];
    const assets = activityAssets(custom, custom.languages.javascript, custom.editors.taxcode, 'languageOutlineEditor', true);
    assert.ok(assets.large_image.includes('/outline/javascript.png'));
    assert.ok(assets.small_image.includes('/editors/taxcode/icon.png'));
    assert.ok(activityAssets(manifest, manifest.languages.toml, manifest.editors.cursor, 'languageLogo', true).large_image.includes('/default/toml.png'));
});

test('TaxCode editions and URI-only branding select TaxCode artwork', () => {
    for (const appName of ['TaxCode', 'TaxCodePlugins', 'TaxCodeNoTelemetry', 'TaxCodeLite', 'TaxCodeVDS']) {
        assert.equal(resolveEditor(manifest, appName, 'code-oss').embeddedKey, 'taxcode');
    }
    const editor = resolveEditor(manifest, 'Code - OSS', 'taxcode');
    assert.equal(editor.name, 'TaxCode');
    const assets = activityAssets(manifest, manifest.languages.javascript, editor, 'languageTextEditor', true);
    assert.ok(assets.large_image.includes('/editors/taxcode/default/javascript.png'));
    assert.equal(assets.small_image, undefined);
});

test('untrusted catalogs reject bad schemas, external paths, bad hashes, and dangling references', () => {
    for (const mutate of [
        m => { m.schemaVersion = 2; },
        m => { m.assets.code.path = 'https://example.com/code.png'; },
        m => { m.assets.code.path = 'default/../../code.png'; },
        m => { m.assets.code.sha256 = 'broken'; },
        m => { m.extensions.foo = 'missing'; },
        m => { m.languages.javascript.assetKey = 'missing'; },
        m => { delete m.assets.code; },
        m => { delete m.editors.taxcode; },
    ]) {
        const invalid = clone(manifest); mutate(invalid);
        assert.equal(isAssetManifest(invalid), false);
    }
});

test('remote catalogs can add languages without extension code changes and persist them', async () => {
    const remote = clone(manifest);
    remote.languages.newlang = { ...remote.languages.javascript, name: 'New Language' };
    remote.extensions.new = 'newlang';
    const cache = store();
    const loader = new AssetCatalogLoader(cache, async () => remote, () => CATALOG_REFRESH_MS * 2);
    assert.equal(await loader.refresh(), true);
    assert.equal(resolveLanguage(loader.manifest, 'file.new', 'plaintext').name, 'New Language');
    assert.equal(new AssetCatalogLoader(cache).manifest.languages.newlang.name, 'New Language');
});

test('fresh cache skips requests; stale cache refreshes once for concurrent calls', async () => {
    const now = CATALOG_REFRESH_MS * 3;
    let calls = 0;
    const fetcher = async () => { calls++; return clone(manifest); };
    const fresh = new AssetCatalogLoader(store({ manifest, fetchedAt: now - 100 }), fetcher, () => now);
    assert.equal(await fresh.refresh(), false);
    assert.equal(calls, 0);
    const stale = new AssetCatalogLoader(store({ manifest, fetchedAt: now - CATALOG_REFRESH_MS }), fetcher, () => now);
    await Promise.all([stale.refresh(), stale.refresh()]);
    assert.equal(calls, 1);
});

test('network failures or invalid responses preserve the last valid catalog', async () => {
    for (const fetcher of [async () => { throw new Error('offline'); }, async () => ({ schemaVersion: 9 })]) {
        const cached = clone(manifest); cached.languages.javascript.name = 'Cached JavaScript';
        const loader = new AssetCatalogLoader(store({ manifest: cached, fetchedAt: 1 }), fetcher);
        assert.equal(await loader.refresh(), false);
        assert.equal(loader.manifest.languages.javascript.name, 'Cached JavaScript');
        const bundled = new AssetCatalogLoader(store({ manifest: null }), fetcher);
        assert.equal(await bundled.refresh(), false);
        assert.ok(isAssetManifest(bundled.manifest));
    }
});

test('HTTP loader bounds response size and handles bad statuses and malformed JSON', async () => {
    const { EventEmitter } = require('node:events');
    for (const scenario of [
        { status: 200, body: JSON.stringify(manifest) },
        { status: 404, body: '', error: /HTTP 404/ },
        { status: 200, body: '{', error: /JSON/ },
        { status: 200, body: 'x'.repeat(1024 * 1024 + 1), error: /exceeds 1 MB/ },
    ]) {
        const https = { get(url, options, callback) {
            assert.equal(url, `${ASSET_BASE_URL}manifest.json`);
            const request = new EventEmitter();
            request.destroy = error => { request.emit('error', error); request.emit('close'); };
            queueMicrotask(() => {
                const response = new EventEmitter();
                response.statusCode = scenario.status;
                response.resume = () => {};
                callback(response);
                response.emit('data', Buffer.from(scenario.body));
                response.emit('end');
                request.emit('close');
            });
            return request;
        } };
        const { fetchManifest } = load('src/asset-catalog-loader.ts', { require: id => id === 'https' ? https : require(id) });
        if (scenario.error) await assert.rejects(fetchManifest(), scenario.error);
        else assert.ok(isAssetManifest(await fetchManifest()));
    }
});

test('HTTP loader times out even when no response arrives', async () => {
    const { EventEmitter } = require('node:events');
    let deadline;
    const request = new EventEmitter();
    request.destroy = error => { request.emit('error', error); request.emit('close'); };
    const { fetchManifest } = load('src/asset-catalog-loader.ts', {
        require: id => id === 'https' ? { get: () => request } : require(id),
        setTimeout: (callback, delay) => { assert.equal(delay, 5000); deadline = callback; return 1; },
        clearTimeout() {},
    });
    const pending = fetchManifest();
    deadline();
    await assert.rejects(pending, /timed out/);
});
