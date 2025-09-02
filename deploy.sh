#!/bin/bash

# 🚀 Script de Despliegue Rápido - Reto Disciplina
# Este script te ayuda a desplegar la aplicación paso a paso

echo "🚀 Iniciando despliegue de Reto Disciplina..."
echo "=============================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Paso 1: Instalar dependencias
echo "📦 Instalando dependencias..."
npm run install-all

# Paso 2: Verificar configuración
echo "🔧 Verificando configuración..."
if [ ! -f ".env" ]; then
    echo "⚠️  Advertencia: No se encontró archivo .env"
    echo "📝 Copiando .env.example..."
    cp .env.example .env
    echo "✅ Por favor, configura las variables de entorno en .env"
fi

# Paso 3: Verificar que PostgreSQL esté configurado
echo "🗄️  Verificando configuración de base de datos..."
if ! grep -q "DATABASE_URL" .env; then
    echo "❌ Error: DATABASE_URL no está configurada en .env"
    echo "📝 Por favor, configura tu base de datos PostgreSQL"
    exit 1
fi

# Paso 4: Configurar base de datos
echo "🗄️  Configurando base de datos..."
cd server
npm run setup-db
cd ..

# Paso 5: Verificar que todo funcione localmente
echo "🧪 Verificando que la aplicación funcione localmente..."
echo "📝 Para probar localmente, ejecuta: npm run dev"

# Paso 6: Instrucciones de despliegue
echo ""
echo "🎯 PRÓXIMOS PASOS PARA DESPLEGAR:"
echo "=================================="
echo ""
echo "1. 🗄️  CONFIGURAR BASE DE DATOS:"
echo "   - Ve a https://supabase.com o https://railway.app"
echo "   - Crea una base de datos PostgreSQL"
echo "   - Copia la URL de conexión"
echo "   - Actualiza DATABASE_URL en .env"
echo ""
echo "2. 🔧 DESPLEGAR BACKEND:"
echo "   - Ve a https://railway.app"
echo "   - Conecta tu repositorio de GitHub"
echo "   - Configura las variables de entorno"
echo "   - Deploy automático"
echo ""
echo "3. 🌐 DESPLEGAR FRONTEND:"
echo "   - Ve a https://vercel.com"
echo "   - Conecta tu repositorio de GitHub"
echo "   - Configura el directorio raíz como 'client'"
echo "   - Deploy automático"
echo ""
echo "4. 🔗 CONFIGURAR DOMINIO:"
echo "   - Configura tu dominio personalizado (opcional)"
echo "   - SSL automático incluido"
echo ""
echo "📚 Para más detalles, consulta: deployment-guide.md"
echo ""
echo "✅ ¡Listo para desplegar!"
