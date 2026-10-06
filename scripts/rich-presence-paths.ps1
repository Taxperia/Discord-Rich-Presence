function Get-RichPresenceAssetPath {
    param([string]$Name)

    switch ($Name) {
        'cube_2d_dark' { return 'editors/cursor/icon.png' }
        'vscode-alt' { return 'editors/vscode/icon.png' }
        'taxcode' { return 'editors/taxcode/icon.png' }
    }
    if ($Name -match '^(.*)-outline-(cursor|vscode|taxcode)$') {
        return "editors/$($Matches[2])/outline/$($Matches[1]).png"
    }
    if ($Name -match '^(.*)-mono-(cursor|vscode|taxcode)$') {
        return "editors/$($Matches[2])/mono/$($Matches[1]).png"
    }
    if ($Name -match '^(.*)-card-(cursor|vscode|taxcode)$') {
        return "editors/$($Matches[2])/card/$($Matches[1]).png"
    }
    if ($Name -match '^(.*)-(cursor|vscode|taxcode)$') {
        return "editors/$($Matches[2])/default/$($Matches[1]).png"
    }
    if ($Name -match '^(.*)-outline$') { return "outline/$($Matches[1]).png" }
    if ($Name -match '^(.*)-mono$') { return "mono/$($Matches[1]).png" }
    if ($Name -match '^(.*)-card$') { return "card/$($Matches[1]).png" }
    if ($Name -match '^(.*)-logo$') { return "logos/$($Matches[1]).png" }
    return "default/$Name.png"
}
