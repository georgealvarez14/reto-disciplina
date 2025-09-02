const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { body, validationResult } = require('express-validator');
const { query, getRow } = require('../database/connection');
const { createRateLimiter } = require('../middleware/auth');

const router = express.Router();

// Rate limiting para autenticación
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutos
  5, // 5 intentos
  'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.'
);

// Esquemas de validación
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'El email debe tener un formato válido',
    'any.required': 'El email es obligatorio'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'La contraseña debe tener al menos 8 caracteres',
    'any.required': 'La contraseña es obligatoria'
  }),
  currency: Joi.string().valid('COP', 'USD', 'EUR').default('COP'),
  riskProfile: Joi.string().valid('conservador', 'balanceado', 'agresivo').default('balanceado')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

/**
 * POST /api/auth/register
 * Registra un nuevo usuario
 */
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    // Validar datos de entrada
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Error de validación',
        message: 'Los datos proporcionados no son válidos',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    const { email, password, currency, riskProfile } = value;

    // Verificar si el usuario ya existe
    const existingUser = await getRow('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser) {
      return res.status(409).json({
        error: 'Usuario ya existe',
        message: 'Ya existe una cuenta con este email'
      });
    }

    // Hash de la contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const result = await query(
      'INSERT INTO users (email, hashed_password, currency, risk_profile) VALUES ($1, $2, $3, $4) RETURNING id, email, currency, risk_profile, created_at',
      [email, hashedPassword, currency, riskProfile]
    );

    const user = result.rows[0];

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Crear banca inicial por defecto
    const defaultBankroll = {
      name: 'Banca Principal',
      startAmount: 0,
      currentAmount: 0,
      unitSizePct: 0.025, // 2.5% por defecto
      strategy: 'flat'
    };

    await query(
      `INSERT INTO bankrolls (user_id, name, start_amount, current_amount, unit_size_pct, strategy) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, defaultBankroll.name, defaultBankroll.startAmount, defaultBankroll.currentAmount, defaultBankroll.unitSizePct, defaultBankroll.strategy]
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        currency: user.currency,
        riskProfile: user.riskProfile,
        createdAt: user.created_at
      },
      token,
      mentorMessage: '¡Bienvenido a Reto Disciplina! Recuerda: "Tu mejor pick es saber cuándo no apostar."'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Inicia sesión de un usuario
 */
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    // Validar datos de entrada
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Error de validación',
        message: 'Email y contraseña son requeridos'
      });
    }

    const { email, password } = value;

    // Buscar usuario
    const user = await getRow(
      'SELECT id, email, hashed_password, currency, risk_profile FROM users WHERE email = $1',
      [email]
    );

    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.hashed_password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Obtener bancas del usuario
    const bankrolls = await query(
      'SELECT id, name, current_amount, unit_size_pct, strategy FROM bankrolls WHERE user_id = $1 ORDER BY created_at ASC',
      [user.id]
    );

    // Obtener métricas básicas
    const metrics = await query(`
      SELECT 
        COUNT(*) as total_wagers,
        COUNT(CASE WHEN status = 'ganada' THEN 1 END) as wins,
        COUNT(CASE WHEN status = 'perdida' THEN 1 END) as losses,
        COALESCE(SUM(stake_cop), 0) as total_staked,
        COALESCE(SUM(CASE WHEN status = 'ganada' THEN payout_cop ELSE 0 END), 0) as total_won
      FROM wagers w
      JOIN bankrolls b ON w.bankroll_id = b.id
      WHERE b.user_id = $1
    `, [user.id]);

    const userMetrics = metrics.rows[0];

    res.json({
      message: 'Inicio de sesión exitoso',
      user: {
        id: user.id,
        email: user.email,
        currency: user.currency,
        riskProfile: user.riskProfile
      },
      token,
      bankrolls: bankrolls.rows,
      metrics: {
        totalWagers: parseInt(userMetrics.total_wagers),
        wins: parseInt(userMetrics.wins),
        losses: parseInt(userMetrics.losses),
        totalStaked: parseFloat(userMetrics.total_staked),
        totalWon: parseFloat(userMetrics.total_won)
      },
      mentorMessage: 'Respira. La disciplina paga intereses compuestos.'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Cierra la sesión (opcional, ya que JWT es stateless)
 */
router.post('/logout', (req, res) => {
  res.json({
    message: 'Sesión cerrada exitosamente',
    mentorMessage: 'Hoy no se persiguen pérdidas. Mañana hay fútbol otra vez.'
  });
});

/**
 * GET /api/auth/me
 * Obtiene información del usuario actual
 */
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Token requerido',
        message: 'Debes incluir un token de autenticación'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const user = await getRow(
      'SELECT id, email, currency, risk_profile, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({
        error: 'Usuario no encontrado',
        message: 'El token es válido pero el usuario no existe'
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        currency: user.currency,
        riskProfile: user.riskProfile,
        createdAt: user.created_at
      }
    });

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

    next(error);
  }
});

/**
 * POST /api/auth/change-password
 * Cambia la contraseña del usuario
 */
router.post('/change-password', authLimiter, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'Contraseña actual y nueva contraseña son requeridas'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Contraseña débil',
        message: 'La nueva contraseña debe tener al menos 8 caracteres'
      });
    }

    // Obtener usuario actual
    const user = await getRow(
      'SELECT id, hashed_password FROM users WHERE id = $1',
      [req.user.id]
    );

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.hashed_password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: 'Contraseña incorrecta',
        message: 'La contraseña actual no es correcta'
      });
    }

    // Hash de la nueva contraseña
    const saltRounds = 12;
    const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    await query(
      'UPDATE users SET hashed_password = $1 WHERE id = $2',
      [newHashedPassword, req.user.id]
    );

    res.json({
      message: 'Contraseña actualizada exitosamente',
      mentorMessage: 'Bien hecho por mantener tu cuenta segura. La disciplina también se aplica a la seguridad.'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
