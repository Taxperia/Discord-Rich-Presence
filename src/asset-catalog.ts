import bundledManifest from "./image/rich-presence/manifest.json";

export type LanguageMeta = {
    name: string;
    assetKey: string;
    logoAssetKey?: string;
    outlineAssetKey: string;
};
export type EditorMeta = { name: string; assetKey: string; embeddedKey: string };
export type LargeImageMode = "editor" | "languageText" | "languageTextEditor" | "languageOutline" | "languageOutlineEditor" | "languageLogo" | "languageMono" | "languageMonoEditor" | "languageCard" | "languageCardEditor";
export type AssetManifest = {
    schemaVersion: 1;
    languages: Record<string, LanguageMeta>;
    extensions: Record<string, string>;
    editors: Record<string, EditorMeta>;
    assets: Record<string, { path: string; sha256: string }>;
};

export const ASSET_BASE_URL = "https://raw.githubusercontent.com/Taxperia/Discord-Rich-Presence/master/src/image/rich-presence/";
export const MANIFEST_URL = `${ASSET_BASE_URL}manifest.json`;
export const CODE_META: LanguageMeta = { name: "Code", assetKey: "code", outlineAssetKey: "code-outline" };
const AMBIGUOUS_EXTENSIONS = new Set(["m", "fs"]);
const owns = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);
const record = (value: unknown): value is Record<string, any> => !!value && typeof value === "object" && !Array.isArray(value);
const key = (value: unknown): value is string => typeof value === "string" && /^[a-z0-9][a-z0-9_-]{0,79}$/.test(value);
const name = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0 && value.length <= 100;

// Remote data is only a catalog: no arbitrary hosts, paths or executable content.
export function isAssetManifest(value: unknown): value is AssetManifest {
    if (!record(value) || value.schemaVersion !== 1) return false;
    if (![value.assets, value.languages, value.extensions, value.editors].every(record)) return false;
    const hasAsset = (id: unknown) => key(id) && owns(value.assets, id);
    for (const [id, asset] of Object.entries(value.assets)) {
        if (!key(id) || !record(asset) || typeof asset.path !== "string" ||
            !/^(default|logos|outline|mono|card|editors)\/[a-z0-9_/-]+\.png$/.test(asset.path) ||
            asset.path.includes("//") || typeof asset.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(asset.sha256)) return false;
    }
    if (!hasAsset("code") || !hasAsset("code-outline")) return false;
    for (const [id, language] of Object.entries(value.languages)) {
        if (!key(id) || !record(language) || !name(language.name) || !hasAsset(language.assetKey) ||
            !hasAsset(language.outlineAssetKey) || (language.logoAssetKey !== undefined && !hasAsset(language.logoAssetKey))) return false;
    }
    for (const [extension, id] of Object.entries(value.extensions)) {
        if (!key(extension) || !key(id) || !owns(value.languages, id)) return false;
    }
    for (const [id, editor] of Object.entries(value.editors)) {
        if (!key(id) || !record(editor) || !name(editor.name) || !hasAsset(editor.assetKey) || editor.embeddedKey !== id) return false;
    }
    return ["vscode", "cursor", "taxcode"].every(id => owns(value.editors, id));
}

if (!isAssetManifest(bundledManifest)) throw new Error("Invalid bundled asset manifest");
export const BUNDLED_MANIFEST: AssetManifest = bundledManifest;

export function resolveLanguage(manifest: AssetManifest, fileName: string, languageId: string): LanguageMeta {
    const extension = fileName.split(/[\\/]/).pop()?.split(".").pop()?.toLowerCase() ?? "";
    const extensionId = owns(manifest.extensions, extension) ? manifest.extensions[extension] : undefined;
    const knownLanguageId = owns(manifest.languages, languageId);
    if (extensionId && !AMBIGUOUS_EXTENSIONS.has(extension)) {
        return manifest.languages[extensionId];
    }
    if (knownLanguageId) return manifest.languages[languageId];
    if (extensionId && languageId === "plaintext") {
        return manifest.languages[extensionId];
    }
    const fallbackName = languageId !== "plaintext" ? languageId : extension || "Unknown";
    return { ...CODE_META, name: fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1) };
}

export function resolveEditor(manifest: AssetManifest, appName: string, uriScheme: string): EditorMeta {
    const identity = `${appName} ${uriScheme}`.toLowerCase();
    const id = identity.includes("taxcode") ? "taxcode" : identity.includes("cursor") ? "cursor" : "vscode";
    return manifest.editors[id];
}

export function assetUrl(manifest: AssetManifest, assetKey: string): string {
    const asset = owns(manifest.assets, assetKey) ? manifest.assets[assetKey] : manifest.assets.code;
    return `${ASSET_BASE_URL}${asset.path}?v=${asset.sha256.slice(0, 16)}`;
}

export function activityAssets(manifest: AssetManifest, language: LanguageMeta, editor: EditorMeta, mode: LargeImageMode, showSmallEditorIcon: boolean): Record<string, string> {
    let selected = language.assetKey;
    let embedded = false;
    if (mode === "editor") selected = editor.assetKey;
    else if (mode === "languageLogo") selected = language.logoAssetKey ?? language.assetKey;
    else if (mode === "languageOutline" || mode === "languageOutlineEditor") selected = language.outlineAssetKey;
    else if (mode === "languageMono" || mode === "languageMonoEditor") {
        const candidate = `${language.assetKey}-mono`;
        if (owns(manifest.assets, candidate)) selected = candidate;
    } else if (mode === "languageCard" || mode === "languageCardEditor") {
        const candidate = `${language.assetKey}-card`;
        if (owns(manifest.assets, candidate)) selected = candidate;
    }
    if (mode === "languageTextEditor" || mode === "languageOutlineEditor" || mode === "languageMonoEditor" || mode === "languageCardEditor") {
        const candidate = `${selected}-${editor.embeddedKey}`;
        if (owns(manifest.assets, candidate)) { selected = candidate; embedded = true; }
    }
    const assets: Record<string, string> = {
        large_image: assetUrl(manifest, selected),
        large_text: mode === "editor" ? editor.name : language.name.length >= 2 ? language.name : `${language.name} language`,
    };
    if (mode !== "editor" && !embedded && showSmallEditorIcon) {
        assets.small_image = assetUrl(manifest, editor.assetKey);
        assets.small_text = editor.name;
    }
    return assets;
}
