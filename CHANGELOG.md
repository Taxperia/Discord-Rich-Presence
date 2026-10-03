# Changelog

## [1.2.0] - 2026-10-03

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
