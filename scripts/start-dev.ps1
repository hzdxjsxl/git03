$ErrorActionPreference = "Stop"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  电商商品智能推荐引擎 - 开发模式启动" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] 检查 Node.js 版本..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "Node.js 版本: $nodeVersion" -ForegroundColor Green

Write-Host ""
Write-Host "[2/4] 安装根目录依赖..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "[3/4] 安装各服务依赖..." -ForegroundColor Yellow

Write-Host "`n  → 安装网关服务依赖..." -ForegroundColor Gray
Set-Location gateway
npm install
Set-Location ..

Write-Host "`n  → 安装推荐服务依赖..." -ForegroundColor Gray
Set-Location recommendation-service
npm install
Set-Location ..

Write-Host "`n  → 安装前端依赖..." -ForegroundColor Gray
Set-Location frontend
npm install
Set-Location ..

Write-Host ""
Write-Host "[4/4] 启动所有服务..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  🚀 网关服务:    http://localhost:3000" -ForegroundColor Cyan
Write-Host "  🧠 推荐服务:    http://localhost:3001" -ForegroundColor Cyan
Write-Host "  🌐 前端应用:    http://localhost:5173" -ForegroundColor Cyan
Write-Host ""

npm run dev
