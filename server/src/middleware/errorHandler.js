/**
 * Middleware para manejo centralizado de errores
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error en la aplicación:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id || 'anonymous'
  });

  // Errores de validación de Joi
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Error de validación',
      message: 'Los datos proporcionados no son válidos',
      details: err.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  // Errores de validación de express-validator
  if (err.array) {
    return res.status(400).json({
      error: 'Error de validación',
      message: 'Los datos proporcionados no son válidos',
      details: err.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }

  // Errores de base de datos
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({
      error: 'Conflicto de datos',
      message: 'Ya existe un registro con estos datos'
    });
  }

  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({
      error: 'Referencia inválida',
      message: 'La referencia proporcionada no existe'
    });
  }

  if (err.code === '23502') { // Not null violation
    return res.status(400).json({
      error: 'Campo requerido',
      message: 'Faltan campos obligatorios'
    });
  }

  // Errores de cálculo de apuestas
  if (err.message && err.message.includes('cuota debe ser mayor a 1')) {
    return res.status(400).json({
      error: 'Cuota inválida',
      message: 'La cuota debe ser mayor a 1'
    });
  }

  if (err.message && err.message.includes('probabilidad debe estar entre 0 y 1')) {
    return res.status(400).json({
      error: 'Probabilidad inválida',
      message: 'La probabilidad debe estar entre 0 y 1'
    });
  }

  // Errores de límites
  if (err.message && err.message.includes('Stop-loss diario alcanzado')) {
    return res.status(403).json({
      error: 'Límite alcanzado',
      message: 'Has alcanzado tu límite de pérdida diario. Respira y vuelve mañana.',
      type: 'stop_loss'
    });
  }

  if (err.message && err.message.includes('Stop-win diario alcanzado')) {
    return res.status(403).json({
      error: 'Límite alcanzado',
      message: '¡Excelente! Has alcanzado tu límite de ganancia diario. Guarda las ganancias.',
      type: 'stop_win'
    });
  }

  // Errores de autenticación
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'Debes iniciar sesión para acceder a este recurso'
    });
  }

  // Errores de permisos
  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'No tienes permisos para realizar esta acción'
    });
  }

  // Errores de recursos no encontrados
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      error: 'Recurso no encontrado',
      message: err.message || 'El recurso solicitado no existe'
    });
  }

  // Errores de validación de negocio
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      message: err.message
    });
  }

  // Errores de límites de rate limiting
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Demasiadas solicitudes',
      message: 'Has excedido el límite de solicitudes. Intenta de nuevo más tarde.'
    });
  }

  // Error por defecto (500)
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Error interno del servidor';

  // En producción, no mostrar detalles del error
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(statusCode).json({
    error: 'Error del servidor',
    message: isDevelopment ? message : 'Ha ocurrido un error inesperado',
    ...(isDevelopment && { stack: err.stack })
  });
};

/**
 * Middleware para manejar rutas no encontradas
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    message: `La ruta ${req.method} ${req.originalUrl} no existe`,
    availableEndpoints: [
      'GET /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/bankrolls',
      'POST /api/bankrolls',
      'GET /api/wagers',
      'POST /api/wagers',
      'POST /api/simulator/ladder',
      'GET /api/analytics/metrics',
      'GET /api/export/wagers.csv'
    ]
  });
};

/**
 * Clase para errores personalizados
 */
class AppError extends Error {
  constructor(message, statusCode, name = 'AppError') {
    super(message);
    this.statusCode = statusCode;
    this.name = name;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Clase para errores de validación
 */
class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, 'ValidationError');
  }
}

/**
 * Clase para errores de límites
 */
class LimitError extends AppError {
  constructor(message) {
    super(message, 403, 'LimitError');
  }
}

/**
 * Clase para errores de recursos no encontrados
 */
class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404, 'NotFoundError');
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  AppError,
  ValidationError,
  LimitError,
  NotFoundError
};
