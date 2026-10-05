param(
    [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\src\image\rich-presence")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "rich-presence-paths.ps1")

Add-Type -AssemblyName System.Drawing

$canvasSize = 512
$background = [System.Drawing.ColorTranslator]::FromHtml("#090808")
$fontFamily = [System.Drawing.FontFamily]::new("Arial Black")
$fontStyle = [System.Drawing.FontStyle]::Regular
$monoFontFamily = [System.Drawing.FontFamily]::new("Consolas")
$monoFontStyle = [System.Drawing.FontStyle]::Bold
$deviconDirectory = Join-Path $PSScriptRoot "vendor\devicon"
$deviconFontPath = Join-Path $deviconDirectory "devicon.ttf"
$deviconCssPath = Join-Path $deviconDirectory "devicon.min.css"
$editorLogoDirectory = Join-Path $PSScriptRoot "assets\editor-logos"
$cursorLogoReference = Join-Path $editorLogoDirectory "cursor-reference.png"
$vscodeLogoReference = Join-Path $editorLogoDirectory "vscode-reference.png"
$taxcodeLogoReference = Join-Path $PSScriptRoot "..\src\image\rich-presence\editors\taxcode\iconwhite.png"

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
    @{ Key = "hcl";        Text = "HCL";      Color = "#E6B422" },
    @{ Key = "zig";        Text = "Zig";      Color = "#F7A41D" },
    @{ Key = "julia";      Text = "Julia";    Color = "#9558B2" },
    @{ Key = "fsharp";     Text = "F#";       Color = "#378BBA" },
    @{ Key = "objectivec"; Text = "Obj-C";    Color = "#438EFF" },
    @{ Key = "perl";       Text = "Perl";     Color = "#39457E" },
    @{ Key = "groovy";     Text = "Groovy";   Color = "#4298B8" },
    @{ Key = "ocaml";      Text = "OCaml";    Color = "#EC6813" },
    @{ Key = "nim";        Text = "Nim";      Color = "#FFE953" },
    @{ Key = "fortran";    Text = "Fortran";  Color = "#734F96" },
    @{ Key = "visualbasic"; Text = "VB";      Color = "#945DB7" },
    @{ Key = "crystal";    Text = "Crystal";  Color = "#E6E6E6" },
    @{ Key = "cobol";      Text = "COBOL";    Color = "#005CA5" }
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
    @{ Key = "terraform";  Class = "terraform-plain";        Color = "#844FBA" },
    @{ Key = "zig";        Class = "zig-original";           Color = "#F7A41D" },
    @{ Key = "julia";      Class = "julia-plain";            Color = "#9558B2" },
    @{ Key = "fsharp";     Class = "fsharp-plain";           Color = "#378BBA" },
    @{ Key = "objectivec"; Class = "objectivec-plain";       Color = "#438EFF" },
    @{ Key = "perl";       Class = "perl-plain";             Color = "#39457E" },
    @{ Key = "groovy";     Class = "groovy-plain";           Color = "#4298B8" },
    @{ Key = "ocaml";      Class = "ocaml-plain";            Color = "#EC6813" },
    @{ Key = "nim";        Class = "nim-plain";              Color = "#FFE953" },
    @{ Key = "fortran";    Class = "fortran-original";       Color = "#734F96" },
    @{ Key = "visualbasic"; Class = "visualbasic-plain";     Color = "#945DB7" },
    @{ Key = "crystal";    Class = "crystal-original";       Color = "#E6E6E6" },
    @{ Key = "cobol";      Class = "cobol-original";         Color = "#005CA5" }
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

    $outputPath = Join-Path $OutputDirectory (Get-RichPresenceAssetPath -Name $Name)
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $outputPath) | Out-Null
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
        [ValidateSet("", "cursor", "vscode", "taxcode")]
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
        [ValidateSet("cursor", "vscode", "taxcode")]
        [string]$Editor
    )

    $referencePath = switch ($Editor) {
        "cursor" { $cursorLogoReference }
        "taxcode" { $taxcodeLogoReference }
        default { $vscodeLogoReference }
    }
    if (-not (Test-Path -LiteralPath $referencePath)) {
        throw "Editor logo reference is missing: $referencePath"
    }

    $reference = [System.Drawing.Image]::FromFile($referencePath)
    $imageAttributes = [System.Drawing.Imaging.ImageAttributes]::new()
    $previousInterpolation = $Graphics.InterpolationMode
    try {
        $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $source = if ($Editor -eq "taxcode") {
            [System.Drawing.Rectangle]::new(0, 0, $reference.Width, $reference.Height)
        } else { [System.Drawing.Rectangle]::new(760, 760, 494, 494) }
        # Cursor/VS Code have padding baked into their 494px reference crops:
        # their visible glyph is about 80px high on the 512px canvas.
        # iconwhite.png is tightly framed, so match the visible glyph size.
        $destination = if ($Editor -eq "taxcode") {
            [System.Drawing.Rectangle]::new(418, 418, 84, 84)
        } else { [System.Drawing.Rectangle]::new(310, 310, 202, 202) }
        $transparentLow = [System.Drawing.Color]::FromArgb(0, 0, 0)
        $transparentHigh = [System.Drawing.Color]::FromArgb(32, 32, 32)
        if ($Editor -ne "taxcode") { $imageAttributes.SetColorKey($transparentLow, $transparentHigh) }
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
        [ValidateSet("", "cursor", "vscode", "taxcode")]
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

function Get-FittedFontSize {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$Text,
        [System.Drawing.FontFamily]$Family,
        [System.Drawing.FontStyle]$Style,
        [single]$MaxWidth,
        [single]$MaxHeight,
        [single]$Maximum = 260.0
    )

    $low = 18.0
    $high = [double]$Maximum
    for ($i = 0; $i -lt 12; $i++) {
        $size = ($low + $high) / 2.0
        $font = [System.Drawing.Font]::new($Family, $size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
        try {
            $bounds = $Graphics.MeasureString($Text, $font)
            if ($bounds.Width -le $MaxWidth -and $bounds.Height -le $MaxHeight) { $low = $size }
            else { $high = $size }
        }
        finally { $font.Dispose() }
    }
    return [single]$low
}

function New-NeonMonoAsset {
    param(
        [string]$Name,
        [string]$Text,
        [string]$Color,
        [ValidateSet("", "cursor", "vscode", "taxcode")]
        [string]$Editor = ""
    )

    $canvas = New-Canvas
    $graphics = $canvas.Graphics
    $accent = [System.Drawing.ColorTranslator]::FromHtml($Color)
    $gridColor = [System.Drawing.Color]::FromArgb(24, $accent.R, $accent.G, $accent.B)
    $gridPen = [System.Drawing.Pen]::new($gridColor, 1.0)
    $cornerPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(150, $accent.R, $accent.G, $accent.B), 4.0)
    $displayText = $Text.ToUpperInvariant()
    $size = Get-FittedFontSize -Graphics $graphics -Text $displayText -Family $monoFontFamily -Style $monoFontStyle -MaxWidth 400 -MaxHeight 210 -Maximum 250
    $format = [System.Drawing.StringFormat]::new([System.Drawing.StringFormat]::GenericTypographic)
    $format.FormatFlags = $format.FormatFlags -bor [System.Drawing.StringFormatFlags]::NoWrap -bor [System.Drawing.StringFormatFlags]::NoClip
    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $glowPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(58, $accent.R, $accent.G, $accent.B), [Math]::Max(14.0, $size * 0.09))
    $accentPen = [System.Drawing.Pen]::new($accent, [Math]::Max(3.0, $size * 0.018))
    $fill = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(246, 248, 255))
    $glowPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $accentPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    try {
        for ($position = 48; $position -le 464; $position += 32) {
            $graphics.DrawLine($gridPen, $position, 48, $position, 464)
            $graphics.DrawLine($gridPen, 48, $position, 464, $position)
        }
        foreach ($segment in @(
            @(50, 92, 50, 50), @(50, 50, 92, 50),
            @(420, 50, 462, 50), @(462, 50, 462, 92),
            @(50, 420, 50, 462), @(50, 462, 92, 462),
            @(420, 462, 462, 462), @(462, 420, 462, 462)
        )) { $graphics.DrawLine($cornerPen, $segment[0], $segment[1], $segment[2], $segment[3]) }

        $path.AddString($displayText, $monoFontFamily, [int]$monoFontStyle, $size, [System.Drawing.PointF]::Empty, $format)
        $bounds = $path.GetBounds()
        $matrix = [System.Drawing.Drawing2D.Matrix]::new()
        try {
            $matrix.Translate([single]((($canvasSize - $bounds.Width) / 2.0) - $bounds.X), [single]((($canvasSize - $bounds.Height) / 2.0) - $bounds.Y))
            $path.Transform($matrix)
        }
        finally { $matrix.Dispose() }
        $graphics.DrawPath($glowPen, $path)
        $graphics.DrawPath($accentPen, $path)
        $graphics.FillPath($fill, $path)
        if ($Editor) { Draw-EmbeddedEditorGlyph -Graphics $graphics -Editor $Editor }
    }
    finally {
        $fill.Dispose()
        $accentPen.Dispose()
        $glowPen.Dispose()
        $path.Dispose()
        $format.Dispose()
        $cornerPen.Dispose()
        $gridPen.Dispose()
    }

    $suffix = if ($Editor) { "-mono-$Editor" } else { "-mono" }
    Save-Canvas -Canvas $canvas -Name "$Name$suffix"
}

function New-TechCardAsset {
    param(
        [string]$Name,
        [string]$Text,
        [ValidateSet("", "cursor", "vscode", "taxcode")]
        [string]$Editor = ""
    )

    $canvas = New-Canvas
    $graphics = $canvas.Graphics
    $blue = [System.Drawing.ColorTranslator]::FromHtml("#2F8CFF")
    $navy = [System.Drawing.ColorTranslator]::FromHtml("#183558")
    $muted = [System.Drawing.ColorTranslator]::FromHtml("#52647D")
    $bluePen = [System.Drawing.Pen]::new($blue, 2.0)
    $navyPen = [System.Drawing.Pen]::new($navy, 2.0)
    $thinPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(150, $navy.R, $navy.G, $navy.B), 1.0)
    $barPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(210, 18, 42, 72), 22.0)
    $barPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $barPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $darkBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(230, 14, 27, 46))
    $blueBrush = [System.Drawing.SolidBrush]::new($blue)
    $mutedBrush = [System.Drawing.SolidBrush]::new($muted)
    $whiteBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(246, 246, 248))
    $fontSize = Get-FittedFontSize -Graphics $graphics -Text $Text -Family $fontFamily -Style $fontStyle -MaxWidth 400 -MaxHeight 178 -Maximum 210
    $textFont = [System.Drawing.Font]::new($fontFamily, $fontSize, $fontStyle, [System.Drawing.GraphicsUnit]::Pixel)
    $textFormat = [System.Drawing.StringFormat]::new()
    $textFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $textFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
    $textFormat.FormatFlags = [System.Drawing.StringFormatFlags]::NoWrap

    try {
        $graphics.FillEllipse($darkBrush, -72, -88, 190, 190)
        $graphics.DrawArc($bluePen, -76, -92, 222, 222, 5, 150)
        $graphics.DrawEllipse($navyPen, 108, 72, 48, 48)
        $graphics.DrawLine($barPen, 426, -8, 382, 36)
        $graphics.DrawLine($barPen, 18, 420, -28, 466)

        foreach ($offset in 0, 16, 32) {
            $graphics.DrawLine($thinPen, 390 + $offset, 44, 470 + $offset, -36)
            $graphics.DrawLine($thinPen, -24 + $offset, 438, 66 + $offset, 348)
        }
        $graphics.DrawLine($bluePen, 426, 70, 486, 10)
        $graphics.DrawLine($bluePen, 22, 486, 88, 420)
        $graphics.DrawArc($navyPen, 248, 414, 188, 188, 195, 150)

        foreach ($origin in @(@(302, 44), @(150, 430))) {
            for ($row = 0; $row -lt 3; $row++) {
                for ($column = 0; $column -lt 4; $column++) {
                    $brush = if (($row + $column) % 3 -eq 0) { $blueBrush } else { $mutedBrush }
                    $graphics.FillEllipse($brush, $origin[0] + ($column * 17), $origin[1] + ($row * 17), 5, 5)
                }
            }
        }

        foreach ($plus in @(@(38, 164), @(466, 144), @(468, 356))) {
            $graphics.DrawLine($bluePen, $plus[0] - 10, $plus[1], $plus[0] + 10, $plus[1])
            $graphics.DrawLine($bluePen, $plus[0], $plus[1] - 10, $plus[0], $plus[1] + 10)
        }
        $graphics.FillEllipse($blueBrush, 168, 54, 10, 10)
        $graphics.FillEllipse($mutedBrush, 198, 88, 7, 7)
        $graphics.DrawEllipse($bluePen, 378, 390, 18, 18)

        $layout = [System.Drawing.RectangleF]::new(52, 154, 408, 204)
        $graphics.DrawString($Text, $textFont, $whiteBrush, $layout, $textFormat)
        if ($Editor) { Draw-EmbeddedEditorGlyph -Graphics $graphics -Editor $Editor }
    }
    finally {
        $textFormat.Dispose()
        $textFont.Dispose()
        $whiteBrush.Dispose()
        $mutedBrush.Dispose()
        $blueBrush.Dispose()
        $darkBrush.Dispose()
        $barPen.Dispose()
        $thinPen.Dispose()
        $navyPen.Dispose()
        $bluePen.Dispose()
    }

    $suffix = if ($Editor) { "-card-$Editor" } else { "-card" }
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
        [System.Drawing.Rectangle]$SourceRectangle = [System.Drawing.Rectangle]::Empty
    )

    if (-not (Test-Path -LiteralPath $ReferencePath)) {
        throw "Editor logo reference is missing: $ReferencePath"
    }

    $canvas = New-Canvas
    $graphics = $canvas.Graphics
    $reference = [System.Drawing.Image]::FromFile($ReferencePath)
    try {
        if ($SourceRectangle.IsEmpty) {
            $SourceRectangle = [System.Drawing.Rectangle]::new(0, 0, $reference.Width, $reference.Height)
        }
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
    New-TextAsset -Name $asset.Key -Text $asset.Text -Color $asset.Color -Editor "taxcode"
    New-OutlineTextAsset -Name $asset.Key -Text $asset.Text -Color $asset.Color
    New-OutlineTextAsset -Name $asset.Key -Text $asset.Text -Color $asset.Color -Editor "cursor"
    New-OutlineTextAsset -Name $asset.Key -Text $asset.Text -Color $asset.Color -Editor "vscode"
    New-OutlineTextAsset -Name $asset.Key -Text $asset.Text -Color $asset.Color -Editor "taxcode"
    New-NeonMonoAsset -Name $asset.Key -Text $asset.Text -Color $asset.Color
    New-NeonMonoAsset -Name $asset.Key -Text $asset.Text -Color $asset.Color -Editor "cursor"
    New-NeonMonoAsset -Name $asset.Key -Text $asset.Text -Color $asset.Color -Editor "vscode"
    New-NeonMonoAsset -Name $asset.Key -Text $asset.Text -Color $asset.Color -Editor "taxcode"
    New-TechCardAsset -Name $asset.Key -Text $asset.Text
    New-TechCardAsset -Name $asset.Key -Text $asset.Text -Editor "cursor"
    New-TechCardAsset -Name $asset.Key -Text $asset.Text -Editor "vscode"
    New-TechCardAsset -Name $asset.Key -Text $asset.Text -Editor "taxcode"
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

New-EditorAssetFromReference -Name "taxcode" -ReferencePath $taxcodeLogoReference

Write-Output "Generated $(($assets.Count * 16) + $generatedLogoCount + 3) assets in $([System.IO.Path]::GetFullPath($OutputDirectory))"
