# Discord Rich Presence assets

Upload every PNG in this directory to the Discord application whose ID is used
by `src/extension.ts`. Keep each asset key identical to its filename without the
`.png` extension. The extension offers six large-image modes:

- `editor`: `cube_2d_dark` in Cursor or `vscode-alt` in Visual Studio Code.
- `languageText`: text assets such as `javascript`, `json`, and `python`.
- `languageTextEditor`: filled text with a small editor logo baked into the
  corner, such as `javascript-vscode` or `javascript-cursor`.
- `languageOutline`: outlined text assets such as `javascript-outline`,
  `json-outline`, and `python-outline`.
- `languageOutlineEditor`: outlined text with a small editor logo baked into the
  corner, such as `javascript-outline-vscode` or `javascript-outline-cursor`.
  Discord's separate small-image badge is omitted in this mode.
- `languageLogo`: logo assets such as `javascript-logo`, `json-logo`, and
  `python-logo`. Languages without a logo automatically use their text asset.

Examples:

- `javascript.png` -> `javascript`
- `javascript-vscode.png` -> `javascript-vscode`
- `javascript-cursor.png` -> `javascript-cursor`
- `javascript-outline.png` -> `javascript-outline`
- `javascript-outline-vscode.png` -> `javascript-outline-vscode`
- `javascript-outline-cursor.png` -> `javascript-outline-cursor`
- `javascript-logo.png` -> `javascript-logo`
- `react.png` -> `react`
- `cube_2d_dark.png` -> `cube_2d_dark`
- `vscode-alt.png` -> `vscode-alt`

Language images are sent as the large image. Cursor or Visual Studio Code is
detected from the extension host and sent as Discord's separate `small_image`.
Discord renders that secondary image as a small circle over the large image;
this is the oval badge shown in the README preview.

Run `powershell -ExecutionPolicy Bypass -File scripts/generate-rich-presence-assets.ps1`
to regenerate the complete set with the `#090808` background.

Logo glyphs are generated from the MIT-licensed Devicon font. Its license and
generator files are kept under `scripts/vendor/devicon`.

The embedded Cursor and Visual Studio Code artwork is taken from the original
reference compositions under `scripts/assets/editor-logos`; it is not redrawn
with simplified geometry.

## README showcase artwork

Run `npm run readme:assets` to regenerate the README previews under
`src/image/readme`. The showcase covers the text, language-logo, and outlined
font modes, plus flat, native oval Discord badge, and glass previews for VS
Code, Cursor, and the planned TaxCode integration.

The TaxCode preview uses the project's own icon stored in
`src/image/readme/sources/taxcode-icon.png`. These README previews are
documentation mockups; only assets uploaded to the Discord Developer Portal
can be used in the live Rich Presence card.
