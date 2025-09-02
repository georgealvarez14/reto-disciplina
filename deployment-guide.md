# 🚀 Guía de Despliegue - Reto Disciplina

## 📋 Prerrequisitos

### 1. Cuentas Necesarias
- [GitHub](https://github.com) - Para el código
- [Vercel](https://vercel.com) - Frontend (gratis)
- [Railway](https://railway.app) - Backend y base de datos (gratis)
- [PostgreSQL](https://supabase.com) - Base de datos (alternativa gratuita)

### 2. Preparación Local
```bash
# Clonar el repositorio
git clone <tu-repositorio>
cd reto-disciplina

# Instalar dependencias
npm run install-all

# Configurar variables de entorno
cp .env.example .env
```

## 🗄️ Paso 1: Configurar Base de Datos

### Opción A: Supabase (Recomendado - Gratis)
1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Ve a Settings > Database
5. Copia la URL de conexión

### Opción B: Railway PostgreSQL
1. Ve a [railway.app](https://railway.app)
2. Crea una cuenta
3. Crea un nuevo proyecto
4. Añade un servicio PostgreSQL
5. Copia las credenciales de conexión

## 🔧 Paso 2: Configurar Backend

### 1. Preparar el Backend para Producción
```bash
# En la carpeta server
cd server

# Instalar dependencias de producción
npm install --production

# Crear archivo de configuración de producción
```

### 2. Variables de Entorno para Producción
```env
# .env (Railway/Render)
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

### 3. Desplegar en Railway
1. Ve a [railway.app](https://railway.app)
2. Conecta tu repositorio de GitHub
3. Configura las variables de entorno
4. Deploy automático

### 4. Script de Despliegue para Railway
```json
// railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

## 🌐 Paso 3: Configurar Frontend

### 1. Preparar el Frontend para Producción
```bash
# En la carpeta client
cd client

# Crear archivo de configuración de producción
```

### 2. Variables de Entorno para Frontend
```env
# .env.production
REACT_APP_API_URL=https://tu-backend.railway.app
REACT_APP_ENVIRONMENT=production
```

### 3. Desplegar en Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu repositorio de GitHub
3. Configura el proyecto:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 4. Configuración de Vercel
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "create-react-app",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://tu-backend.railway.app/api/$1"
    }
  ]
}
```

## 🔗 Paso 4: Configurar Dominios y SSL

### 1. Dominio Personalizado (Opcional)
- Compra un dominio en [Namecheap](https://namecheap.com) o [GoDaddy](https://godaddy.com)
- Configura DNS en Vercel y Railway
- SSL automático incluido

### 2. Subdominios Recomendados
- Frontend: `app.tudominio.com`
- API: `api.tudominio.com`

## 📊 Paso 5: Monitoreo y Analytics

### 1. Monitoreo de Errores
```bash
# Instalar Sentry para monitoreo
npm install @sentry/react @sentry/tracing
```

### 2. Analytics
```bash
# Google Analytics
npm install react-ga4
```

## 🔒 Paso 6: Seguridad y Optimización

### 1. Configuración de Seguridad
```javascript
// server/src/index.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

### 2. Optimización de Performance
```javascript
// client/src/index.js
// Lazy loading de componentes
const DashboardPage = React.lazy(() => import('./pages/Dashboard/DashboardPage'));
```

## 🚀 Paso 7: Despliegue Automático

### 1. GitHub Actions (CI/CD)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        uses: railway/deploy@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📱 Paso 8: PWA y Mobile

### 1. Configurar PWA
```json
// client/public/manifest.json
{
  "name": "Reto Disciplina",
  "short_name": "RetoDisciplina",
  "description": "Mentor de Gestión de Banca",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6"
}
```

### 2. Service Worker
```javascript
// client/src/serviceWorker.js
// Configurar cache y offline functionality
```

## 🔧 Paso 9: Configuración Final

### 1. Scripts de Despliegue
```json
// package.json
{
  "scripts": {
    "deploy:backend": "railway up",
    "deploy:frontend": "vercel --prod",
    "deploy:all": "npm run deploy:backend && npm run deploy:frontend"
  }
}
```

### 2. Health Checks
```javascript
// server/src/index.js
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

## 📋 Checklist de Despliegue

- [ ] Base de datos configurada y funcionando
- [ ] Backend desplegado y accesible
- [ ] Frontend desplegado y conectado al backend
- [ ] Variables de entorno configuradas
- [ ] SSL/HTTPS funcionando
- [ ] Dominio personalizado configurado (opcional)
- [ ] Monitoreo de errores activo
- [ ] Analytics configurado
- [ ] PWA funcionando
- [ ] Tests pasando
- [ ] Documentación actualizada

## 🆘 Solución de Problemas Comunes

### Error: Base de datos no conecta
```bash
# Verificar conexión
psql $DATABASE_URL -c "SELECT 1;"
```

### Error: CORS en producción
```javascript
// Asegurar que CLIENT_URL esté configurado correctamente
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
```

### Error: Build falla en Vercel
```bash
# Verificar que todas las dependencias estén en package.json
npm install --save-dev
```

## 💰 Costos Estimados

### Plan Gratuito (Recomendado para empezar)
- **Vercel**: $0/mes (hasta 100GB bandwidth)
- **Railway**: $0/mes (hasta $5 de crédito)
- **Supabase**: $0/mes (hasta 500MB)
- **Total**: $0/mes

### Plan de Pago (Escalable)
- **Vercel Pro**: $20/mes
- **Railway**: $5-20/mes
- **Supabase Pro**: $25/mes
- **Total**: $50-65/mes

## 🎯 Próximos Pasos Después del Despliegue

1. **Configurar monitoreo** con Sentry
2. **Implementar analytics** con Google Analytics
3. **Configurar backups** automáticos de la base de datos
4. **Implementar CDN** para assets estáticos
5. **Configurar rate limiting** más estricto
6. **Implementar logging** estructurado
7. **Configurar alertas** de downtime

---

¿Necesitas ayuda con algún paso específico o quieres que te ayude a configurar alguna parte en particular?
