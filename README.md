# Cursor Discord Rich Presence

A VS Code / Cursor extension that shows your coding activity on Discord.

## Features

- Shows current file name on Discord
- Shows workspace name
- Detects and displays programming language
- Tracks elapsed time
- Idle mode when window loses focus
- Auto-connect and reconnect
- Status bar connection indicator

## Discord Preview

![Discord Rich Presence](https://raw.githubusercontent.com/Taxperia/cursor-discord-presence/master/screenshot.png)

## Installation

### Method 1: VSIX Installation

1. Download the `cursor-discord-presence-1.0.4.vsix` file
2. Open Cursor
3. Press `Ctrl+Shift+P`
4. Type "Extensions: Install from VSIX..."
5. Select the downloaded `.vsix` file
6. Restart Cursor

### Method 2: Build from Source

```bash
git clone https://github.com/your-username/cursor-discord-presence.git
cd cursor-discord-presence
npm install
npm run build
```

Then press `F5` to run in debug mode in Cursor.

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

- Cursor (or VS Code) 1.74 or higher
- Discord desktop app (running)

## Technical Details

- Uses raw Discord IPC Protocol (no external dependencies)
- Uses Named Pipe connection instead of WebSocket (more reliable)
- Sends ping every 30 seconds to keep connection alive
- Total size: ~6KB

## License

MIT
