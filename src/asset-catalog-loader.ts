import * as https from "https";
import { AssetManifest, BUNDLED_MANIFEST, isAssetManifest, MANIFEST_URL } from "./asset-catalog";

export const CATALOG_REFRESH_MS = 6 * 60 * 60 * 1000;
const CACHE_KEY = "richPresence.assetCatalog.v1";
const MAX_BYTES = 1024 * 1024;
type Store = { get(key: string): unknown; update(key: string, value: unknown): PromiseLike<void> };

export function fetchManifest(): Promise<unknown> {
    return new Promise((resolve, reject) => {
        const request = https.get(MANIFEST_URL, { headers: { Accept: "application/json" } }, response => {
            response.on("error", reject);
            response.on("aborted", () => reject(new Error("Asset catalog response aborted")));
            if (response.statusCode !== 200) {
                response.resume();
                reject(new Error(`Asset catalog HTTP ${response.statusCode}`));
                return;
            }
            let size = 0;
            const chunks: Buffer[] = [];
            response.on("data", (chunk: Buffer) => {
                size += chunk.length;
                if (size > MAX_BYTES) request.destroy(new Error("Asset catalog exceeds 1 MB"));
                else chunks.push(chunk);
            });
            response.on("end", () => {
                try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
                catch (error) { reject(error); }
            });
        });
        const deadline = setTimeout(() => request.destroy(new Error("Asset catalog request timed out")), 5000);
        request.on("close", () => clearTimeout(deadline));
        request.on("error", reject);
    });
}

export class AssetCatalogLoader {
    manifest: AssetManifest = BUNDLED_MANIFEST;
    private fetchedAt = 0;
    private pending?: Promise<boolean>;

    constructor(private store: Store, private fetcher = fetchManifest, private now = Date.now) {
        const cached = store.get(CACHE_KEY) as { manifest?: unknown; fetchedAt?: unknown } | undefined;
        if (cached && isAssetManifest(cached.manifest)) {
            this.manifest = cached.manifest;
            if (typeof cached.fetchedAt === "number" && Number.isFinite(cached.fetchedAt) && cached.fetchedAt <= this.now()) this.fetchedAt = cached.fetchedAt;
        }
    }

    refresh(): Promise<boolean> {
        if (this.pending) return this.pending;
        if (this.fetchedAt > 0 && this.now() - this.fetchedAt < CATALOG_REFRESH_MS) return Promise.resolve(false);
        this.pending = this.load().finally(() => { this.pending = undefined; });
        return this.pending;
    }

    private async load(): Promise<boolean> {
        try {
            const manifest = await this.fetcher();
            if (!isAssetManifest(manifest)) throw new Error("Invalid remote asset catalog");
            this.manifest = manifest;
            this.fetchedAt = this.now();
            try { await this.store.update(CACHE_KEY, { manifest, fetchedAt: this.fetchedAt }); }
            catch (error) { console.warn("Could not cache asset catalog:", error); }
            return true;
        } catch (error) {
            console.warn("Using cached or bundled asset catalog:", error);
            return false;
        }
    }
}
