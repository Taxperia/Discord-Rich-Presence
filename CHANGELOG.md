# Changelog

## [1.1.7] - 2026-10-06

### Fixed

- Rebuild Tech Card artwork from the supplied transparent technology frame, preserving the original CODE composition and tinting it to each language color.
- Store filled, outline, logo, Neon Mono, and Tech Card artwork in dedicated folders, including separate editor-specific design folders.
- Retain manifest-excluded compatibility mirrors so URLs published in v1.1.6 continue to resolve for clients with cached catalogs.

## [1.1.6] - 2026-10-05

### Added

- Add Neon Mono and geometric Tech Card artwork, each with plain and embedded-editor modes.
- Add Zig, Julia, F#, Objective-C, Objective-C++, Perl, Groovy, OCaml, Nim, Fortran, Visual Basic, Crystal, and COBOL detection.
- Add matching filled, outline, logo, Neon Mono, Tech Card, Cursor, VS Code, and TaxCode artwork for the new languages.
- Add an AI-assisted Tech Card design study and deterministic artwork generator based on the supplied reference.

### Improved

- Expand Rich Presence from six to ten artwork modes and from 43 to 56 language IDs.
- Prefer editor language IDs for ambiguous `.m` and `.fs` extensions while preserving specific extension mappings such as JSX, TSX, and Bash.
- Expand catalog selection and integrity tests across all ten modes and all three editors.

## [1.1.5] - 2026-10-05

### Added

- Detect editor inactivity with a configurable idle timeout and either show an idle presence or clear activity.
- Automatically hide sensitive file names using customizable wildcard patterns.
- Hide Rich Presence in selected workspaces using workspace name or path patterns.
- Add Pause, Resume, Toggle Privacy Mode, and Show Quick Menu commands.
- Open a localized quick-control menu from the status bar.

### Improved

- Resume presence immediately when editing, changing selections, switching editors, or returning to the editor window.
- Keep sensitive file protection independent from full Privacy Mode so workspace information can remain visible.
- Add automated coverage for idle timing, sensitive files, workspace exclusions, and the 1.1.5 extension manifest.

## [1.1.4] - 2026-10-04

### Fixed

- Detect available Discord IPC channels instead of relying only on `discord-ipc-0`.
- Prevent duplicate reconnect attempts and stale reconnect timers.
- Clear connection timeouts correctly after successful or failed handshakes.
- Show the active file's workspace in multi-root projects.
- Safely normalize custom Details and State values for Discord.

### Improved

- Add progressive reconnect delays and clearer connection status messages.
- Expand automated coverage for RPC lifecycle, activity text, and workspace selection.

## [1.1.3] - 2026-10-03

- Correct the release number to 1.1.3 and remove unverified product mockups from the README.

- Serve Rich Presence images from GitHub URLs with content-hash cache keys.
- Separate default text, language logos, outlined text, and editor-specific artwork.
- Add TaxCode icons, embedded variants, and editor detection.
- Declare local UI extension hosting for desktop Discord IPC and document TaxCode installation.
- Add a real TaxCode extension-host smoke test using an isolated profile.
- Load language mappings and asset paths from a validated remote manifest, with cached and bundled fallbacks.
- Update artwork generators and add catalog integrity, selection, and cache tests.

## [1.1.2] - 2026-09-27

### Added
- English and Turkish language selection
- Editor logo, language text, outlined text, filled/outlined text with an embedded editor logo, and language logo artwork modes
- Native circular Discord editor badge using `small_image`
- Privacy mode for hiding file and workspace names
- Toggle for the small Cursor / VS Code icon
- Custom Details and State templates
- Rich Presence enable / disable setting

## [1.0.0] - 2026-08-05

### Added
- Discord Rich Presence entegrasyonu
- Dosya adı gösterimi
- Çalışma alanı adı gösterimi
- Programlama dili algılama (40+ dil)
- Geçen süre (elapsed time) takibi
- Idle modu
- Otomatik bağlantı ve yeniden bağlanma
- Durum çubuğu göstergesi
- Ayarlanabilir konfigürasyon
