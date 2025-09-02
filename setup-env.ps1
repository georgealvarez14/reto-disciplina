# Script de configuración de entorno para Reto Disciplina
# Ejecutar este script antes de iniciar el servidor

Write-Host "🔧 Configurando entorno para Reto Disciplina..." -ForegroundColor Yellow

# Configurar variables de entorno para desarrollo local
$env:DATABASE_URL="postgresql://postgres:5S_4pWas%23u278pP@db.tahtygppftvitmxnhnbb.supabase.co:5432/postgres"
$env:JWT_SECRET="reto-disciplina-jwt-secret-key-2025"
$env:NODE_ENV="development"
$env:PORT="5000"
$env:CLIENT_URL="http://localhost:3000"

Write-Host "✅ Variables de entorno configuradas:" -ForegroundColor Green
Write-Host "   DATABASE_URL: $env:DATABASE_URL" -ForegroundColor Cyan
Write-Host "   JWT_SECRET: $env:JWT_SECRET" -ForegroundColor Cyan
Write-Host "   NODE_ENV: $env:NODE_ENV" -ForegroundColor Cyan
Write-Host "   PORT: $env:PORT" -ForegroundColor Cyan
Write-Host "   CLIENT_URL: $env:CLIENT_URL" -ForegroundColor Cyan

Write-Host "`n🚀 Para iniciar el servidor:" -ForegroundColor Yellow
Write-Host "   cd server" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White

Write-Host "`n🌐 Para iniciar el frontend:" -ForegroundColor Yellow
Write-Host "   cd client" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White

Write-Host "`n📊 Para configurar la base de datos:" -ForegroundColor Yellow
Write-Host "   cd server" -ForegroundColor White
Write-Host "   node setup-supabase.js" -ForegroundColor White

Write-Host "`n🎯 Entorno configurado correctamente!" -ForegroundColor Green
