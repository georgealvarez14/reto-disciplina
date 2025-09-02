# 🚀 Despliegue Rápido - Reto Disciplina

## ⚡ Despliegue en 10 Minutos

### 1. Preparación (2 min)
```bash
# Clonar y configurar
git clone <tu-repositorio>
cd reto-disciplina
chmod +x deploy.sh
./deploy.sh
```

### 2. Base de Datos (3 min)
1. Ve a [Supabase](https://supabase.com) - **GRATIS**
2. Crea cuenta y proyecto
3. Ve a Settings > Database
4. Copia la URL de conexión
5. Actualiza `DATABASE_URL` en `.env`

### 3. Backend (3 min)
1. Ve a [Railway](https://railway.app) - **GRATIS**
2. Conecta tu repositorio de GitHub
3. Añade variables de entorno:
   ```
   DATABASE_URL=tu_url_de_supabase
   JWT_SECRET=tu_secret_super_seguro
   CLIENT_URL=https://tu-frontend.vercel.app
   ```
4. Deploy automático

### 4. Frontend (2 min)
1. Ve a [Vercel](https://vercel.com) - **GRATIS**
2. Conecta tu repositorio de GitHub
3. Configura:
   - **Framework**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
4. Deploy automático

## 🔧 Variables de Entorno

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://usuario:password@host:puerto/database
JWT_SECRET=tu_jwt_secret_super_seguro_aqui
CLIENT_URL=https://tu-dominio-frontend.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_SALT_ROUNDS=12
LOG_LEVEL=info
EXPORT_LIMIT=1000
```

### Frontend (Vercel Environment Variables)
```env
REACT_APP_API_URL=https://tu-backend.railway.app
REACT_APP_ENVIRONMENT=production
```

## 🆘 Problemas Comunes

### Error: "Cannot connect to database"
- Verifica que `DATABASE_URL` esté correcta
- Asegúrate de que la base de datos esté activa
- Verifica que las credenciales sean correctas

### Error: "CORS policy"
- Asegúrate de que `CLIENT_URL` esté configurada correctamente
- Verifica que el frontend esté desplegado antes de configurar el backend

### Error: "Build failed"
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que Node.js 18+ esté configurado

## 📱 PWA y Mobile

La aplicación está configurada como PWA:
- Instalable en móviles
- Funciona offline (básico)
- Notificaciones push (configurable)

## 🔒 Seguridad

- JWT tokens para autenticación
- Rate limiting configurado
- Helmet para headers de seguridad
- CORS configurado correctamente

## 📊 Monitoreo

Para añadir monitoreo:
1. [Sentry](https://sentry.io) - Errores
2. [Google Analytics](https://analytics.google.com) - Analytics
3. [Uptime Robot](https://uptimerobot.com) - Uptime

## 💰 Costos

### Plan Gratuito (Recomendado)
- **Vercel**: $0/mes
- **Railway**: $0/mes (hasta $5 crédito)
- **Supabase**: $0/mes (hasta 500MB)
- **Total**: $0/mes

### Escalable
- **Vercel Pro**: $20/mes
- **Railway**: $5-20/mes
- **Supabase Pro**: $25/mes

## 🎯 Próximos Pasos

1. Configurar dominio personalizado
2. Añadir monitoreo de errores
3. Configurar backups automáticos
4. Implementar analytics
5. Configurar CI/CD completo

---

**¿Necesitas ayuda?** Consulta `deployment-guide.md` para instrucciones detalladas.
