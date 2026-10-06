const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const root = path.resolve(__dirname, '../src/image/rich-presence');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog.json'), 'utf8'));
const assets = {};
function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) { visit(file); continue; }
        if (!entry.name.endsWith('.png')) continue;
        const relative = path.relative(root, file).split(path.sep).join('/');
        // Original artwork is a generator input, not a selectable presence asset.
        if (relative === 'editors/taxcode/iconwhite.png') continue;
        const parts = relative.split('/');
        const stem = path.basename(file, '.png');
        // Preserve URLs published by 1.1.6 without exposing duplicate manifest keys.
        const legacyDesignMirror = /-(mono|card)$/.test(stem) &&
            (parts[0] === 'default' || (parts[0] === 'editors' && parts[2] === 'default'));
        if (legacyDesignMirror) continue;
        let key;
        if (parts[0] === 'default') key = stem;
        else if (parts[0] === 'logos') key = `${stem}-logo`;
        else if (parts[0] === 'outline') key = `${stem}-outline`;
        else if (parts[0] === 'mono') key = `${stem}-mono`;
        else if (parts[0] === 'card') key = `${stem}-card`;
        else if (parts[0] === 'editors' && catalog.editors[parts[1]]) {
            if (parts.length === 3 && stem === 'icon') key = catalog.editors[parts[1]].assetKey;
            else {
                const suffix = { default: '', outline: '-outline', mono: '-mono', card: '-card' }[parts[2]];
                if (suffix === undefined) throw new Error(`Unrecognized editor asset path: ${relative}`);
                key = `${stem}${suffix}-${parts[1]}`;
            }
        } else throw new Error(`Unrecognized asset path: ${relative}`);
        if (assets[key]) throw new Error(`Duplicate asset key: ${key}`);
        assets[key] = { path: relative, sha256: createHash('sha256').update(fs.readFileSync(file)).digest('hex') };
    }
}
visit(root);
for (const language of Object.values(catalog.languages)) {
    for (const key of [language.assetKey, language.outlineAssetKey, language.logoAssetKey].filter(Boolean)) {
        if (!assets[key]) throw new Error(`Missing language asset: ${key}`);
    }
}
for (const id of Object.values(catalog.extensions)) {
    if (!catalog.languages[id]) throw new Error(`Unknown language: ${id}`);
}
for (const editor of Object.values(catalog.editors)) {
    if (!assets[editor.assetKey]) throw new Error(`Missing editor icon: ${editor.assetKey}`);
}
for (const key of ['code', 'code-outline']) {
    if (!assets[key]) throw new Error(`Missing fallback asset: ${key}`);
}
const manifest = JSON.stringify({ ...catalog, assets: Object.fromEntries(Object.entries(assets).sort(([a], [b]) => a.localeCompare(b))) }, null, 2) + '\n';
const output = path.join(root, 'manifest.json');
if (process.argv.includes('--check')) {
    if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== manifest) {
        throw new Error('Manifest is out of date. Run npm run assets:manifest.');
    }
} else fs.writeFileSync(output, manifest);
console.log(`Validated ${Object.keys(assets).length} assets and ${Object.keys(catalog.languages).length} languages.`);
