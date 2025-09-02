const express = require('express');
const Joi = require('joi');
const { query, getRow, getRows } = require('../database/connection');
const { authorizeResource } = require('../middleware/auth');
const { calculateRecommendedUnitSize } = require('../utils/bettingCalculations');

const router = express.Router();

// Esquemas de validación
const createBankrollSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.min': 'El nombre debe tener al menos 1 carácter',
    'string.max': 'El nombre no puede exceder 100 caracteres',
    'any.required': 'El nombre es obligatorio'
  }),
  startAmount: Joi.number().positive().required().messages({
    'number.positive': 'La banca inicial debe ser positiva',
    'any.required': 'La banca inicial es obligatoria'
  }),
  unitSizePct: Joi.number().min(0.01).max(0.1).default(0.025).messages({
    'number.min': 'El tamaño de unidad debe ser al menos 1%',
    'number.max': 'El tamaño de unidad no puede exceder 10%'
  }),
  strategy: Joi.string().valid('flat', 'percentage', 'kelly').default('flat'),
  stoplossDaily: Joi.number().positive().optional(),
  stopwinDaily: Joi.number().positive().optional(),
  stoplossWeekly: Joi.number().positive().optional(),
  stopwinWeekly: Joi.number().positive().optional(),
  maxDailyBets: Joi.number().integer().min(1).max(50).default(10),
  maxOddsAllowed: Joi.number().min(1.01).max(100).default(5.00)
});

const updateBankrollSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  unitSizePct: Joi.number().min(0.01).max(0.1).optional(),
  strategy: Joi.string().valid('flat', 'percentage', 'kelly').optional(),
  stoplossDaily: Joi.number().positive().optional().allow(null),
  stopwinDaily: Joi.number().positive().optional().allow(null),
  stoplossWeekly: Joi.number().positive().optional().allow(null),
  stopwinWeekly: Joi.number().positive().optional().allow(null),
  maxDailyBets: Joi.number().integer().min(1).max(50).optional(),
  maxOddsAllowed: Joi.number().min(1.01).max(100).optional()
});

/**
 * GET /api/bankrolls
 * Obtiene todas las bancas del usuario
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const bankrolls = await getRows(`
      SELECT 
        b.id,
        b.name,
        b.start_amount,
        b.current_amount,
        b.unit_size_pct,
        b.strategy,
        b.stoploss_daily,
        b.stopwin_daily,
        b.stoploss_weekly,
        b.stopwin_weekly,
        b.max_daily_bets,
        b.max_odds_allowed,
        b.created_at,
        b.updated_at,
        COUNT(w.id) as total_wagers,
        COUNT(CASE WHEN w.status = 'ganada' THEN 1 END) as wins,
        COUNT(CASE WHEN w.status = 'perdida' THEN 1 END) as losses,
        COALESCE(SUM(w.stake_cop), 0) as total_staked,
        COALESCE(SUM(CASE WHEN w.status = 'ganada' THEN w.payout_cop ELSE 0 END), 0) as total_won
      FROM bankrolls b
      LEFT JOIN wagers w ON b.id = w.bankroll_id
      WHERE b.user_id = $1
      GROUP BY b.id
      ORDER BY b.created_at ASC
    `, [userId]);

    // Calcular métricas adicionales
    const bankrollsWithMetrics = bankrolls.map(bankroll => {
      const totalStaked = parseFloat(bankroll.total_staked);
      const totalWon = parseFloat(bankroll.total_won);
      const currentAmount = parseFloat(bankroll.current_amount);
      const startAmount = parseFloat(bankroll.start_amount);
      
      // Calcular ROI
      const roi = totalStaked > 0 ? ((totalWon - totalStaked) / totalStaked) * 100 : 0;
      
      // Calcular variación de banca
      const bankrollVariation = startAmount > 0 ? ((currentAmount - startAmount) / startAmount) * 100 : 0;
      
      // Calcular hit rate
      const totalWagers = parseInt(bankroll.total_wagers);
      const wins = parseInt(bankroll.wins);
      const hitRate = totalWagers > 0 ? (wins / totalWagers) * 100 : 0;

      return {
        ...bankroll,
        metrics: {
          roi: parseFloat(roi.toFixed(2)),
          bankrollVariation: parseFloat(bankrollVariation.toFixed(2)),
          hitRate: parseFloat(hitRate.toFixed(2)),
          totalWagers,
          wins,
          losses: parseInt(bankroll.losses),
          totalStaked,
          totalWon
        }
      };
    });

    res.json({
      bankrolls: bankrollsWithMetrics,
      mentorMessage: bankrollsWithMetrics.length === 0 
        ? 'Crea tu primera banca para comenzar tu viaje hacia la disciplina.'
        : 'Revisa regularmente tus métricas. Los números no mienten.'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bankrolls
 * Crea una nueva banca
 */
router.post('/', async (req, res, next) => {
  try {
    // Validar datos de entrada
    const { error, value } = createBankrollSchema.validate(req.body);
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

    const {
      name,
      startAmount,
      unitSizePct = 0.025,
      strategy = 'flat',
      stoplossDaily,
      stopwinDaily,
      stoplossWeekly,
      stopwinWeekly,
      maxDailyBets = 10,
      maxOddsAllowed = 5.00
    } = value;

    const userId = req.user.id;

    // Obtener perfil de riesgo del usuario para recomendaciones
    const user = await getRow('SELECT risk_profile FROM users WHERE id = $1', [userId]);
    const recommendedUnitSize = calculateRecommendedUnitSize(user.risk_profile);

    // Crear banca
    const result = await query(`
      INSERT INTO bankrolls (
        user_id, name, start_amount, current_amount, unit_size_pct, strategy,
        stoploss_daily, stopwin_daily, stoploss_weekly, stopwin_weekly,
        max_daily_bets, max_odds_allowed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      userId, name, startAmount, startAmount, unitSizePct, strategy,
      stoplossDaily, stopwinDaily, stoplossWeekly, stopwinWeekly,
      maxDailyBets, maxOddsAllowed
    ]);

    const bankroll = result.rows[0];

    // Crear límites por defecto
    await query(`
      INSERT INTO limits (bankroll_id, daily_max_bets, max_odds_allowed)
      VALUES ($1, $2, $3)
    `, [bankroll.id, maxDailyBets, maxOddsAllowed]);

    // Generar mensaje del mentor
    let mentorMessage = `¡Nueva banca "${name}" creada exitosamente!`;
    
    if (unitSizePct > recommendedUnitSize) {
      mentorMessage += ` Considera reducir el tamaño de unidad de ${(unitSizePct * 100).toFixed(1)}% a ${(recommendedUnitSize * 100).toFixed(1)}% para tu perfil ${user.risk_profile}.`;
    }

    if (!stoplossDaily) {
      mentorMessage += ' Recuerda establecer límites de pérdida diaria para proteger tu capital.';
    }

    res.status(201).json({
      message: 'Banca creada exitosamente',
      bankroll: {
        id: bankroll.id,
        name: bankroll.name,
        startAmount: parseFloat(bankroll.start_amount),
        currentAmount: parseFloat(bankroll.current_amount),
        unitSizePct: parseFloat(bankroll.unit_size_pct),
        strategy: bankroll.strategy,
        stoplossDaily: bankroll.stoploss_daily ? parseFloat(bankroll.stoploss_daily) : null,
        stopwinDaily: bankroll.stopwin_daily ? parseFloat(bankroll.stopwin_daily) : null,
        stoplossWeekly: bankroll.stoploss_weekly ? parseFloat(bankroll.stoploss_weekly) : null,
        stopwinWeekly: bankroll.stopwin_weekly ? parseFloat(bankroll.stopwin_weekly) : null,
        maxDailyBets: bankroll.max_daily_bets,
        maxOddsAllowed: parseFloat(bankroll.max_odds_allowed),
        createdAt: bankroll.created_at
      },
      recommendations: {
        recommendedUnitSize: recommendedUnitSize,
        riskProfile: user.risk_profile
      },
      mentorMessage
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bankrolls/:id
 * Obtiene una banca específica con métricas detalladas
 */
router.get('/:id', authorizeResource('bankroll'), async (req, res, next) => {
  try {
    const bankrollId = req.params.id;

    // Obtener banca con métricas
    const bankroll = await getRow(`
      SELECT 
        b.*,
        COUNT(w.id) as total_wagers,
        COUNT(CASE WHEN w.status = 'ganada' THEN 1 END) as wins,
        COUNT(CASE WHEN w.status = 'perdida' THEN 1 END) as losses,
        COUNT(CASE WHEN w.status = 'pendiente' THEN 1 END) as pending,
        COALESCE(SUM(w.stake_cop), 0) as total_staked,
        COALESCE(SUM(CASE WHEN w.status = 'ganada' THEN w.payout_cop ELSE 0 END), 0) as total_won,
        COALESCE(AVG(w.odds_decimal), 0) as avg_odds,
        COALESCE(AVG(w.stake_units), 0) as avg_stake_units
      FROM bankrolls b
      LEFT JOIN wagers w ON b.id = w.bankroll_id
      WHERE b.id = $1
      GROUP BY b.id
    `, [bankrollId]);

    if (!bankroll) {
      return res.status(404).json({
        error: 'Banca no encontrada',
        message: 'La banca especificada no existe'
      });
    }

    // Calcular métricas adicionales
    const totalStaked = parseFloat(bankroll.total_staked);
    const totalWon = parseFloat(bankroll.total_won);
    const currentAmount = parseFloat(bankroll.current_amount);
    const startAmount = parseFloat(bankroll.start_amount);
    
    const roi = totalStaked > 0 ? ((totalWon - totalStaked) / totalStaked) * 100 : 0;
    const bankrollVariation = startAmount > 0 ? ((currentAmount - startAmount) / startAmount) * 100 : 0;
    const totalWagers = parseInt(bankroll.total_wagers);
    const wins = parseInt(bankroll.wins);
    const hitRate = totalWagers > 0 ? (wins / totalWagers) * 100 : 0;

    // Obtener apuestas recientes
    const recentWagers = await getRows(`
      SELECT 
        id, sport, event, odds_decimal, stake_cop, stake_units, 
        status, result, payout_cop, placed_at, notes
      FROM wagers 
      WHERE bankroll_id = $1 
      ORDER BY placed_at DESC 
      LIMIT 10
    `, [bankrollId]);

    // Obtener límites
    const limits = await getRow('SELECT * FROM limits WHERE bankroll_id = $1', [bankrollId]);

    res.json({
      bankroll: {
        id: bankroll.id,
        name: bankroll.name,
        startAmount: startAmount,
        currentAmount: currentAmount,
        unitSizePct: parseFloat(bankroll.unit_size_pct),
        strategy: bankroll.strategy,
        stoplossDaily: bankroll.stoploss_daily ? parseFloat(bankroll.stoploss_daily) : null,
        stopwinDaily: bankroll.stopwin_daily ? parseFloat(bankroll.stopwin_daily) : null,
        stoplossWeekly: bankroll.stoploss_weekly ? parseFloat(bankroll.stoploss_weekly) : null,
        stopwinWeekly: bankroll.stopwin_weekly ? parseFloat(bankroll.stopwin_weekly) : null,
        maxDailyBets: bankroll.max_daily_bets,
        maxOddsAllowed: parseFloat(bankroll.max_odds_allowed),
        createdAt: bankroll.created_at,
        updatedAt: bankroll.updated_at
      },
      metrics: {
        roi: parseFloat(roi.toFixed(2)),
        bankrollVariation: parseFloat(bankrollVariation.toFixed(2)),
        hitRate: parseFloat(hitRate.toFixed(2)),
        totalWagers,
        wins,
        losses: parseInt(bankroll.losses),
        pending: parseInt(bankroll.pending),
        totalStaked,
        totalWon,
        avgOdds: parseFloat(bankroll.avg_odds),
        avgStakeUnits: parseFloat(bankroll.avg_stake_units)
      },
      recentWagers,
      limits,
      mentorMessage: generateMentorMessage(bankroll, roi, hitRate, bankrollVariation)
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/bankrolls/:id
 * Actualiza una banca existente
 */
router.patch('/:id', authorizeResource('bankroll'), async (req, res, next) => {
  try {
    // Validar datos de entrada
    const { error, value } = updateBankrollSchema.validate(req.body);
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

    const bankrollId = req.params.id;
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    // Construir query dinámicamente
    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateFields.push(`${dbField} = $${paramCount}`);
        updateValues.push(value[key]);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'Sin cambios',
        message: 'No se proporcionaron campos para actualizar'
      });
    }

    updateValues.push(bankrollId);
    const updateQuery = `
      UPDATE bankrolls 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);
    const bankroll = result.rows[0];

    // Actualizar límites si es necesario
    if (value.maxDailyBets !== undefined || value.maxOddsAllowed !== undefined) {
      const limitUpdates = [];
      const limitValues = [];
      let limitParamCount = 1;

      if (value.maxDailyBets !== undefined) {
        limitUpdates.push(`daily_max_bets = $${limitParamCount}`);
        limitValues.push(value.maxDailyBets);
        limitParamCount++;
      }

      if (value.maxOddsAllowed !== undefined) {
        limitUpdates.push(`max_odds_allowed = $${limitParamCount}`);
        limitValues.push(value.maxOddsAllowed);
        limitParamCount++;
      }

      limitValues.push(bankrollId);
      await query(`
        UPDATE limits 
        SET ${limitUpdates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE bankroll_id = $${limitParamCount}
      `, limitValues);
    }

    res.json({
      message: 'Banca actualizada exitosamente',
      bankroll: {
        id: bankroll.id,
        name: bankroll.name,
        startAmount: parseFloat(bankroll.start_amount),
        currentAmount: parseFloat(bankroll.current_amount),
        unitSizePct: parseFloat(bankroll.unit_size_pct),
        strategy: bankroll.strategy,
        stoplossDaily: bankroll.stoploss_daily ? parseFloat(bankroll.stoploss_daily) : null,
        stopwinDaily: bankroll.stopwin_daily ? parseFloat(bankroll.stopwin_daily) : null,
        stoplossWeekly: bankroll.stoploss_weekly ? parseFloat(bankroll.stoploss_weekly) : null,
        stopwinWeekly: bankroll.stopwin_weekly ? parseFloat(bankroll.stopwin_weekly) : null,
        maxDailyBets: bankroll.max_daily_bets,
        maxOddsAllowed: parseFloat(bankroll.max_odds_allowed),
        updatedAt: bankroll.updated_at
      },
      mentorMessage: 'Configuración actualizada. Recuerda que la consistencia es clave en la gestión de banca.'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/bankrolls/:id
 * Elimina una banca (solo si no tiene apuestas)
 */
router.delete('/:id', authorizeResource('bankroll'), async (req, res, next) => {
  try {
    const bankrollId = req.params.id;

    // Verificar si tiene apuestas
    const wagerCount = await getRow(
      'SELECT COUNT(*) as count FROM wagers WHERE bankroll_id = $1',
      [bankrollId]
    );

    if (parseInt(wagerCount.count) > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar',
        message: 'No se puede eliminar una banca que tiene apuestas registradas'
      });
    }

    // Eliminar límites primero
    await query('DELETE FROM limits WHERE bankroll_id = $1', [bankrollId]);
    
    // Eliminar banca
    await query('DELETE FROM bankrolls WHERE id = $1', [bankrollId]);

    res.json({
      message: 'Banca eliminada exitosamente',
      mentorMessage: 'Banca eliminada. A veces menos es más en la gestión de capital.'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Función para generar mensajes del mentor basados en métricas
 */
function generateMentorMessage(bankroll, roi, hitRate, bankrollVariation) {
  const messages = [];

  if (roi < -10) {
    messages.push('Tu ROI está en negativo. Considera revisar tu estrategia de selección.');
  } else if (roi > 10) {
    messages.push('¡Excelente ROI! Mantén la disciplina y no te confíes.');
  }

  if (hitRate < 40) {
    messages.push('Tu hit rate es bajo. Enfócate en la calidad sobre la cantidad.');
  } else if (hitRate > 60) {
    messages.push('Hit rate impresionante. Asegúrate de que los stakes sean apropiados.');
  }

  if (bankrollVariation < -20) {
    messages.push('Tu banca ha disminuido significativamente. Es momento de hacer una pausa y reevaluar.');
  } else if (bankrollVariation > 50) {
    messages.push('¡Gran crecimiento de banca! Considera tomar algunas ganancias.');
  }

  if (!bankroll.stoploss_daily) {
    messages.push('Recuerda establecer límites de pérdida diaria para proteger tu capital.');
  }

  return messages.length > 0 
    ? messages.join(' ') 
    : 'Sigues en el camino correcto. La disciplina paga intereses compuestos.';
}

module.exports = router;
