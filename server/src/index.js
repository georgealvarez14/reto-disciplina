const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const bankrollRoutes = require('./routes/bankrolls');
const wagerRoutes = require('./routes/wagers');
const simulatorRoutes = require('./routes/simulator');
const analyticsRoutes = require('./routes/analytics');
const exportRoutes = require('./routes/export');

const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Reto Disciplina API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bankrolls', authenticateToken, bankrollRoutes);
app.use('/api/wagers', authenticateToken, wagerRoutes);
app.use('/api/simulator', authenticateToken, simulatorRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/export', authenticateToken, exportRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint no encontrado',
    message: 'La ruta solicitada no existe en la API'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor Reto Disciplina ejecutándose en puerto ${PORT}`);
  console.log(`📊 API disponible en: http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
