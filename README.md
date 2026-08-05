# Cursor Discord Rich Presence

A VS Code / Cursor extension that shows your coding activity on Discord.

[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue)](https://marketplace.visualstudio.com/items?itemName=Taxperia.cursor-discord-presence)
[![Open VSX](https://img.shields.io/badge/Open%20VSX-Marketplace-orange)](https://open-vsx.org/extension/Taxperia/cursor-discord-presence)

## Features

- Shows current file name on Discord
- Shows workspace name
- Detects and displays programming language (40+ languages)
- Tracks elapsed time
- Idle mode when window loses focus
- Auto-connect and reconnect
- Status bar connection indicator

## Discord Preview

![Discord Rich Presence](https://raw.githubusercontent.com/Taxperia/cursor-discord-presence/master/screenshot.png)

## Installation

### Cursor (Recommended)

Open Cursor → Extensions → Search "Cursor Discord Rich Presence" → Install

### VS Code

Open VS Code → Extensions → Search "Cursor Discord Rich Presence" → Install

### Manual Installation

1. Download the latest `.vsix` from [GitHub Releases](https://github.com/Taxperia/cursor-discord-presence/releases)
2. Open Cursor/VS Code
3. Press `Ctrl+Shift+P`
4. Type "Extensions: Install from VSIX..."
5. Select the downloaded `.vsix` file
6. Restart

## Settings

`Ctrl+Shift+P` → "Preferences: Open Settings" → search `cursorDiscord`:

| Setting | Default | Description |
|---------|---------|-------------|
| `showWorkspace` | `true` | Show workspace name on Discord |
| `showFileName` | `true` | Show current file name on Discord |
| `showLanguage` | `true` | Show programming language on Discord |
| `showElapsedTime` | `true` | Show elapsed time on Discord |
| `idleMessage` | `"Idle"` | Message shown when window is not focused |

## Commands

| Command | Description |
|---------|-------------|
| `Discord RPC: Reconnect` | Reconnect to Discord |
| `Discord RPC: Disconnect` | Disconnect from Discord |

## Supported Languages

JavaScript, TypeScript, Python, Java, C++, C, C#, Go, Rust, Ruby, PHP, Swift, Kotlin, HTML, CSS, SCSS, JSON, Markdown, YAML, XML, SQL, Shell, Bash, PowerShell, Docker, TOML, Vue, Svelte, JSX, TSX, Lua, Dart, R, Elixir, Haskell, Scala, Solidity, Terraform and more.

## Requirements

- Cursor or VS Code 1.74 or higher
- Discord desktop app (running)

## Technical Details

- Uses raw Discord IPC Protocol (no external dependencies)
- Uses Named Pipe connection instead of WebSocket (more reliable)
- Sends ping every 30 seconds to keep connection alive
- Total size: ~6KB

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

[Apache License 2.0](LICENSE)
