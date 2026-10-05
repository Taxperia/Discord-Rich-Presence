# GitHub-hosted Rich Presence artwork

The extension sends public HTTPS image URLs to Discord's `large_image` and
`small_image` fields. Uploading each PNG to the Developer Portal is no longer
required. The Discord application ID is still used for the IPC connection.

## Folder layout

```text
rich-presence/
  catalog.json                   # Editable language IDs, extensions and editors
  manifest.json                  # Generated catalog, image paths and hashes
  default/                       # Filled text plus *-mono and *-card artwork
  logos/                         # Language logos: javascript.png, ...
  outline/                       # Styled/outlined font: javascript.png, ...
  editors/
    vscode/
      icon.png
      default/                   # Filled text with embedded VS Code logo
      outline/                   # Outlined text with embedded VS Code logo
    cursor/
      icon.png
      default/
      outline/
    taxcode/
      icon.png
      default/
      outline/
```

The `outline` directory is the alternate font style. A native Discord small
badge uses `editors/<editor>/icon.png`; Discord controls its circular shape.
Embedded modes use the editor-specific images and omit that separate badge.
TaxCode is detected from its app name or `taxcode` URI scheme. Plugin-enabled
TaxCode editions use the same extension and all ten artwork modes. The local
UI extension host keeps Discord IPC on the desktop in remote workspaces too.

| Setting | Image path example |
|---|---|
| editor | editors/cursor/icon.png |
| languageText | default/javascript.png |
| languageLogo | logos/javascript.png |
| languageOutline | outline/javascript.png |
| languageTextEditor | editors/cursor/default/javascript.png |
| languageOutlineEditor | editors/cursor/outline/javascript.png |
| languageMono | default/javascript-mono.png |
| languageMonoEditor | editors/cursor/default/javascript-mono.png |
| languageCard | default/javascript-card.png |
| languageCardEditor | editors/cursor/default/javascript-card.png |

Logical keys such as `javascript-outline-cursor` remain in the catalog, but
resolve to URLs instead of Developer Portal asset names. Languages without a
logo use their filled text image. If an embedded variant is missing, its plain
language image is used, with the small editor badge if enabled. Unknown
languages use the generic code artwork.

## Hosting and refresh

The source is the public Taxperia/Discord-Rich-Presence GitHub repository,
branch master, under src/image/rich-presence. The base URL lives in
src/asset-catalog.ts. Image URLs include a content-hash query parameter to
change the cache key when artwork changes; paths stay stable across releases.
This is cache busting, not an immutable archive of old artwork.

At startup the extension uses the last valid manifest saved in global state,
or the manifest bundled into the extension. It checks GitHub in the background
when that cache is older than six hours, and checks again every six hours while
enabled. Fetches have a five-second deadline and a 1 MB limit. Unsupported or
invalid manifests and failed requests leave the existing catalog in place.

Only the catalog is cached locally. Discord still needs access to the public
image URLs; a cached catalog does not make remote images available offline.
The extension requests only the shared manifest, without sending filenames,
workspace names or language selections to GitHub.

**Deployment order:** publish the folders and `manifest.json` to `master`
before distributing an extension build that uses these new paths. Until then,
the new URLs will return 404. Keep existing published paths when adding new
artwork so older cached manifests continue to work.

## Adding languages and artwork

1. Add PNGs to the relevant folders. Filled, outlined, Neon Mono and Tech Card
   base images are generated for built-in languages; logos and embedded editor
   variants are optional for manually added languages.
2. Add the language ID to `catalog.json`, including its display name,
   `assetKey`, `outlineAssetKey` and optional `logoAssetKey`. Add file extension
   mappings without the leading dot. Unambiguous extensions take priority;
   ambiguous `.m` and `.fs` files prefer the editor's language ID.
3. Run `npm run assets:manifest` to regenerate paths and SHA-256 hashes.
4. Run `npm run assets:check` and `npm test`, then publish both the images and
   manifest to the public repository.

For example, default/zig.png, outline/zig.png and optional logos/zig.png
map to zig, zig-outline and zig-logo. An editor variant at
editors/taxcode/outline/zig.png maps to zig-outline-taxcode.

New languages and image variants following schema version 1 become available
after a manifest refresh without rebuilding the extension. New rendering modes
or changes to the manifest schema still require extension code changes.

## Generating artwork

Run `npm run assets` to regenerate the built-in set with the #090808
background and update the manifest. The Neon Mono design uses bold Consolas
with a colored glow and grid. Tech Card deterministically recreates the
black-and-blue geometric reference composition at 512x512. To make an
additional language part of
that generator, also add its text/color definition and optional logo glyph to
scripts/generate-rich-presence-assets.ps1.

The AI-generated design study used to guide the deterministic Tech Card
renderer is stored at `scripts/assets/style-references/tech-card-ai-reference.png`.

Logo glyphs use the MIT-licensed Devicon font. Its license and generator files
are under scripts/vendor/devicon. Embedded Cursor and VS Code artwork comes
from scripts/assets/editor-logos. TaxCode uses the existing project artwork
at `src/image/rich-presence/editors/taxcode/iconwhite.png`. This source is kept
unchanged and excluded from the generated manifest. Its embedded badge is
sized to match the visible Cursor and VS Code glyphs (about 80px high on the
512px canvas).

The product README does not use simulated Discord screenshots. The files in
`src/image/readme` are historical design mockups and are not evidence of the
extension's actual appearance. Real Discord screenshots should be captured and
verified before being added to the product README.
