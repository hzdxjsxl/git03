$ErrorActionPreference = "Stop"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  电商商品智能推荐引擎 - 生产构建" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] 构建网关服务..." -ForegroundColor Yellow
Set-Location gateway
npm run build
Set-Location ..

Write-Host "`n[2/3] 构建推荐服务..." -ForegroundColor Yellow
Set-Location recommendation-service
npm run build
Set-Location ..

Write-Host "`n[3/3] 构建前端应用..." -ForegroundColor Yellow
Set-Location frontend
npm run build
Set-Location ..

Write-Host ""
Write-Host "✅ 所有服务构建完成！" -ForegroundColor Green
Write-Host ""
Write-Host "运行 'npm run start' 启动生产模式，或运行 'docker-compose up -d --build' 使用 Docker 启动" -ForegroundColor Cyan
