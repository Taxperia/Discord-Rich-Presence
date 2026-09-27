param(
    [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\src\image\rich-presence")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$canvasSize = 512
$background = [System.Drawing.ColorTranslator]::FromHtml("#090808")
$fontFamily = [System.Drawing.FontFamily]::new("Arial Black")
$fontStyle = [System.Drawing.FontStyle]::Regular
$deviconDirectory = Join-Path $PSScriptRoot "vendor\devicon"
$deviconFontPath = Join-Path $deviconDirectory "devicon.ttf"
$deviconCssPath = Join-Path $deviconDirectory "devicon.min.css"
$editorLogoDirectory = Join-Path $PSScriptRoot "assets\editor-logos"
$cursorLogoReference = Join-Path $editorLogoDirectory "cursor-reference.png"
$vscodeLogoReference = Join-Path $editorLogoDirectory "vscode-reference.png"

$assets = @(
    @{ Key = "code";       Text = "CODE";     Color = "#E6E6E6" },
    @{ Key = "javascript"; Text = "JS";       Color = "#F7DF1E" },
    @{ Key = "typescript"; Text = "TS";       Color = "#3178C6" },
    @{ Key = "python";     Text = "Python";   Color = "#FFD43B" },
    @{ Key = "java";       Text = "Java";     Color = "#F89820" },
    @{ Key = "cpp";        Text = "C++";      Color = "#659AD2" },
    @{ Key = "c";          Text = "C";        Color = "#A8B9CC" },
    @{ Key = "csharp";     Text = "C#";       Color = "#9B4F96" },
    @{ Key = "go";         Text = "Go";       Color = "#00ADD8" },
    @{ Key = "rust";       Text = "Rust";     Color = "#CE422B" },
    @{ Key = "ruby";       Text = "Ruby";     Color = "#CC342D" },
    @{ Key = "php";        Text = "PHP";      Color = "#777BB4" },
    @{ Key = "swift";      Text = "Swift";    Color = "#F05138" },
    @{ Key = "kotlin";     Text = "Kotlin";   Color = "#A97BFF" },
    @{ Key = "html";       Text = "HTML";     Color = "#E34F26" },
    @{ Key = "css";        Text = "CSS";      Color = "#1572B6" },
    @{ Key = "scss";       Text = "SCSS";     Color = "#CC6699" },
    @{ Key = "json";       Text = "JSON";     Color = "#F2C94C" },
    @{ Key = "markdown";   Text = "MD";       Color = "#519ABA" },
    @{ Key = "yaml";       Text = "YAML";     Color = "#CB171E" },
    @{ Key = "xml";        Text = "XML";      Color = "#E37933" },
    @{ Key = "sql";        Text = "SQL";      Color = "#336791" },
    @{ Key = "shell";      Text = "SH";       Color = "#89E051" },
    @{ Key = "bash";       Text = "Bash";     Color = "#4EAA25" },
    @{ Key = "powershell"; Text = "PS";       Color = "#5391FE" },
    @{ Key = "docker";     Text = "Docker";   Color = "#2496ED" },
    @{ Key = "toml";       Text = "TOML";     Color = "#9C4121" },
    @{ Key = "ini";        Text = "INI";      Color = "#00A67E" },
    @{ Key = "vue";        Text = "Vue";      Color = "#42B883" },
    @{ Key = "svelte";     Text = "Svelte";   Color = "#FF3E00" },
    @{ Key = "react";      Text = "React";    Color = "#61DAFB" },
    @{ Key = "graphql";    Text = "GQL";      Color = "#E10098" },
    @{ Key = "lua";        Text = "Lua";      Color = "#5C6BC0" },
    @{ Key = "dart";       Text = "Dart";     Color = "#00B4AB" },
    @{ Key = "r";          Text = "R";        Color = "#75AADB" },
    @{ Key = "elixir";     Text = "EX";       Color = "#8E5A9F" },
    @{ Key = "erlang";     Text = "ERL";      Color = "#B83998" },
    @{ Key = "haskell";    Text = "HS";       Color = "#5D4F85" },
    @{ Key = "clojure";    Text = "CLJ";      Color = "#5881D8" },
    @{ Key = "scala";      Text = "Scala";    Color = "#DC322F" },
    @{ Key = "solidity";   Text = "SOL";      Color = "#C8C8C8" },
    @{ Key = "terraform";  Text = "TF";       Color = "#844FBA" },
    @{ Key = "hcl";        Text = "HCL";      Color = "#E6B422" }
)

$logoAssets = @(
    @{ Key = "javascript"; Class = "javascript-plain";       Color = "#F7DF1E" },
    @{ Key = "typescript"; Class = "typescript-plain";       Color = "#3178C6" },
    @{ Key = "python";     Class = "python-plain";           Color = "#FFD43B" },
    @{ Key = "java";       Class = "java-plain";             Color = "#F89820" },
    @{ Key = "cpp";        Class = "cplusplus-plain";        Color = "#659AD2" },
    @{ Key = "c";          Class = "c-plain";                Color = "#A8B9CC" },
    @{ Key = "csharp";     Class = "csharp-plain";           Color = "#9B4F96" },
    @{ Key = "go";         Class = "go-original-wordmark";   Color = "#00ADD8" },
    @{ Key = "rust";       Class = "rust-original";          Color = "#CE422B" },
    @{ Key = "ruby";       Class = "ruby-plain";             Color = "#CC342D" },
    @{ Key = "php";        Class = "php-plain";              Color = "#777BB4" },
    @{ Key = "swift";      Class = "swift-plain";            Color = "#F05138" },
    @{ Key = "kotlin";     Class = "kotlin-plain";           Color = "#A97BFF" },
    @{ Key = "html";       Class = "html5-plain";            Color = "#E34F26" },
    @{ Key = "css";        Class = "css3-plain";             Color = "#1572B6" },
    @{ Key = "scss";       Class = "sass-original";          Color = "#CC6699" },
    @{ Key = "json";       Class = "json-plain";             Color = "#F2C94C" },
    @{ Key = "markdown";   Class = "markdown-original";      Color = "#519ABA" },
    @{ Key = "yaml";       Class = "yaml-plain";             Color = "#CB171E" },
    @{ Key = "xml";        Class = "xml-plain";              Color = "#E37933" },
    @{ Key = "sql";        Class = "azuresqldatabase-plain"; Color = "#336791" },
    @{ Key = "shell";      Class = "bash-plain";             Color = "#89E051" },
    @{ Key = "bash";       Class = "bash-plain";             Color = "#4EAA25" },
    @{ Key = "powershell"; Class = "powershell-plain";       Color = "#5391FE" },
    @{ Key = "docker";     Class = "docker-plain";           Color = "#2496ED" },
    @{ Key = "vue";        Class = "vuejs-plain";            Color = "#42B883" },
    @{ Key = "svelte";     Class = "svelte-plain";           Color = "#FF3E00" },
    @{ Key = "react";      Class = "react-original";         Color = "#61DAFB" },
    @{ Key = "graphql";    Class = "graphql-plain";          Color = "#E10098" },
    @{ Key = "lua";        Class = "lua-plain";              Color = "#5C6BC0" },
    @{ Key = "dart";       Class = "dart-plain";             Color = "#00B4AB" },
    @{ Key = "r";          Class = "r-plain";                Color = "#75AADB" },
    @{ Key = "elixir";     Class = "elixir-plain";           Color = "#8E5A9F" },
    @{ Key = "erlang";     Class = "erlang-plain";           Color = "#B83998" },
    @{ Key = "haskell";    Class = "haskell-plain";          Color = "#5D4F85" },
    @{ Key = "clojure";    Class = "clojure-plain";          Color = "#5881D8" },
    @{ Key = "scala";      Class = "scala-plain";            Color = "#DC322F" },
    @{ Key = "solidity";   Class = "solidity-plain";         Color = "#C8C8C8" },
    @{ Key = "terraform";  Class = "terraform-plain";        Color = "#844FBA" }
)

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

function New-Canvas {
    $bitmap = [System.Drawing.Bitmap]::new($canvasSize, $canvasSize)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.Clear($background)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function Save-Canvas {
    param(
        [hashtable]$Canvas,
        [string]$Name
    )

    $outputPath = Join-Path $OutputDirectory "$Name.png"
    try {
        $Canvas.Bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
        $Canvas.Graphics.Dispose()
        $Canvas.Bitmap.Dispose()
    }
}

function New-TextAsset {
    param(
        [string]$Name,
        [string]$Text,
        [string]$Color,
        [ValidateSet("", "cursor", "vscode")]
        [string]$Editor = ""
    )

    $canvas = New-Canvas
    $graphics = $canvas.Graphics
    $maxWidth = 440.0
    $maxHeight = 300.0
    $low = 20.0
    $high = 300.0

    for ($i = 0; $i -lt 12; $i++) {
        $size = ($low + $high) / 2.0
        $font = [System.Drawing.Font]::new($fontFamily, $size, $fontStyle, [System.Drawing.GraphicsUnit]::Pixel)
        try {
            $bounds = $graphics.MeasureString($Text, $font)
            if ($bounds.Width -le $maxWidth -and $bounds.Height -le $maxHeight) {
                $low = $size
            }
            else {
                $high = $size
            }
        }
        finally {
            $font.Dispose()
        }
    }

    $finalFont = [System.Drawing.Font]::new($fontFamily, $low, $fontStyle, [System.Drawing.GraphicsUnit]::Pixel)
    $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($Color))
    $format = [System.Drawing.StringFormat]::new()
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $format.FormatFlags = [System.Drawing.StringFormatFlags]::NoWrap

    try {
        $layout = [System.Drawing.RectangleF]::new(24, 24, 464, 464)
        $graphics.DrawString($Text, $finalFont, $brush, $layout, $format)
        if ($Editor) {
            Draw-EmbeddedEditorGlyph -Graphics $graphics -Editor $Editor
        }
    }
    finally {
        $format.Dispose()
        $brush.Dispose()
        $finalFont.Dispose()
    }

    $suffix = if ($Editor) { "-$Editor" } else { "" }
    Save-Canvas -Canvas $canvas -Name "$Name$suffix"
}

function Draw-EmbeddedEditorGlyph {
    param(
        [System.Drawing.Graphics]$Graphics,
        [ValidateSet("cursor", "vscode")]
        [string]$Editor
    )

    $referencePath = if ($Editor -eq "cursor") { $cursorLogoReference } else { $vscodeLogoReference }
    if (-not (Test-Path -LiteralPath $referencePath)) {
        throw "Editor logo reference is missing: $referencePath"
    }

    $reference = [System.Drawing.Image]::FromFile($referencePath)
    $imageAttributes = [System.Drawing.Imaging.ImageAttributes]::new()
    $previousInterpolation = $Graphics.InterpolationMode
    try {
        $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $source = [System.Drawing.Rectangle]::new(760, 760, 494, 494)
        $destination = [System.Drawing.Rectangle]::new(310, 310, 202, 202)
        $transparentLow = [System.Drawing.Color]::FromArgb(0, 0, 0)
        $transparentHigh = [System.Drawing.Color]::FromArgb(32, 32, 32)
        $imageAttributes.SetColorKey($transparentLow, $transparentHigh)
        $Graphics.DrawImage(
            $reference,
            $destination,
            $source.X,
            $source.Y,
            $source.Width,
            $source.Height,
            [System.Drawing.GraphicsUnit]::Pixel,
            $imageAttributes
        )
    }
    finally {
        $Graphics.InterpolationMode = $previousInterpolation
        $imageAttributes.Dispose()
        $reference.Dispose()
    }
}

function New-OutlineTextAsset {
    param(
        [string]$Name,
        [string]$Text,
        [string]$Color,
        [ValidateSet("", "cursor", "vscode")]
        [string]$Editor = ""
    )

    $canvas = New-Canvas
    $graphics = $canvas.Graphics
    $maxWidth = 400.0
    $maxHeight = 260.0
    $low = 20.0
    $high = 300.0
    $format = [System.Drawing.StringFormat]::new([System.Drawing.StringFormat]::GenericTypographic)
    $format.FormatFlags = $format.FormatFlags -bor [System.Drawing.StringFormatFlags]::NoWrap -bor [System.Drawing.StringFormatFlags]::NoClip

    for ($i = 0; $i -lt 12; $i++) {
        $size = ($low + $high) / 2.0
        $testPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
        try {
            $testPath.AddString($Text, $fontFamily, [int]$fontStyle, [single]$size, [System.Drawing.PointF]::Empty, $format)
            $bounds = $testPath.GetBounds()
            if ($bounds.Width -le $maxWidth -and $bounds.Height -le $maxHeight) {
                $low = $size
            }
            else {
                $high = $size
            }
        }
        finally {
            $testPath.Dispose()
        }
    }

    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $outlineColor = [System.Drawing.ColorTranslator]::FromHtml($Color)
    $glowColor = [System.Drawing.Color]::FromArgb(70, $outlineColor.R, $outlineColor.G, $outlineColor.B)
    $glowPen = [System.Drawing.Pen]::new($glowColor, [Math]::Max(10.0, $low * 0.07))
    $outlinePen = [System.Drawing.Pen]::new($outlineColor, [Math]::Max(4.0, $low * 0.025))
    $glowPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $outlinePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    try {
        $path.AddString($Text, $fontFamily, [int]$fontStyle, [single]$low, [System.Drawing.PointF]::Empty, $format)
        $bounds = $path.GetBounds()
        $matrix = [System.Drawing.Drawing2D.Matrix]::new()
        try {
            $offsetX = (($canvasSize - $bounds.Width) / 2.0) - $bounds.X
            $offsetY = (($canvasSize - $bounds.Height) / 2.0) - $bounds.Y
            $matrix.Translate([single]$offsetX, [single]$offsetY)
            $path.Transform($matrix)
        }
        finally {
            $matrix.Dispose()
        }
        $graphics.DrawPath($glowPen, $path)
        $graphics.DrawPath($outlinePen, $path)
        if ($Editor) {
            Draw-EmbeddedEditorGlyph -Graphics $graphics -Editor $Editor
        }
    }
    finally {
        $outlinePen.Dispose()
        $glowPen.Dispose()
        $path.Dispose()
        $format.Dispose()
    }

    $suffix = if ($Editor) { "-outline-$Editor" } else { "-outline" }
    Save-Canvas -Canvas $canvas -Name "$Name$suffix"
}

function New-LogoAsset {
    param(
        [string]$Name,
        [string]$Class,
        [string]$Color,
        [System.Drawing.FontFamily]$LogoFontFamily,
        [string]$Css
    )

    $selector = [regex]::Escape(".devicon-$Class`:before")
    $match = [regex]::Match($Css, $selector + '[^{]*\{content:"([^"]+)"\}')
    if (-not $match.Success) {
        Write-Warning "Devicon glyph not found for $Class; $Name-logo.png was skipped."
        return $false
    }

    $canvas = New-Canvas
    $graphics = $canvas.Graphics
    $font = [System.Drawing.Font]::new($LogoFontFamily, 340, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($Color))
    $format = [System.Drawing.StringFormat]::new()
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center

    try {
        $layout = [System.Drawing.RectangleF]::new(46, 34, 420, 420)
        $graphics.DrawString($match.Groups[1].Value, $font, $brush, $layout, $format)
    }
    finally {
        $format.Dispose()
        $brush.Dispose()
        $font.Dispose()
    }

    Save-Canvas -Canvas $canvas -Name "$Name-logo"
    return $true
}

function New-CursorAsset {
    $canvas = New-Canvas
    $graphics = $canvas.Graphics
    $white = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
    $dark = [System.Drawing.SolidBrush]::new($background)

    try {
        $outer = [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(256, 44),
            [System.Drawing.Point]::new(444, 152),
            [System.Drawing.Point]::new(444, 368),
            [System.Drawing.Point]::new(256, 476),
            [System.Drawing.Point]::new(68, 368),
            [System.Drawing.Point]::new(68, 152)
        )
        $graphics.FillPolygon($white, $outer)

        $top = [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(256, 116),
            [System.Drawing.Point]::new(378, 186),
            [System.Drawing.Point]::new(256, 256),
            [System.Drawing.Point]::new(134, 186)
        )
        $left = [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(134, 186),
            [System.Drawing.Point]::new(256, 256),
            [System.Drawing.Point]::new(256, 406),
            [System.Drawing.Point]::new(134, 336)
        )
        $graphics.FillPolygon($dark, $top)
        $graphics.FillPolygon($dark, $left)
    }
    finally {
        $dark.Dispose()
        $white.Dispose()
    }

    Save-Canvas -Canvas $canvas -Name "cube_2d_dark"
}

function New-VsCodeAsset {
    $canvas = New-Canvas
    $graphics = $canvas.Graphics
    $blue = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#23A8F2"))
    $dark = [System.Drawing.SolidBrush]::new($background)

    try {
        $outer = [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(397, 46),
            [System.Drawing.Point]::new(470, 82),
            [System.Drawing.Point]::new(470, 430),
            [System.Drawing.Point]::new(397, 466),
            [System.Drawing.Point]::new(214, 286),
            [System.Drawing.Point]::new(100, 394),
            [System.Drawing.Point]::new(42, 334),
            [System.Drawing.Point]::new(158, 256),
            [System.Drawing.Point]::new(42, 178),
            [System.Drawing.Point]::new(100, 118),
            [System.Drawing.Point]::new(214, 226)
        )
        $graphics.FillPolygon($blue, $outer)

        $cutout = [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(214, 286),
            [System.Drawing.Point]::new(352, 392),
            [System.Drawing.Point]::new(352, 120),
            [System.Drawing.Point]::new(214, 226),
            [System.Drawing.Point]::new(158, 256)
        )
        $graphics.FillPolygon($dark, $cutout)
    }
    finally {
        $dark.Dispose()
        $blue.Dispose()
    }

    Save-Canvas -Canvas $canvas -Name "vscode-alt"
}

function New-EditorAssetFromReference {
    param(
        [string]$Name,
        [string]$ReferencePath,
        [System.Drawing.Rectangle]$SourceRectangle
    )

    if (-not (Test-Path -LiteralPath $ReferencePath)) {
        throw "Editor logo reference is missing: $ReferencePath"
    }

    $canvas = New-Canvas
    $graphics = $canvas.Graphics
    $reference = [System.Drawing.Image]::FromFile($ReferencePath)
    try {
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $destination = [System.Drawing.Rectangle]::new(48, 48, 416, 416)
        $graphics.DrawImage($reference, $destination, $SourceRectangle, [System.Drawing.GraphicsUnit]::Pixel)
    }
    finally {
        $reference.Dispose()
    }

    Save-Canvas -Canvas $canvas -Name $Name
}

foreach ($asset in $assets) {
    New-TextAsset -Name $asset.Key -Text $asset.Text -Color $asset.Color
    New-TextAsset -Name $asset.Key -Text $asset.Text -Color $asset.Color -Editor "cursor"
    New-TextAsset -Name $asset.Key -Text $asset.Text -Color $asset.Color -Editor "vscode"
    New-OutlineTextAsset -Name $asset.Key -Text $asset.Text -Color $asset.Color
    New-OutlineTextAsset -Name $asset.Key -Text $asset.Text -Color $asset.Color -Editor "cursor"
    New-OutlineTextAsset -Name $asset.Key -Text $asset.Text -Color $asset.Color -Editor "vscode"
}

if (-not (Test-Path -LiteralPath $deviconFontPath) -or -not (Test-Path -LiteralPath $deviconCssPath)) {
    throw "Devicon generator files are missing from $deviconDirectory"
}

$privateFonts = [System.Drawing.Text.PrivateFontCollection]::new()
$generatedLogoCount = 0
try {
    $privateFonts.AddFontFile($deviconFontPath)
    $deviconFontFamily = $privateFonts.Families[0]
    $deviconCss = Get-Content -Raw -LiteralPath $deviconCssPath

    foreach ($asset in $logoAssets) {
        if (New-LogoAsset -Name $asset.Key -Class $asset.Class -Color $asset.Color -LogoFontFamily $deviconFontFamily -Css $deviconCss) {
            $generatedLogoCount++
        }
    }
}
finally {
    $privateFonts.Dispose()
}

New-EditorAssetFromReference -Name "cube_2d_dark" -ReferencePath $cursorLogoReference -SourceRectangle ([System.Drawing.Rectangle]::new(1003, 999, 251, 255))
New-EditorAssetFromReference -Name "vscode-alt" -ReferencePath $vscodeLogoReference -SourceRectangle ([System.Drawing.Rectangle]::new(977, 971, 254, 254))

Write-Output "Generated $(($assets.Count * 6) + $generatedLogoCount + 2) assets in $([System.IO.Path]::GetFullPath($OutputDirectory))"
