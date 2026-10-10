Add-Type -AssemblyName System.Drawing

function Crop-Image($sourcePath, $destPath, $x, $y, $width, $height) {
    $src = [System.Drawing.Bitmap]::FromFile($sourcePath)
    $rect = New-Object System.Drawing.Rectangle($x, $y, $width, $height)
    $dest = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($src, 0, 0, $rect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $dest.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    $src.Dispose()
    Write-Host "Saved $destPath ($width x $height)"
}

# Crop top-left floral from reference 1
Crop-Image "references\1.png" "assets\images\floral-corner-tl.png" 0 0 220 240

# Crop bottom-right floral from reference 2 (around y=1620, x=640)
Crop-Image "references\2.png" "assets\images\floral-corner-br.png" 640 1620 213 224
