param(
    [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\src\image\readme")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "rich-presence-paths.ps1")
Add-Type -AssemblyName System.Drawing

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$richDirectory = Join-Path $repoRoot "src\image\rich-presence"
$vscodeReference = Join-Path $PSScriptRoot "assets\editor-logos\vscode-reference.png"
$cursorReference = Join-Path $PSScriptRoot "assets\editor-logos\cursor-reference.png"
$taxcodeReference = Join-Path $richDirectory "editors\taxcode\iconwhite.png"
$background = [System.Drawing.ColorTranslator]::FromHtml("#090808")
$panel = [System.Drawing.ColorTranslator]::FromHtml("#111318")
$muted = [System.Drawing.ColorTranslator]::FromHtml("#9CA3AF")
$white = [System.Drawing.ColorTranslator]::FromHtml("#F8FAFC")
$accent = [System.Drawing.ColorTranslator]::FromHtml("#38BDF8")
$gold = [System.Drawing.ColorTranslator]::FromHtml("#F7C843")

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

function New-RoundedRectanglePath {
    param(
        [System.Drawing.RectangleF]$Rectangle,
        [single]$Radius
    )

    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $diameter = $Radius * 2
    $arc = [System.Drawing.RectangleF]::new($Rectangle.X, $Rectangle.Y, $diameter, $diameter)
    $path.AddArc($arc, 180, 90)
    $arc.X = $Rectangle.Right - $diameter
    $path.AddArc($arc, 270, 90)
    $arc.Y = $Rectangle.Bottom - $diameter
    $path.AddArc($arc, 0, 90)
    $arc.X = $Rectangle.X
    $path.AddArc($arc, 90, 90)
    $path.CloseFigure()
    return $path
}

function New-ReadmeCanvas {
    param([int]$Width, [int]$Height)

    $bitmap = [System.Drawing.Bitmap]::new($Width, $Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $gradient = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
        [System.Drawing.Rectangle]::new(0, 0, $Width, $Height),
        $background,
        [System.Drawing.ColorTranslator]::FromHtml("#111827"),
        25.0
    )
    $graphics.FillRectangle($gradient, 0, 0, $Width, $Height)
    $gradient.Dispose()
    return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function New-RichPresenceCanvas {
    $bitmap = [System.Drawing.Bitmap]::new(1024, 1024)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $graphics.Clear($background)
    return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function Save-ReadmeCanvas {
    param([hashtable]$Canvas, [string]$Name)

    $path = Join-Path $OutputDirectory "$Name.png"
    try {
        $Canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
        $Canvas.Graphics.Dispose()
        $Canvas.Bitmap.Dispose()
    }
}

function Draw-CenteredText {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$Text,
        [System.Drawing.RectangleF]$Rectangle,
        [single]$Size,
        [System.Drawing.Color]$Color,
        [System.Drawing.FontStyle]$Style = [System.Drawing.FontStyle]::Bold
    )

    $font = [System.Drawing.Font]::new("Segoe UI", $Size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
    $brush = [System.Drawing.SolidBrush]::new($Color)
    $format = [System.Drawing.StringFormat]::new()
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $format.FormatFlags = [System.Drawing.StringFormatFlags]::NoWrap
    try {
        $Graphics.DrawString($Text, $font, $brush, $Rectangle, $format)
    }
    finally {
        $format.Dispose()
        $brush.Dispose()
        $font.Dispose()
    }
}

function Draw-OutlinedText {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$Text,
        [System.Drawing.RectangleF]$Rectangle,
        [single]$Size,
        [System.Drawing.Color]$Color
    )

    $family = [System.Drawing.FontFamily]::new("Arial Black")
    $format = [System.Drawing.StringFormat]::new()
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $format.FormatFlags = [System.Drawing.StringFormatFlags]::NoWrap
    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $glow = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(70, $Color.R, $Color.G, $Color.B), 14)
    $pen = [System.Drawing.Pen]::new($Color, 5)
    $glow.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    try {
        $path.AddString($Text, $family, [int][System.Drawing.FontStyle]::Regular, $Size, $Rectangle, $format)
        $Graphics.DrawPath($glow, $path)
        $Graphics.DrawPath($pen, $path)
    }
    finally {
        $pen.Dispose()
        $glow.Dispose()
        $path.Dispose()
        $format.Dispose()
        $family.Dispose()
    }
}

function Draw-ReferenceLogo {
    param(
        [System.Drawing.Graphics]$Graphics,
        [ValidateSet("vscode", "cursor", "taxcode")]
        [string]$Editor,
        [System.Drawing.Rectangle]$Destination
    )

    if ($Editor -eq "taxcode") {
        $image = [System.Drawing.Image]::FromFile($taxcodeReference)
        try {
            $Graphics.DrawImage(
                $image,
                $Destination,
                0,
                0,
                $image.Width,
                $image.Height,
                [System.Drawing.GraphicsUnit]::Pixel
            )
        }
        finally {
            $image.Dispose()
        }
        return
    }

    $path = if ($Editor -eq "vscode") { $vscodeReference } else { $cursorReference }
    $image = [System.Drawing.Image]::FromFile($path)
    $attributes = [System.Drawing.Imaging.ImageAttributes]::new()
    try {
        $attributes.SetColorKey(
            [System.Drawing.Color]::FromArgb(0, 0, 0),
            [System.Drawing.Color]::FromArgb(32, 32, 32)
        )
        $source = if ($Editor -eq "vscode") {
            [System.Drawing.Rectangle]::new(1005, 1000, 198, 195)
        }
        else {
            [System.Drawing.Rectangle]::new(1028, 1018, 205, 216)
        }
        $Graphics.DrawImage(
            $image,
            $Destination,
            $source.X,
            $source.Y,
            $source.Width,
            $source.Height,
            [System.Drawing.GraphicsUnit]::Pixel,
            $attributes
        )
    }
    finally {
        $attributes.Dispose()
        $image.Dispose()
    }
}

function Draw-EditorBadge {
    param(
        [System.Drawing.Graphics]$Graphics,
        [ValidateSet("vscode", "cursor", "taxcode")]
        [string]$Editor,
        [ValidateSet("flat", "oval", "glass")]
        [string]$Style,
        [System.Drawing.Rectangle]$Rectangle
    )

    $state = $Graphics.Save()
    try {
        if ($Style -eq "oval") {
            $outerBrush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#2B2D31"))
            $fillBrush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#3F4147"))
            try {
                $Graphics.FillEllipse($outerBrush, $Rectangle.X - 12, $Rectangle.Y - 12, $Rectangle.Width + 24, $Rectangle.Height + 24)
                $Graphics.FillEllipse($fillBrush, $Rectangle)
            }
            finally {
                $fillBrush.Dispose()
                $outerBrush.Dispose()
            }
        }
        elseif ($Style -eq "glass") {
            $outer = [System.Drawing.RectangleF]::new($Rectangle.X - 8, $Rectangle.Y - 8, $Rectangle.Width + 16, $Rectangle.Height + 16)
            $path = New-RoundedRectanglePath -Rectangle $outer -Radius 22
            $fillBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(215, 24, 32, 50))
            $borderPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(210, 125, 211, 252), 4)
            try {
                $Graphics.FillPath($fillBrush, $path)
                $Graphics.DrawPath($borderPen, $path)
            }
            finally {
                $borderPen.Dispose()
                $fillBrush.Dispose()
                $path.Dispose()
            }
        }

        $logoRect = [System.Drawing.Rectangle]::new(
            $Rectangle.X + 14,
            $Rectangle.Y + 14,
            $Rectangle.Width - 28,
            $Rectangle.Height - 28
        )

        Draw-ReferenceLogo -Graphics $Graphics -Editor $Editor -Destination $logoRect
    }
    finally {
        $Graphics.Restore($state)
    }
}

function New-EditorMockup {
    param(
        [ValidateSet("vscode", "cursor", "taxcode")]
        [string]$Editor,
        [ValidateSet("flat", "oval", "glass")]
        [string]$Style
    )

    $canvas = New-RichPresenceCanvas
    $graphics = $canvas.Graphics
    $languageImage = [System.Drawing.Image]::FromFile((Join-Path $richDirectory (Get-RichPresenceAssetPath "javascript")))
    try {
        if ($Style -eq "flat") {
            $graphics.DrawImage($languageImage, [System.Drawing.Rectangle]::new(0, 0, 1024, 1024))
            Draw-EditorBadge -Graphics $graphics -Editor $Editor -Style $Style -Rectangle ([System.Drawing.Rectangle]::new(824, 824, 190, 190))
        }
        elseif ($Style -eq "oval") {
            $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml("#2B2D31"))
            $largeRect = [System.Drawing.RectangleF]::new(70, 70, 820, 820)
            $largePath = New-RoundedRectanglePath -Rectangle $largeRect -Radius 72
            $state = $graphics.Save()
            try {
                $graphics.SetClip($largePath)
                $graphics.DrawImage($languageImage, [System.Drawing.Rectangle]::new(70, 70, 820, 820))
            }
            finally {
                $graphics.Restore($state)
                $largePath.Dispose()
            }
            Draw-EditorBadge -Graphics $graphics -Editor $Editor -Style $Style -Rectangle ([System.Drawing.Rectangle]::new(785, 785, 180, 180))
        }
        else {
            $graphics.DrawImage($languageImage, [System.Drawing.Rectangle]::new(0, 0, 1024, 1024))
            Draw-EditorBadge -Graphics $graphics -Editor $Editor -Style $Style -Rectangle ([System.Drawing.Rectangle]::new(824, 824, 180, 180))
        }
    }
    finally {
        $languageImage.Dispose()
    }

    Save-ReadmeCanvas -Canvas $canvas -Name "$Editor-$Style"
}

function New-MainShowcase {
    $canvas = New-ReadmeCanvas -Width 1600 -Height 1240
    $graphics = $canvas.Graphics
    Draw-CenteredText -Graphics $graphics -Text "DISCORD CODING PRESENCE" -Rectangle ([System.Drawing.RectangleF]::new(90, 35, 1420, 72)) -Size 38 -Color $white
    Draw-CenteredText -Graphics $graphics -Text "TEXT / LOGO / STYLED FONT" -Rectangle ([System.Drawing.RectangleF]::new(90, 100, 1420, 48)) -Size 24 -Color $accent

    $cards = @(
        @{ Label = "MAIN TEXT"; File = "javascript.png" },
        @{ Label = "LANGUAGE LOGO"; File = "javascript-logo.png" },
        @{ Label = "STYLED FONT"; File = "javascript-outline.png" }
    )
    for ($i = 0; $i -lt $cards.Count; $i++) {
        $x = 80 + ($i * 500)
        $rect = [System.Drawing.RectangleF]::new($x, 185, 440, 560)
        $path = New-RoundedRectanglePath -Rectangle $rect -Radius 26
        $fill = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(225, 12, 14, 18))
        $border = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(75, 148, 163, 184), 2)
        try {
            $graphics.FillPath($fill, $path)
            $graphics.DrawPath($border, $path)
            $assetKey = [System.IO.Path]::GetFileNameWithoutExtension($cards[$i].File)
            $image = [System.Drawing.Image]::FromFile((Join-Path $richDirectory (Get-RichPresenceAssetPath $assetKey)))
            try {
                $graphics.DrawImage($image, [System.Drawing.Rectangle]::new($x + 50, 225, 340, 340))
            }
            finally {
                $image.Dispose()
            }
            Draw-CenteredText -Graphics $graphics -Text $cards[$i].Label -Rectangle ([System.Drawing.RectangleF]::new($x + 20, 585, 400, 55)) -Size 25 -Color $white
        }
        finally {
            $border.Dispose()
            $fill.Dispose()
            $path.Dispose()
        }
    }

    Draw-CenteredText -Graphics $graphics -Text "VS CODE" -Rectangle ([System.Drawing.RectangleF]::new(400, 800, 190, 42)) -Size 21 -Color $muted
    Draw-CenteredText -Graphics $graphics -Text "CURSOR" -Rectangle ([System.Drawing.RectangleF]::new(710, 800, 190, 42)) -Size 21 -Color $muted
    Draw-CenteredText -Graphics $graphics -Text "TAXCODE" -Rectangle ([System.Drawing.RectangleF]::new(1020, 800, 190, 42)) -Size 21 -Color $muted
    Draw-EditorBadge -Graphics $graphics -Editor "vscode" -Style "flat" -Rectangle ([System.Drawing.Rectangle]::new(330, 770, 90, 90))
    Draw-EditorBadge -Graphics $graphics -Editor "cursor" -Style "flat" -Rectangle ([System.Drawing.Rectangle]::new(640, 770, 90, 90))
    Draw-EditorBadge -Graphics $graphics -Editor "taxcode" -Style "flat" -Rectangle ([System.Drawing.Rectangle]::new(950, 770, 90, 90))

    Save-ReadmeCanvas -Canvas $canvas -Name "main-showcase"
}

function New-BadgeGrid {
    $canvas = New-ReadmeCanvas -Width 1600 -Height 900
    $graphics = $canvas.Graphics
    Draw-CenteredText -Graphics $graphics -Text "EDITOR BADGE STYLES" -Rectangle ([System.Drawing.RectangleF]::new(100, 30, 1400, 70)) -Size 40 -Color $white
    Draw-CenteredText -Graphics $graphics -Text "FLAT / DISCORD BADGE / GLASS" -Rectangle ([System.Drawing.RectangleF]::new(100, 95, 1400, 45)) -Size 23 -Color $accent

    $editors = @("vscode", "cursor", "taxcode")
    $styles = @("flat", "oval", "glass")
    for ($column = 0; $column -lt $editors.Count; $column++) {
        $heading = switch ($editors[$column]) { "vscode" { "VS CODE" } "cursor" { "CURSOR" } default { "TAXCODE (PLANNED)" } }
        $x = 210 + ($column * 450)
        Draw-CenteredText -Graphics $graphics -Text $heading -Rectangle ([System.Drawing.RectangleF]::new($x, 145, 320, 45)) -Size 24 -Color $white
        for ($row = 0; $row -lt $styles.Count; $row++) {
            $y = 200 + ($row * 340)
            $preview = [System.Drawing.Image]::FromFile((Join-Path $OutputDirectory "$($editors[$column])-$($styles[$row]).png"))
            $border = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(70, 148, 163, 184), 2)
            try {
                $graphics.DrawImage($preview, [System.Drawing.Rectangle]::new($x, $y, 320, 320))
                $graphics.DrawRectangle($border, $x, $y, 320, 320)
            }
            finally {
                $preview.Dispose()
                $border.Dispose()
            }
        }
    }

    for ($row = 0; $row -lt $styles.Count; $row++) {
        $styleLabel = if ($styles[$row] -eq "oval") { "DISCORD`nBADGE" } else { $styles[$row].ToUpperInvariant() }
        Draw-CenteredText -Graphics $graphics -Text $styleLabel -Rectangle ([System.Drawing.RectangleF]::new(20, 200 + ($row * 340), 170, 320)) -Size 20 -Color $muted
    }

    Save-ReadmeCanvas -Canvas $canvas -Name "editor-badge-styles"
}

foreach ($required in @($vscodeReference, $cursorReference, $taxcodeReference)) {
    if (-not (Test-Path -LiteralPath $required)) {
        throw "Required README artwork source is missing: $required"
    }
}

New-MainShowcase
foreach ($editor in @("vscode", "cursor", "taxcode")) {
    foreach ($style in @("flat", "oval", "glass")) {
        New-EditorMockup -Editor $editor -Style $style
    }
}
New-BadgeGrid

Write-Output "Generated 11 README showcase images in $([System.IO.Path]::GetFullPath($OutputDirectory))"
