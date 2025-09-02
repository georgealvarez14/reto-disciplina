# 🎯 Reto Disciplina - Sistema de Gestión de Apuestas

Sistema completo para la gestión profesional de apuestas deportivas con análisis de riesgo, gestión de capital y simulaciones.

## ✨ Características

- 🏦 **Gestión de Capital**: Control total de tu bankroll
- 📊 **Análisis de Riesgo**: Métricas avanzadas de rendimiento
- 🎲 **Simulador**: Prueba estrategias antes de implementarlas
- 📈 **Analytics**: Reportes detallados de tu rendimiento
- 🔒 **Seguridad**: Autenticación JWT y encriptación
- 📱 **PWA**: Aplicación web progresiva para móviles

## 🚀 Tecnologías

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + PostgreSQL
- **Base de Datos**: Supabase (PostgreSQL)
- **Despliegue**: Railway + Vercel

## 📋 Requisitos

- Node.js 18+
- PostgreSQL (o Supabase)
- npm o yarn

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/reto-disciplina.git
cd reto-disciplina
```

### 2. Instalar dependencias
```bash
# Instalar dependencias del proyecto
npm install

# Instalar dependencias del servidor
cd server
npm install

# Instalar dependencias del cliente
cd ../client
npm install
```

### 3. Configurar variables de entorno
```bash
# En el directorio raíz
cp .env.example .env

# En el directorio server
cd server
cp ../.env.example .env
```

### 4. Configurar base de datos
```bash
cd server
npm run setup-db
```

### 5. Ejecutar en desarrollo
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm start
```

## 🌐 Despliegue

### Backend (Railway)
1. Conecta tu repositorio en [Railway.app](https://railway.app)
2. Configura las variables de entorno
3. Deploy automático

### Frontend (Vercel)
1. Conecta tu repositorio en [Vercel.com](https://vercel.com)
2. Configura el directorio raíz como `client`
3. Deploy automático

## 📊 Estructura del Proyecto

```
reto-disciplina/
├── server/                 # Backend API
│   ├── src/
│   │   ├── database/      # Configuración de BD
│   │   ├── routes/        # Endpoints de la API
│   │   ├── middleware/    # Middleware de autenticación
│   │   └── utils/         # Utilidades
│   └── package.json
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas de la aplicación
│   │   ├── contexts/      # Contextos de React
│   │   └── utils/         # Utilidades del frontend
│   └── package.json
└── README.md
```

## 🔐 Variables de Entorno

### Backend (.env)
```env
DATABASE_URL=postgresql://usuario:password@host:puerto/database
JWT_SECRET=tu-jwt-secret-super-seguro
NODE_ENV=production
CLIENT_URL=https://tu-frontend.vercel.app
```

### Frontend (Vercel)
```env
REACT_APP_API_URL=https://tu-backend.railway.app
REACT_APP_ENVIRONMENT=production
```

## 📱 Uso

1. **Regístrate** en la aplicación
2. **Crea tu primer bankroll** con tu capital inicial
3. **Configura tu estrategia** de gestión de riesgo
4. **Registra tus apuestas** con detalles completos
5. **Analiza tu rendimiento** con métricas avanzadas
6. **Simula estrategias** antes de implementarlas

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:
- Abre un issue en GitHub
- Consulta la documentación
- Revisa los logs de error

---

**¡Desarrollado con ❤️ para la comunidad de apuestas deportivas!**
