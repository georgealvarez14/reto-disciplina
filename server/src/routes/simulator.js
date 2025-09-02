const express = require('express');
const Joi = require('joi');
const { query, getRow } = require('../database/connection');
const { simulateLadderChallenge } = require('../utils/bettingCalculations');

const router = express.Router();

// Esquemas de validación
const ladderSimulationSchema = Joi.object({
  steps: Joi.number().integer().min(1).max(20).required().messages({
    'number.min': 'El número de pasos debe ser al menos 1',
    'number.max': 'El número de pasos no puede exceder 20',
    'any.required': 'El número de pasos es obligatorio'
  }),
  oddsPerStep: Joi.number().min(1.01).max(10).required().messages({
    'number.min': 'La cuota debe ser mayor a 1.01',
    'number.max': 'La cuota no puede exceder 10',
    'any.required': 'La cuota por paso es obligatoria'
  }),
  successProbability: Joi.number().min(0.1).max(0.95).required().messages({
    'number.min': 'La probabilidad de éxito debe ser al menos 10%',
    'number.max': 'La probabilidad de éxito no puede exceder 95%',
    'any.required': 'La probabilidad de éxito es obligatoria'
  }),
  stakeMode: Joi.string().valid('all_in', 'percentage').default('all_in'),
  initialBankroll: Joi.number().positive().required().messages({
    'number.positive': 'La banca inicial debe ser positiva',
    'any.required': 'La banca inicial es obligatoria'
  }),
  stakePercentage: Joi.number().min(0.01).max(1).default(0.1).messages({
    'number.min': 'El porcentaje de stake debe ser al menos 1%',
    'number.max': 'El porcentaje de stake no puede exceder 100%'
  }),
  simulations: Joi.number().integer().min(1000).max(50000).default(10000).messages({
    'number.min': 'El número de simulaciones debe ser al menos 1000',
    'number.max': 'El número de simulaciones no puede exceder 50000'
  })
});

const bankrollSimulationSchema = Joi.object({
  initialBankroll: Joi.number().positive().required(),
  winProbability: Joi.number().min(0.1).max(0.9).required(),
  averageOdds: Joi.number().min(1.01).max(5).required(),
  numberOfBets: Joi.number().integer().min(10).max(1000).required(),
  stakeStrategy: Joi.string().valid('flat', 'percentage', 'kelly').default('flat'),
  stakeSize: Joi.number().min(0.01).max(0.1).default(0.025),
  simulations: Joi.number().integer().min(1000).max(50000).default(10000)
});

/**
 * POST /api/simulator/ladder
 * Simula un reto escalera
 */
router.post('/ladder', async (req, res, next) => {
  try {
    // Validar datos de entrada
    const { error, value } = ladderSimulationSchema.validate(req.body);
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
      steps,
      oddsPerStep,
      successProbability,
      stakeMode,
      initialBankroll,
      stakePercentage,
      simulations
    } = value;

    // Ejecutar simulación
    const simulationResult = simulateLadderChallenge({
      steps,
      oddsPerStep,
      successProbability,
      stakeMode,
      initialBankroll,
      stakePercentage,
      simulations
    });

    // Guardar simulación en base de datos
    const userId = req.user.id;
    await query(`
      INSERT INTO simulations (user_id, type, params_json, result_json)
      VALUES ($1, $2, $3, $4)
    `, [
      userId,
      'ladder',
      JSON.stringify(value),
      JSON.stringify(simulationResult.summary)
    ]);

    // Generar mensaje del mentor
    const mentorMessage = generateLadderMentorMessage(simulationResult.summary, value);

    res.json({
      simulation: simulationResult.summary,
      sampleResults: simulationResult.results.slice(0, 10), // Solo mostrar 10 ejemplos
      mentorMessage,
      recommendations: generateLadderRecommendations(simulationResult.summary, value)
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/simulator/bankroll
 * Simula gestión de banca con Monte Carlo
 */
router.post('/bankroll', async (req, res, next) => {
  try {
    // Validar datos de entrada
    const { error, value } = bankrollSimulationSchema.validate(req.body);
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
      initialBankroll,
      winProbability,
      averageOdds,
      numberOfBets,
      stakeStrategy,
      stakeSize,
      simulations
    } = value;

    // Ejecutar simulación Monte Carlo
    const simulationResult = await runBankrollSimulation({
      initialBankroll,
      winProbability,
      averageOdds,
      numberOfBets,
      stakeStrategy,
      stakeSize,
      simulations
    });

    // Guardar simulación en base de datos
    const userId = req.user.id;
    await query(`
      INSERT INTO simulations (user_id, type, params_json, result_json)
      VALUES ($1, $2, $3, $4)
    `, [
      userId,
      'bankroll',
      JSON.stringify(value),
      JSON.stringify(simulationResult)
    ]);

    // Generar mensaje del mentor
    const mentorMessage = generateBankrollMentorMessage(simulationResult, value);

    res.json({
      simulation: simulationResult,
      mentorMessage,
      recommendations: generateBankrollRecommendations(simulationResult, value)
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/simulator/history
 * Obtiene historial de simulaciones del usuario
 */
router.get('/history', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, limit = 20, offset = 0 } = req.query;

    let whereConditions = ['user_id = $1'];
    let queryParams = [userId];
    let paramCount = 1;

    if (type) {
      paramCount++;
      whereConditions.push(`type = $${paramCount}`);
      queryParams.push(type);
    }

    const whereClause = whereConditions.join(' AND ');

    const simulations = await query(`
      SELECT id, type, params_json, result_json, created_at
      FROM simulations
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    // Formatear resultados
    const formattedSimulations = simulations.rows.map(sim => ({
      id: sim.id,
      type: sim.type,
      params: JSON.parse(sim.params_json),
      result: JSON.parse(sim.result_json),
      createdAt: sim.created_at
    }));

    res.json({
      simulations: formattedSimulations,
      mentorMessage: 'Revisa tus simulaciones anteriores para aprender de tus análisis.'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Función para ejecutar simulación de gestión de banca
 */
async function runBankrollSimulation(params) {
  const {
    initialBankroll,
    winProbability,
    averageOdds,
    numberOfBets,
    stakeStrategy,
    stakeSize,
    simulations
  } = params;

  const results = [];
  let completions = 0;
  let totalProfit = 0;
  let maxProfit = 0;
  let maxLoss = 0;
  let ruinCount = 0;

  for (let sim = 0; sim < simulations; sim++) {
    let currentBankroll = initialBankroll;
    let betHistory = [];

    for (let bet = 0; bet < numberOfBets; bet++) {
      // Calcular stake según estrategia
      let stake;
      switch (stakeStrategy) {
        case 'flat':
          stake = initialBankroll * stakeSize;
          break;
        case 'percentage':
          stake = currentBankroll * stakeSize;
          break;
        case 'kelly':
          const kellyStake = calculateKellyStake(currentBankroll, winProbability, averageOdds, 0.25, stakeSize);
          stake = Math.min(kellyStake, currentBankroll * stakeSize);
          break;
        default:
          stake = initialBankroll * stakeSize;
      }

      // Verificar que no apostemos más de lo que tenemos
      stake = Math.min(stake, currentBankroll);

      if (stake <= 0) {
        break; // Sin dinero para apostar
      }

      // Simular resultado de la apuesta
      const random = Math.random();
      const betOdds = averageOdds + (Math.random() - 0.5) * 0.5; // Variación en cuotas
      
      if (random < winProbability) {
        // Ganar
        const winAmount = stake * (betOdds - 1);
        currentBankroll += winAmount;
        betHistory.push({ bet: bet + 1, result: 'win', profit: winAmount, bankroll: currentBankroll });
      } else {
        // Perder
        currentBankroll -= stake;
        betHistory.push({ bet: bet + 1, result: 'loss', profit: -stake, bankroll: currentBankroll });
      }

      // Verificar ruina
      if (currentBankroll <= 0) {
        ruinCount++;
        break;
      }
    }

    const finalProfit = currentBankroll - initialBankroll;
    results.push({
      simulation: sim + 1,
      finalBankroll: currentBankroll,
      finalProfit,
      betHistory: betHistory.slice(0, 20) // Solo guardar las primeras 20 apuestas
    });

    if (currentBankroll > 0) completions++;
    totalProfit += finalProfit;
    maxProfit = Math.max(maxProfit, finalProfit);
    maxLoss = Math.min(maxLoss, finalProfit);
  }

  const completionRate = completions / simulations;
  const averageProfit = totalProfit / simulations;
  const ruinRisk = ruinCount / simulations;

  // Calcular percentiles
  const profits = results.map(r => r.finalProfit).sort((a, b) => a - b);
  const p10 = profits[Math.floor(profits.length * 0.1)];
  const p25 = profits[Math.floor(profits.length * 0.25)];
  const p50 = profits[Math.floor(profits.length * 0.5)];
  const p75 = profits[Math.floor(profits.length * 0.75)];
  const p90 = profits[Math.floor(profits.length * 0.9)];

  return {
    summary: {
      completionRate,
      ruinRisk,
      averageProfit,
      maxProfit,
      maxLoss,
      simulations,
      percentiles: { p10, p25, p50, p75, p90 }
    },
    results: results.slice(0, 100) // Solo retornar las primeras 100 simulaciones
  };
}

/**
 * Función auxiliar para calcular Kelly Stake
 */
function calculateKellyStake(bankroll, winProbability, odds, kellyFraction = 0.25, maxStakePercent = 0.03) {
  const b = odds - 1;
  const q = 1 - winProbability;
  const kellyFull = ((b * winProbability) - q) / b;
  const kellyFractional = Math.max(0, kellyFull * kellyFraction);
  const kellyCapped = Math.min(kellyFractional, maxStakePercent);
  return bankroll * kellyCapped;
}

/**
 * Funciones para generar mensajes del mentor
 */
function generateLadderMentorMessage(summary, params) {
  const { completionRate, ruinRisk, averageProfit } = summary;
  const { steps, oddsPerStep, successProbability } = params;

  let message = `Simulación de reto escalera de ${steps} pasos completada. `;

  if (ruinRisk > 0.8) {
    message += '⚠️ ALTO RIESGO: La probabilidad de ruina es muy alta. Considera reducir el número de pasos o mejorar la probabilidad de éxito.';
  } else if (ruinRisk > 0.5) {
    message += '⚠️ RIESGO MODERADO: La probabilidad de ruina es significativa. Evalúa cuidadosamente si vale la pena el riesgo.';
  } else if (ruinRisk > 0.2) {
    message += '⚠️ RIESGO BAJO: La probabilidad de ruina es moderada. Asegúrate de tener una estrategia sólida.';
  } else {
    message += '✅ RIESGO BAJO: La probabilidad de ruina es baja. Mantén la disciplina durante la ejecución.';
  }

  if (averageProfit < 0) {
    message += ' El valor esperado es negativo. Considera revisar los parámetros.';
  }

  return message;
}

function generateBankrollMentorMessage(result, params) {
  const { summary } = result;
  const { ruinRisk, averageProfit, completionRate } = summary;
  const { winProbability, averageOdds, stakeStrategy } = params;

  let message = `Simulación de gestión de banca completada. `;

  if (ruinRisk > 0.3) {
    message += '⚠️ ALTO RIESGO DE RUINA: Considera reducir el tamaño de stake o mejorar la probabilidad de ganar.';
  } else if (ruinRisk > 0.1) {
    message += '⚠️ RIESGO MODERADO: La probabilidad de ruina es significativa. Revisa tu estrategia.';
  } else {
    message += '✅ RIESGO BAJO: La probabilidad de ruina es aceptable.';
  }

  if (averageProfit < 0) {
    message += ' El valor esperado es negativo. Revisa tu edge o reduce el stake.';
  } else if (averageProfit > 0) {
    message += ' El valor esperado es positivo. Mantén la disciplina para capitalizar.';
  }

  return message;
}

/**
 * Funciones para generar recomendaciones
 */
function generateLadderRecommendations(summary, params) {
  const { ruinRisk, completionRate } = summary;
  const { steps, oddsPerStep, successProbability } = params;
  const recommendations = [];

  if (ruinRisk > 0.7) {
    recommendations.push({
      type: 'warning',
      message: 'Reducir el número de pasos para disminuir el riesgo de ruina',
      action: 'Considera un reto de 3-4 pasos en lugar de ' + steps
    });
  }

  if (successProbability < 0.6) {
    recommendations.push({
      type: 'warning',
      message: 'Mejorar la probabilidad de éxito por paso',
      action: 'Enfócate en apuestas con mayor confianza'
    });
  }

  if (oddsPerStep > 2) {
    recommendations.push({
      type: 'info',
      message: 'Cuotas altas aumentan el riesgo',
      action: 'Considera cuotas más bajas para mayor consistencia'
    });
  }

  if (completionRate < 0.1) {
    recommendations.push({
      type: 'danger',
      message: 'Probabilidad de completar muy baja',
      action: 'Revisa completamente la estrategia antes de intentar'
    });
  }

  return recommendations;
}

function generateBankrollRecommendations(result, params) {
  const { summary } = result;
  const { ruinRisk, averageProfit } = summary;
  const { stakeStrategy, stakeSize, winProbability } = params;
  const recommendations = [];

  if (ruinRisk > 0.2) {
    recommendations.push({
      type: 'warning',
      message: 'Reducir el tamaño de stake para disminuir el riesgo de ruina',
      action: `Considera reducir el stake de ${(stakeSize * 100).toFixed(1)}% a ${(stakeSize * 50 * 100).toFixed(1)}%`
    });
  }

  if (winProbability < 0.5) {
    recommendations.push({
      type: 'warning',
      message: 'La probabilidad de ganar es baja',
      action: 'Enfócate en mejorar la selección de apuestas'
    });
  }

  if (stakeStrategy === 'flat' && averageProfit > 0) {
    recommendations.push({
      type: 'info',
      message: 'Considerar estrategia de Kelly fraccional',
      action: 'Podrías optimizar el stake con Kelly fraccional'
    });
  }

  if (averageProfit < 0) {
    recommendations.push({
      type: 'danger',
      message: 'El valor esperado es negativo',
      action: 'Revisa tu edge o considera no apostar'
    });
  }

  return recommendations;
}

module.exports = router;
