# 🚀 Guía de Configuración - Reto Disciplina

## 📋 Requisitos Previos
- Node.js 16+ instalado
- Git configurado
- Cuenta en Supabase
- Cuenta en Railway
- Cuenta en Vercel

## 🔧 Configuración Rápida

### **Opción 1: Script Automático (Recomendado)**
```powershell
# Ejecutar desde la raíz del proyecto
.\start-dev.ps1
```

### **Opción 2: Configuración Manual**

#### **1. Configurar Variables de Entorno**
```powershell
# Ejecutar desde la raíz del proyecto
.\setup-env.ps1
```

#### **2. Iniciar Servidor Backend**
```powershell
cd server
npm start
```

#### **3. Iniciar Frontend (en otra terminal)**
```powershell
cd client
npm start
```

## 🌍 URLs de Acceso

### **Desarrollo Local**
- 🚂 **Backend API**: http://localhost:5000
- 🌐 **Frontend**: http://localhost:3000
- 📊 **Health Check**: http://localhost:5000/api/health

### **Producción**
- 🚂 **Backend API**: https://tu-backend.railway.app
- 🌐 **Frontend**: https://tu-frontend.vercel.app
- 📊 **Base de Datos**: Supabase

## 🔐 Variables de Entorno

### **Desarrollo Local**
```powershell
$env:DATABASE_URL="postgresql://postgres:5S_4pWas%23u278pP@db.tahtygppftvitmxnhnbb.supabase.co:5432/postgres"
$env:JWT_SECRET="reto-disciplina-jwt-secret-key-2025"
$env:NODE_ENV="development"
$env:PORT="5000"
$env:CLIENT_URL="http://localhost:3000"
```

### **Producción (Railway)**
```bash
NODE_ENV=production
DATABASE_URL=postgresql://postgres:5S_4pWas%23u278pP@db.tahtygppftvitmxnhnbb.supabase.co:5432/postgres
JWT_SECRET=reto-disciplina-jwt-secret-key-2025-production
CLIENT_URL=https://tu-frontend.vercel.app
```

## 🚂 Despliegue Automático

### **Backend en Railway**
1. Conectar repositorio GitHub a Railway
2. Configurar variables de entorno
3. Despliegue automático en cada push

### **Frontend en Vercel**
1. Conectar repositorio GitHub a Vercel
2. Configurar `REACT_APP_API_URL`
3. Despliegue automático en cada push

## 🛠️ Comandos Útiles

### **Configuración de Base de Datos**
```powershell
cd server
node setup-supabase.js
```

### **Compilar Frontend**
```powershell
cd client
npm run build
```

### **Verificar Estado**
```powershell
# Verificar puertos
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# Verificar procesos
Get-Process -Name "node"
```

## 🔍 Solución de Problemas

### **Puerto 3000 ocupado**
```powershell
# Encontrar proceso
netstat -ano | findstr :3000
# Terminar proceso
taskkill /PID [PID] /F
```

### **Puerto 5000 ocupado**
```powershell
# Encontrar proceso
netstat -ano | findstr :5000
# Terminar proceso
taskkill /PID [PID] /F
```

### **Error de conexión a Supabase**
1. Verificar `DATABASE_URL`
2. Verificar credenciales
3. Verificar firewall/red

## 📱 Acceso a la Aplicación

1. **Abrir navegador**: http://localhost:3000
2. **Crear cuenta** con datos de prueba
3. **Iniciar sesión** y explorar funcionalidades

## 🎯 Funcionalidades Disponibles

- ✅ **Autenticación** (Registro/Login)
- ✅ **Gestión de Bankrolls**
- ✅ **Registro de Apuestas**
- ✅ **Análisis y Estadísticas**
- ✅ **Simulador de Estrategias**
- ✅ **Exportación de Datos**

## 🆘 Soporte

Si encuentras problemas:
1. Verificar logs del servidor
2. Verificar consola del navegador (F12)
3. Verificar variables de entorno
4. Verificar conectividad a Supabase

---

**¡Reto Disciplina está listo para usar! 🎉**
