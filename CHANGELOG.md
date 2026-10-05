# Changelog

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
