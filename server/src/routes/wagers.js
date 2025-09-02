const express = require('express');
const Joi = require('joi');
const { query, getRow, getRows } = require('../database/connection');
const { authorizeResource } = require('../middleware/auth');
const { 
  calculateImpliedProbability, 
  calculateExpectedValue, 
  calculateKellyStake,
  calculateStreakMetrics,
  calculateCLV
} = require('../utils/bettingCalculations');
const { LimitError } = require('../middleware/errorHandler');

const router = express.Router();

// Esquemas de validación
const createWagerSchema = Joi.object({
  bankrollId: Joi.number().integer().positive().required(),
  sport: Joi.string().max(50).optional(),
  league: Joi.string().max(100).optional(),
  event: Joi.string().max(200).optional(),
  market: Joi.string().max(100).optional(),
  selection: Joi.string().max(200).optional(),
  oddsDecimal: Joi.number().min(1.01).max(100).required(),
  stakeCop: Joi.number().positive().required(),
  stakeUnits: Joi.number().positive().required(),
  book: Joi.string().max(100).optional(),
  notes: Joi.string().max(1000).optional(),
  isLive: Joi.boolean().default(false),
  estimatedProbability: Joi.number().min(0).max(1).optional(),
  tagList: Joi.array().items(Joi.string()).optional()
});

const updateWagerSchema = Joi.object({
  status: Joi.string().valid('pendiente', 'ganada', 'perdida', 'push', 'cashout').optional(),
  result: Joi.string().max(50).optional(),
  payoutCop: Joi.number().positive().optional(),
  closingOdds: Joi.number().min(1.01).max(100).optional(),
  notes: Joi.string().max(1000).optional(),
  tagList: Joi.array().items(Joi.string()).optional()
});

/**
 * GET /api/wagers
 * Obtiene todas las apuestas del usuario con filtros
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      bankrollId,
      status,
      sport,
      from,
      to,
      limit = 50,
      offset = 0
    } = req.query;

    let whereConditions = ['b.user_id = $1'];
    let queryParams = [userId];
    let paramCount = 1;

    if (bankrollId) {
      paramCount++;
      whereConditions.push(`w.bankroll_id = $${paramCount}`);
      queryParams.push(bankrollId);
    }

    if (status) {
      paramCount++;
      whereConditions.push(`w.status = $${paramCount}`);
      queryParams.push(status);
    }

    if (sport) {
      paramCount++;
      whereConditions.push(`w.sport ILIKE $${paramCount}`);
      queryParams.push(`%${sport}%`);
    }

    if (from) {
      paramCount++;
      whereConditions.push(`w.placed_at >= $${paramCount}`);
      queryParams.push(from);
    }

    if (to) {
      paramCount++;
      whereConditions.push(`w.placed_at <= $${paramCount}`);
      queryParams.push(to);
    }

    const whereClause = whereConditions.join(' AND ');

    // Obtener apuestas
    const wagers = await getRows(`
      SELECT 
        w.*,
        b.name as bankroll_name,
        b.current_amount as bankroll_current_amount
      FROM wagers w
      JOIN bankrolls b ON w.bankroll_id = b.id
      WHERE ${whereClause}
      ORDER BY w.placed_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    // Obtener total de apuestas para paginación
    const totalResult = await getRow(`
      SELECT COUNT(*) as total
      FROM wagers w
      JOIN bankrolls b ON w.bankroll_id = b.id
      WHERE ${whereClause}
    `, queryParams);

    const total = parseInt(totalResult.total);

    // Calcular métricas adicionales para cada apuesta
    const wagersWithMetrics = wagers.map(wager => {
      const impliedProb = calculateImpliedProbability(parseFloat(wager.odds_decimal));
      
      return {
        ...wager,
        impliedProbability: parseFloat(impliedProb.toFixed(6)),
        evExpected: wager.ev_expected ? parseFloat(wager.ev_expected) : null,
        clv: wager.closing_odds ? calculateCLV(parseFloat(wager.odds_decimal), parseFloat(wager.closing_odds)) : null
      };
    });

    res.json({
      wagers: wagersWithMetrics,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + limit < total
      },
      mentorMessage: generateWagersMentorMessage(wagersWithMetrics)
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/wagers
 * Crea una nueva apuesta con validación de límites
 */
router.post('/', async (req, res, next) => {
  try {
    // Validar datos de entrada
    const { error, value } = createWagerSchema.validate(req.body);
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
      bankrollId,
      sport,
      league,
      event,
      market,
      selection,
      oddsDecimal,
      stakeCop,
      stakeUnits,
      book,
      notes,
      isLive,
      estimatedProbability,
      tagList
    } = value;

    const userId = req.user.id;

    // Verificar que la banca pertenece al usuario
    const bankroll = await getRow(`
      SELECT b.*, l.daily_max_bets, l.max_odds_allowed, l.cooldown_until
      FROM bankrolls b
      LEFT JOIN limits l ON b.id = l.bankroll_id
      WHERE b.id = $1 AND b.user_id = $2
    `, [bankrollId, userId]);

    if (!bankroll) {
      return res.status(404).json({
        error: 'Banca no encontrada',
        message: 'La banca especificada no existe o no tienes acceso a ella'
      });
    }

    // Verificar límites
    await validateWagerLimits(bankroll, stakeCop, oddsDecimal, userId);

    // Calcular métricas
    const impliedProb = calculateImpliedProbability(oddsDecimal);
    const evExpected = estimatedProbability ? calculateExpectedValue(estimatedProbability, oddsDecimal) : null;

    // Crear apuesta
    const result = await query(`
      INSERT INTO wagers (
        bankroll_id, sport, league, event, market, selection, odds_decimal,
        stake_cop, stake_units, book, notes, is_live, implied_prob, ev_expected, tag_list
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      bankrollId, sport, league, event, market, selection, oddsDecimal,
      stakeCop, stakeUnits, book, notes, isLive, impliedProb, evExpected, tagList
    ]);

    const wager = result.rows[0];

    // Actualizar banca (reducir por el stake)
    await query(`
      UPDATE bankrolls 
      SET current_amount = current_amount - $1
      WHERE id = $2
    `, [stakeCop, bankrollId]);

    // Generar mensaje del mentor
    const mentorMessage = generateWagerMentorMessage(wager, bankroll, evExpected);

    res.status(201).json({
      message: 'Apuesta registrada exitosamente',
      wager: {
        id: wager.id,
        bankrollId: wager.bankroll_id,
        sport: wager.sport,
        league: wager.league,
        event: wager.event,
        market: wager.market,
        selection: wager.selection,
        oddsDecimal: parseFloat(wager.odds_decimal),
        stakeCop: parseFloat(wager.stake_cop),
        stakeUnits: parseFloat(wager.stake_units),
        book: wager.book,
        status: wager.status,
        notes: wager.notes,
        isLive: wager.is_live,
        impliedProbability: parseFloat(wager.implied_prob),
        evExpected: wager.ev_expected ? parseFloat(wager.ev_expected) : null,
        tagList: wager.tag_list,
        placedAt: wager.placed_at
      },
      mentorMessage
    });

  } catch (error) {
    if (error instanceof LimitError) {
      return res.status(403).json({
        error: error.name,
        message: error.message,
        type: 'limit_exceeded'
      });
    }
    next(error);
  }
});

/**
 * GET /api/wagers/:id
 * Obtiene una apuesta específica
 */
router.get('/:id', authorizeResource('wager'), async (req, res, next) => {
  try {
    const wagerId = req.params.id;

    const wager = await getRow(`
      SELECT 
        w.*,
        b.name as bankroll_name,
        b.current_amount as bankroll_current_amount
      FROM wagers w
      JOIN bankrolls b ON w.bankroll_id = b.id
      WHERE w.id = $1
    `, [wagerId]);

    if (!wager) {
      return res.status(404).json({
        error: 'Apuesta no encontrada',
        message: 'La apuesta especificada no existe'
      });
    }

    // Calcular métricas adicionales
    const impliedProb = calculateImpliedProbability(parseFloat(wager.odds_decimal));
    const clv = wager.closing_odds ? calculateCLV(parseFloat(wager.odds_decimal), parseFloat(wager.closing_odds)) : null;

    res.json({
      wager: {
        ...wager,
        impliedProbability: parseFloat(impliedProb.toFixed(6)),
        evExpected: wager.ev_expected ? parseFloat(wager.ev_expected) : null,
        clv: clv ? parseFloat(clv.toFixed(2)) : null
      },
      mentorMessage: generateSingleWagerMentorMessage(wager)
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/wagers/:id
 * Actualiza una apuesta (principalmente para cerrar resultados)
 */
router.patch('/:id', authorizeResource('wager'), async (req, res, next) => {
  try {
    // Validar datos de entrada
    const { error, value } = updateWagerSchema.validate(req.body);
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

    const wagerId = req.params.id;
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

    updateValues.push(wagerId);
    const updateQuery = `
      UPDATE wagers 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const updateResult = await query(updateQuery, updateValues);
    const wager = updateResult.rows[0];

    // Si se está cerrando la apuesta, actualizar banca
    if (value.status && ['ganada', 'perdida', 'push', 'cashout'].includes(value.status)) {
      await updateBankrollAfterWager(wager);
    }

    // Calcular CLV si se proporcionan closing odds
    let clv = null;
    if (value.closingOdds) {
      clv = calculateCLV(parseFloat(wager.odds_decimal), parseFloat(value.closingOdds));
    }

    res.json({
      message: 'Apuesta actualizada exitosamente',
      wager: {
        ...wager,
        clv: clv ? parseFloat(clv.toFixed(2)) : null
      },
      mentorMessage: generateWagerUpdateMentorMessage(wager, value.status)
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/wagers/:id/close
 * Cierra una apuesta con resultado
 */
router.post('/:id/close', authorizeResource('wager'), async (req, res, next) => {
  try {
    const { status, result, payoutCop, closingOdds } = req.body;

    if (!status || !['ganada', 'perdida', 'push', 'cashout'].includes(status)) {
      return res.status(400).json({
        error: 'Estado inválido',
        message: 'El estado debe ser ganada, perdida, push o cashout'
      });
    }

    const wagerId = req.params.id;

    // Obtener apuesta actual
    const currentWager = await getRow('SELECT * FROM wagers WHERE id = $1', [wagerId]);
    if (!currentWager) {
      return res.status(404).json({
        error: 'Apuesta no encontrada',
        message: 'La apuesta especificada no existe'
      });
    }

    if (currentWager.status !== 'pendiente') {
      return res.status(400).json({
        error: 'Apuesta ya cerrada',
        message: 'Esta apuesta ya ha sido cerrada'
      });
    }

    // Actualizar apuesta
    const updateFields = ['status = $1', 'result = $2'];
    const updateValues = [status, result];
    let paramCount = 3;

    if (payoutCop !== undefined) {
      updateFields.push(`payout_cop = $${paramCount}`);
      updateValues.push(payoutCop);
      paramCount++;
    }

    if (closingOdds !== undefined) {
      updateFields.push(`closing_odds = $${paramCount}`);
      updateValues.push(closingOdds);
      paramCount++;
    }

    updateValues.push(wagerId);
    const updateQuery = `
      UPDATE wagers 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);
    const wager = result.rows[0];

    // Actualizar banca
    await updateBankrollAfterWager(wager);

    // Calcular CLV si se proporcionan closing odds
    let clv = null;
    if (closingOdds) {
      clv = calculateCLV(parseFloat(wager.odds_decimal), parseFloat(closingOdds));
    }

    res.json({
      message: 'Apuesta cerrada exitosamente',
      wager: {
        ...wager,
        clv: clv ? parseFloat(clv.toFixed(2)) : null
      },
      mentorMessage: generateWagerCloseMentorMessage(wager, status)
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Función para validar límites antes de crear una apuesta
 */
async function validateWagerLimits(bankroll, stakeCop, oddsDecimal, userId) {
  // Verificar cooldown
  if (bankroll.cooldown_until && new Date() < new Date(bankroll.cooldown_until)) {
    throw new LimitError('Estás en período de cooldown. Respira y vuelve más tarde.');
  }

  // Verificar límite de cuotas
  if (bankroll.max_odds_allowed && oddsDecimal > bankroll.max_odds_allowed) {
    throw new LimitError(`La cuota ${oddsDecimal} excede tu límite máximo de ${bankroll.max_odds_allowed}.`);
  }

  // Verificar límite de apuestas diarias
  const today = new Date().toISOString().split('T')[0];
  const dailyWagers = await getRow(`
    SELECT COUNT(*) as count
    FROM wagers w
    JOIN bankrolls b ON w.bankroll_id = b.id
    WHERE b.user_id = $1 AND DATE(w.placed_at) = $2
  `, [userId, today]);

  if (parseInt(dailyWagers.count) >= bankroll.daily_max_bets) {
    throw new LimitError(`Has alcanzado tu límite de ${bankroll.daily_max_bets} apuestas diarias.`);
  }

  // Verificar stop-loss diario
  if (bankroll.stoploss_daily) {
    const dailyPnL = await getRow(`
      SELECT COALESCE(SUM(
        CASE 
          WHEN w.status = 'ganada' THEN w.payout_cop - w.stake_cop
          WHEN w.status = 'perdida' THEN -w.stake_cop
          ELSE 0
        END
      ), 0) as daily_pnl
      FROM wagers w
      JOIN bankrolls b ON w.bankroll_id = b.id
      WHERE b.user_id = $1 AND DATE(w.placed_at) = $2
    `, [userId, today]);

    const currentDailyLoss = Math.abs(Math.min(0, parseFloat(dailyPnL.daily_pnl)));
    if (currentDailyLoss + stakeCop > bankroll.stoploss_daily) {
      throw new LimitError('Stop-loss diario alcanzado');
    }
  }

  // Verificar stop-win diario
  if (bankroll.stopwin_daily) {
    const dailyPnL = await getRow(`
      SELECT COALESCE(SUM(
        CASE 
          WHEN w.status = 'ganada' THEN w.payout_cop - w.stake_cop
          WHEN w.status = 'perdida' THEN -w.stake_cop
          ELSE 0
        END
      ), 0) as daily_pnl
      FROM wagers w
      JOIN bankrolls b ON w.bankroll_id = b.id
      WHERE b.user_id = $1 AND DATE(w.placed_at) = $2
    `, [userId, today]);

    const currentDailyProfit = Math.max(0, parseFloat(dailyPnL.daily_pnl));
    if (currentDailyProfit >= bankroll.stopwin_daily) {
      throw new LimitError('Stop-win diario alcanzado');
    }
  }
}

/**
 * Función para actualizar banca después de cerrar una apuesta
 */
async function updateBankrollAfterWager(wager) {
  const bankrollId = wager.bankroll_id;
  let bankrollUpdate = 0;

  switch (wager.status) {
    case 'ganada':
      bankrollUpdate = parseFloat(wager.payout_cop || 0);
      break;
    case 'perdida':
      bankrollUpdate = 0; // Ya se descontó al crear la apuesta
      break;
    case 'push':
      bankrollUpdate = parseFloat(wager.stake_cop); // Devolver el stake
      break;
    case 'cashout':
      bankrollUpdate = parseFloat(wager.payout_cop || 0);
      break;
  }

  if (bankrollUpdate > 0) {
    await query(`
      UPDATE bankrolls 
      SET current_amount = current_amount + $1
      WHERE id = $2
    `, [bankrollUpdate, bankrollId]);
  }
}

/**
 * Funciones para generar mensajes del mentor
 */
function generateWagersMentorMessage(wagers) {
  if (wagers.length === 0) {
    return 'No tienes apuestas registradas. Comienza con apuestas pequeñas para ganar confianza.';
  }

  const pendingWagers = wagers.filter(w => w.status === 'pendiente').length;
  if (pendingWagers > 5) {
    return 'Tienes muchas apuestas pendientes. Considera cerrar algunas antes de hacer nuevas.';
  }

  return 'Revisa regularmente tus apuestas pendientes. La gestión activa es clave.';
}

function generateWagerMentorMessage(wager, bankroll, evExpected) {
  const messages = [];

  if (parseFloat(wager.odds_decimal) > 3 && !wager.notes) {
    messages.push('Cuota alta detectada. Asegúrate de tener una razón sólida para esta apuesta.');
  }

  if (evExpected && evExpected < -0.05) {
    messages.push('EV negativo detectado. Considera revisar tu estimación de probabilidad.');
  }

  if (parseFloat(wager.stake_units) > 3) {
    messages.push('Stake alto. Recuerda que la disciplina es más importante que el tamaño.');
  }

  return messages.length > 0 
    ? messages.join(' ') 
    : 'Apuesta registrada. Mantén la disciplina y documenta tus razones.';
}

function generateSingleWagerMentorMessage(wager) {
  if (wager.status === 'pendiente') {
    return 'Apuesta pendiente. Revisa regularmente el estado del evento.';
  }

  if (wager.status === 'ganada') {
    return '¡Victoria! Celebra con moderación y mantén la disciplina.';
  }

  if (wager.status === 'perdida') {
    return 'Pérdida registrada. Aprende de ella y no persigas pérdidas.';
  }

  return 'Apuesta cerrada. Analiza el resultado para mejorar futuras decisiones.';
}

function generateWagerUpdateMentorMessage(wager, newStatus) {
  if (newStatus === 'ganada') {
    return '¡Excelente resultado! Mantén la consistencia en tu proceso.';
  }

  if (newStatus === 'perdida') {
    return 'Pérdida registrada. Respira y recuerda: la disciplina paga intereses compuestos.';
  }

  return 'Apuesta actualizada. Mantén un registro detallado de tus decisiones.';
}

function generateWagerCloseMentorMessage(wager, status) {
  switch (status) {
    case 'ganada':
      return '¡Victoria! Bien hecho por mantener la disciplina.';
    case 'perdida':
      return 'Pérdida registrada. Hoy no se persiguen pérdidas. Mañana hay fútbol otra vez.';
    case 'push':
      return 'Push registrado. A veces no ganar es mejor que perder.';
    case 'cashout':
      return 'Cashout realizado. Buena decisión de gestión de riesgo.';
    default:
      return 'Apuesta cerrada. Analiza el resultado para mejorar.';
  }
}

module.exports = router;
