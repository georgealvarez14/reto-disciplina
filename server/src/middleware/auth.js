const jwt = require('jsonwebtoken');
const { getRow } = require('../database/connection');

/**
 * Middleware para autenticar tokens JWT
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Token de acceso requerido',
      message: 'Debes incluir un token de autenticación en el header Authorization'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Verificar que el usuario existe en la base de datos
    const user = await getRow('SELECT id, email, currency, risk_profile FROM users WHERE id = $1', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Usuario no encontrado',
        message: 'El token es válido pero el usuario no existe'
      });
    }

    // Agregar información del usuario al request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        message: 'Tu sesión ha expirado, por favor inicia sesión nuevamente'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        message: 'El token de autenticación no es válido'
      });
    }

    console.error('Error en autenticación:', error);
    return res.status(500).json({ 
      error: 'Error de autenticación',
      message: 'Error interno del servidor durante la autenticación'
    });
  }
};

/**
 * Middleware opcional para autenticar tokens (no falla si no hay token)
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // Continuar sin autenticación
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await getRow('SELECT id, email, currency, risk_profile FROM users WHERE id = $1', [decoded.userId]);
    
    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Si hay error en el token, continuar sin autenticación
    next();
  }
};

/**
 * Middleware para verificar que el usuario tiene acceso a un recurso específico
 */
const authorizeResource = (resourceType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const resourceId = req.params.id;

      let query;
      let params;

      switch (resourceType) {
        case 'bankroll':
          query = 'SELECT id FROM bankrolls WHERE id = $1 AND user_id = $2';
          params = [resourceId, userId];
          break;
        case 'wager':
          query = `
            SELECT w.id FROM wagers w 
            JOIN bankrolls b ON w.bankroll_id = b.id 
            WHERE w.id = $1 AND b.user_id = $2
          `;
          params = [resourceId, userId];
          break;
        case 'limit':
          query = `
            SELECT l.id FROM limits l 
            JOIN bankrolls b ON l.bankroll_id = b.id 
            WHERE l.id = $1 AND b.user_id = $2
          `;
          params = [resourceId, userId];
          break;
        default:
          return res.status(400).json({ 
            error: 'Tipo de recurso no válido',
            message: 'El tipo de recurso especificado no es válido'
          });
      }

      const resource = await getRow(query, params);
      
      if (!resource) {
        return res.status(403).json({ 
          error: 'Acceso denegado',
          message: 'No tienes permisos para acceder a este recurso'
        });
      }

      next();
    } catch (error) {
      console.error('Error en autorización de recurso:', error);
      return res.status(500).json({ 
        error: 'Error de autorización',
        message: 'Error interno del servidor durante la autorización'
      });
    }
  };
};

/**
 * Middleware para verificar límites de rate limiting específicos
 */
const createRateLimiter = (windowMs, max, message) => {
  const rateLimit = require('express-rate-limit');
  
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Demasiadas solicitudes',
      message: message || 'Has excedido el límite de solicitudes, intenta de nuevo más tarde'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

module.exports = {
  authenticateToken,
  optionalAuth,
  authorizeResource,
  createRateLimiter
};
