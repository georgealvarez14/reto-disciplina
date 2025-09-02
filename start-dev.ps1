# Script de inicio para desarrollo local
# Inicia tanto el backend como el frontend

Write-Host "🚀 Iniciando Reto Disciplina en modo desarrollo..." -ForegroundColor Yellow

# Configurar variables de entorno
Write-Host "🔧 Configurando variables de entorno..." -ForegroundColor Cyan
$env:DATABASE_URL="postgresql://postgres:5S_4pWas%23u278pP@db.tahtygppftvitmxnhnbb.supabase.co:5432/postgres"
$env:JWT_SECRET="reto-disciplina-jwt-secret-key-2025"
$env:NODE_ENV="development"
$env:PORT="5000"
$env:CLIENT_URL="http://localhost:3000"

Write-Host "✅ Variables configuradas" -ForegroundColor Green

# Iniciar servidor backend en segundo plano
Write-Host "🚂 Iniciando servidor backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'server'; npm start" -WindowStyle Normal

# Esperar un momento para que el servidor se inicie
Write-Host "⏳ Esperando que el servidor se inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Iniciar frontend en segundo plano
Write-Host "🌐 Iniciando frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'client'; npm start" -WindowStyle Normal

Write-Host "`n🎯 Servicios iniciados:" -ForegroundColor Green
Write-Host "   🚂 Backend: http://localhost:5000" -ForegroundColor White
Write-Host "   🌐 Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   📊 API Health: http://localhost:5000/api/health" -ForegroundColor White

Write-Host "`n💡 Para detener los servicios, cierra las ventanas de PowerShell" -ForegroundColor Yellow
Write-Host "🎉 ¡Reto Disciplina está funcionando!" -ForegroundColor Green
