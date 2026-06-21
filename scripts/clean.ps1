$ErrorActionPreference = "Continue"

Write-Host "=============================================" -ForegroundColor Yellow
Write-Host "  清理项目" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Yellow
Write-Host ""

$dirs = @("gateway", "recommendation-service", "frontend")

foreach ($dir in $dirs) {
    $nodeModules = Join-Path $dir "node_modules"
    $dist = Join-Path $dir "dist"
    
    if (Test-Path $nodeModules) {
        Write-Host "删除 $dir\node_modules..." -ForegroundColor Gray
        Remove-Item -Recurse -Force $nodeModules
    }
    
    if (Test-Path $dist) {
        Write-Host "删除 $dir\dist..." -ForegroundColor Gray
        Remove-Item -Recurse -Force $dist
    }
}

if (Test-Path "node_modules") {
    Write-Host "删除根目录 node_modules..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "node_modules"
}

Write-Host ""
Write-Host "✅ 清理完成！" -ForegroundColor Green
