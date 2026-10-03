param(
    [string]$TaxCodePath = (Join-Path $env:LOCALAPPDATA "Programs\TaxCode\TaxCode.exe")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
if (-not (Test-Path -LiteralPath $TaxCodePath)) { throw "TaxCode executable not found: $TaxCodePath" }
$testRoot = Join-Path $repoRoot (".vscode-test\taxcode-" + [guid]::NewGuid().ToString('N'))
$profile = Join-Path $testRoot "user-data"
$extensions = Join-Path $testRoot "extensions"
$settingsDirectory = Join-Path $profile "User"
New-Item -ItemType Directory -Force -Path $settingsDirectory, $extensions | Out-Null
$settings = @{
    'cursorDiscord.enabled' = $false
    'workbench.startupEditor' = 'none'
    'security.workspace.trust.enabled' = $false
    'extensions.autoUpdate' = $false
    'extensions.autoCheckUpdates' = $false
    'update.mode' = 'none'
    'telemetry.telemetryLevel' = 'off'
    'taxcode.update.checkOnStartup' = $false
}
[System.IO.File]::WriteAllText((Join-Path $settingsDirectory 'settings.json'), ($settings | ConvertTo-Json))
Push-Location $repoRoot
$previousElectronMode = $env:ELECTRON_RUN_AS_NODE
try {
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Extension build failed' }
    $entry = Join-Path $testRoot 'host-test.cjs'
    & (Join-Path $repoRoot 'node_modules\.bin\esbuild.cmd') tests/taxcode-host.ts --bundle --platform=node --format=cjs --external:vscode "--outfile=$entry"
    if ($LASTEXITCODE -ne 0) { throw 'TaxCode test build failed' }
    $arguments = @(
        "--user-data-dir=`"$profile`"",
        "--extensions-dir=`"$extensions`"",
        "--extensionDevelopmentPath=`"$repoRoot`"",
        "--extensionTestsPath=`"$entry`"",
        '--disable-extensions', '--disable-gpu', '--skip-welcome', '--skip-release-notes', '--new-window'
    )
    # Some development shells inherit Electron's Node-only mode.
    $env:ELECTRON_RUN_AS_NODE = $null
    $process = Start-Process -FilePath $TaxCodePath -ArgumentList $arguments -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $testRoot 'stdout.log') -RedirectStandardError (Join-Path $testRoot 'stderr.log')
    $env:ELECTRON_RUN_AS_NODE = $previousElectronMode
    if (-not $process.WaitForExit(60000)) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        throw "TaxCode test timed out. Logs: $profile\logs"
    }
    $report = Join-Path $testRoot 'result.json'
    if (-not (Test-Path -LiteralPath $report)) { throw "TaxCode test failed. Logs: $profile\logs" }
    Get-Content -LiteralPath $report
}
finally {
    $env:ELECTRON_RUN_AS_NODE = $previousElectronMode
    Pop-Location
}
