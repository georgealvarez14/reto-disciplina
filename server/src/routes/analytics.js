const express = require('express');
const { query, getRow, getRows } = require('../database/connection');
const { 
  calculateROI, 
  calculateYield, 
  calculateStreakMetrics,
  calculateCLV
} = require('../utils/bettingCalculations');

const router = express.Router();

/**
 * GET /api/analytics/metrics
 * Obtiene métricas generales del usuario
 */
router.get('/metrics', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { from, to, bankrollId } = req.query;

    let whereConditions = ['b.user_id = $1'];
    let queryParams = [userId];
    let paramCount = 1;

    if (bankrollId) {
      paramCount++;
      whereConditions.push(`w.bankroll_id = $${paramCount}`);
      queryParams.push(bankrollId);
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

    // Obtener métricas básicas
    const basicMetrics = await getRow(`
      SELECT 
        COUNT(*) as total_wagers,
        COUNT(CASE WHEN status = 'ganada' THEN 1 END) as wins,
        COUNT(CASE WHEN status = 'perdida' THEN 1 END) as losses,
        COUNT(CASE WHEN status = 'pendiente' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'push' THEN 1 END) as pushes,
        COALESCE(SUM(stake_cop), 0) as total_staked,
        COALESCE(SUM(CASE WHEN status = 'ganada' THEN payout_cop ELSE 0 END), 0) as total_won,
        COALESCE(AVG(odds_decimal), 0) as avg_odds,
        COALESCE(AVG(stake_units), 0) as avg_stake_units,
        COALESCE(AVG(implied_prob), 0) as avg_implied_prob
      FROM wagers w
      JOIN bankrolls b ON w.bankroll_id = b.id
      WHERE ${whereClause}
    `, queryParams);

    // Calcular métricas derivadas
    const totalStaked = parseFloat(basicMetrics.total_staked);
    const totalWon = parseFloat(basicMetrics.total_won);
    const totalWagers = parseInt(basicMetrics.total_wagers);
    const wins = parseInt(basicMetrics.wins);
    const losses = parseInt(basicMetrics.losses);

    const roi = calculateROI(totalStaked, totalWon);
    const yield = calculateYield(totalStaked, totalWon);
    const hitRate = totalWagers > 0 ? (wins / totalWagers) * 100 : 0;

    // Obtener métricas de racha
    const wagersForStreak = await getRows(`
      SELECT status, placed_at
      FROM wagers w
      JOIN bankrolls b ON w.bankroll_id = b.id
      WHERE ${whereClause}
      ORDER BY placed_at DESC
    `, queryParams);

    const streakMetrics = calculateStreakMetrics(wagersForStreak);

    // Obtener métricas por deporte
    const sportMetrics = await getRows(`
      SELECT 
        sport,
        COUNT(*) as total_wagers,
        COUNT(CASE WHEN status = 'ganada' THEN 1 END) as wins,
        COUNT(CASE WHEN status = 'perdida' THEN 1 END) as losses,
        COALESCE(SUM(stake_cop), 0) as total_staked,
        COALESCE(SUM(CASE WHEN status = 'ganada' THEN payout_cop ELSE 0 END), 0) as total_won,
        COALESCE(AVG(odds_decimal), 0) as avg_odds
      FROM wagers w
      JOIN bankrolls b ON w.bankroll_id = b.id
      WHERE ${whereClause} AND sport IS NOT NULL
      GROUP BY sport
      ORDER BY total_wagers DESC
    `, queryParams);

    // Obtener métricas por casa de apuestas
    const bookMetrics = await getRows(`
      SELECT 
        book,
        COUNT(*) as total_wagers,
        COUNT(CASE WHEN status = 'ganada' THEN 1 END) as wins,
        COUNT(CASE WHEN status = 'perdida' THEN 1 END) as losses,
        COALESCE(SUM(stake_cop), 0) as total_staked,
        COALESCE(SUM(CASE WHEN status = 'ganada' THEN payout_cop ELSE 0 END), 0) as total_won,
        COALESCE(AVG(odds_decimal), 0) as avg_odds
      FROM wagers w
      JOIN bankrolls b ON w.bankroll_id = b.id
      WHERE ${whereClause} AND book IS NOT NULL
      GROUP BY book
      ORDER BY total_wagers DESC
    `, queryParams);

    // Obtener métricas por rango de cuotas
    const oddsRangeMetrics = await getRows(`
      SELECT 
        CASE 
          WHEN odds_decimal < 1.5 THEN '1.01-1.49'
          WHEN odds_decimal < 2.0 THEN '1.50-1.99'
          WHEN odds_decimal < 3.0 THEN '2.00-2.99'
          WHEN odds_decimal < 5.0 THEN '3.00-4.99'
          ELSE '5.00+'
        END as odds_range,
        COUNT(*) as total_wagers,
        COUNT(CASE WHEN status = 'ganada' THEN 1 END) as wins,
        COUNT(CASE WHEN status = 'perdida' THEN 1 END) as losses,
        COALESCE(SUM(stake_cop), 0) as total_staked,
        COALESCE(SUM(CASE WHEN status = 'ganada' THEN payout_cop ELSE 0 END), 0) as total_won
      FROM wagers w
      JOIN bankrolls b ON w.bankroll_id = b.id
      WHERE ${whereClause}
      GROUP BY odds_range
      ORDER BY MIN(odds_decimal)
    `, queryParams);

    // Obtener métricas mensuales
    const monthlyMetrics = await getRows(`
      SELECT 
        DATE_TRUNC('month', placed_at) as month,
        COUNT(*) as total_wagers,
        COUNT(CASE WHEN status = 'ganada' THEN 1 END) as wins,
        COUNT(CASE WHEN status = 'perdida' THEN 1 END) as losses,
        COALESCE(SUM(stake_cop), 0) as total_staked,
        COALESCE(SUM(CASE WHEN status = 'ganada' THEN payout_cop ELSE 0 END), 0) as total_won
      FROM wagers w
      JOIN bankrolls b ON w.bankroll_id = b.id
      WHERE ${whereClause}
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `, queryParams);

    // Calcular CLV promedio
    const clvMetrics = await getRow(`
      SELECT 
        COUNT(*) as total_with_clv,
        COALESCE(AVG(
          (closing_odds - odds_decimal) / odds_decimal * 100
        ), 0) as avg_clv
      FROM wagers w
      JOIN bankrolls b ON w.bankroll_id = b.id
      WHERE ${whereClause} AND closing_odds IS NOT NULL
    `, queryParams);

    res.json({
      overview: {
        totalWagers,
        wins,
        losses,
        pending: parseInt(basicMetrics.pending),
        pushes: parseInt(basicMetrics.pushes),
        totalStaked,
        totalWon,
        roi: parseFloat(roi.toFixed(2)),
        yield: parseFloat(yield.toFixed(2)),
        hitRate: parseFloat(hitRate.toFixed(2)),
        avgOdds: parseFloat(basicMetrics.avg_odds),
        avgStakeUnits: parseFloat(basicMetrics.avg_stake_units),
        avgImpliedProb: parseFloat(basicMetrics.avg_implied_prob)
      },
      streaks: streakMetrics,
      bySport: sportMetrics.map(sport => ({
        ...sport,
        hitRate: sport.total_wagers > 0 ? (sport.wins / sport.total_wagers * 100).toFixed(2) : 0,
        roi: calculateROI(sport.total_staked, sport.total_won).toFixed(2)
      })),
      byBook: bookMetrics.map(book => ({
        ...book,
        hitRate: book.total_wagers > 0 ? (book.wins / book.total_wagers * 100).toFixed(2) : 0,
        roi: calculateROI(book.total_staked, book.total_won).toFixed(2)
      })),
      byOddsRange: oddsRangeMetrics.map(range => ({
        ...range,
        hitRate: range.total_wagers > 0 ? (range.wins / range.total_wagers * 100).toFixed(2) : 0,
        roi: calculateROI(range.total_staked, range.total_won).toFixed(2)
      })),
      monthly: monthlyMetrics.map(month => ({
        ...month,
        hitRate: month.total_wagers > 0 ? (month.wins / month.total_wagers * 100).toFixed(2) : 0,
        roi: calculateROI(month.total_staked, month.total_won).toFixed(2)
      })),
      clv: {
        totalWithCLV: parseInt(clvMetrics.total_with_clv),
        avgCLV: parseFloat(clvMetrics.avg_clv.toFixed(2))
      },
      mentorMessage: generateAnalyticsMentorMessage({
        roi,
        hitRate,
        streakMetrics,
        totalWagers,
        avgOdds: parseFloat(basicMetrics.avg_odds)
      })
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/performance
 * Obtiene análisis de rendimiento detallado
 */
router.get('/performance', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period = '30' } = req.query; // días

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Obtener rendimiento diario
    const dailyPerformance = await getRows(`
      SELECT 
        DATE(placed_at) as date,
        COUNT(*) as total_wagers,
        COUNT(CASE WHEN status = 'ganada' THEN 1 END) as wins,
        COUNT(CASE WHEN status = 'perdida' THEN 1 END) as losses,
        COALESCE(SUM(stake_cop), 0) as total_staked,
        COALESCE(SUM(CASE WHEN status = 'ganada' THEN payout_cop ELSE 0 END), 0) as total_won
      FROM wagers w
      JOIN bankrolls b ON w.bankroll_id = b.id
      WHERE b.user_id = $1 AND placed_at >= $2
      GROUP BY DATE(placed_at)
      ORDER BY date DESC
    `, [userId, daysAgo.toISOString()]);

    // Calcular métricas de rendimiento
    const performanceMetrics = dailyPerformance.map(day => {
      const roi = calculateROI(day.total_staked, day.total_won);
      const hitRate = day.total_wagers > 0 ? (day.wins / day.total_wagers * 100) : 0;
      
      return {
        date: day.date,
        totalWagers: parseInt(day.total_wagers),
        wins: parseInt(day.wins),
        losses: parseInt(day.losses),
        totalStaked: parseFloat(day.total_staked),
        totalWon: parseFloat(day.total_won),
        roi: parseFloat(roi.toFixed(2)),
        hitRate: parseFloat(hitRate.toFixed(2)),
        pnl: parseFloat(day.total_won - day.total_staked)
      };
    });

    // Calcular estadísticas de rendimiento
    const totalDays = performanceMetrics.length;
    const profitableDays = performanceMetrics.filter(day => day.pnl > 0).length;
    const breakEvenDays = performanceMetrics.filter(day => day.pnl === 0).length;
    const losingDays = performanceMetrics.filter(day => day.pnl < 0).length;

    const avgDailyPnL = performanceMetrics.reduce((sum, day) => sum + day.pnl, 0) / totalDays;
    const bestDay = performanceMetrics.reduce((best, day) => day.pnl > best.pnl ? day : best);
    const worstDay = performanceMetrics.reduce((worst, day) => day.pnl < worst.pnl ? day : worst);

    res.json({
      dailyPerformance: performanceMetrics,
      statistics: {
        totalDays,
        profitableDays,
        breakEvenDays,
        losingDays,
        profitableRate: totalDays > 0 ? (profitableDays / totalDays * 100).toFixed(2) : 0,
        avgDailyPnL: parseFloat(avgDailyPnL.toFixed(2)),
        bestDay: {
          date: bestDay?.date,
          pnl: bestDay?.pnl || 0
        },
        worstDay: {
          date: worstDay?.date,
          pnl: worstDay?.pnl || 0
        }
      },
      mentorMessage: generatePerformanceMentorMessage({
        profitableRate: totalDays > 0 ? (profitableDays / totalDays * 100) : 0,
        avgDailyPnL,
        totalDays
      })
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/insights
 * Obtiene insights y recomendaciones personalizadas
 */
router.get('/insights', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // Obtener datos para análisis
    const recentWagers = await getRows(`
      SELECT 
        w.*,
        b.name as bankroll_name
      FROM wagers w
      JOIN bankrolls b ON w.bankroll_id = b.id
      WHERE b.user_id = $1 AND w.placed_at >= $2
      ORDER BY w.placed_at DESC
    `, [userId, daysAgo.toISOString()]);

    const insights = [];

    // Análisis de hit rate por deporte
    const sportAnalysis = await getRows(`
      SELECT 
        sport,
        COUNT(*) as total_wagers,
        COUNT(CASE WHEN status = 'ganada' THEN 1 END) as wins,
        COALESCE(SUM(stake_cop), 0) as total_staked,
        COALESCE(SUM(CASE WHEN status = 'ganada' THEN payout_cop ELSE 0 END), 0) as total_won
      FROM wagers w
      JOIN bankrolls b ON w.bankroll_id = b.id
      WHERE b.user_id = $1 AND w.placed_at >= $2 AND sport IS NOT NULL
      GROUP BY sport
      HAVING COUNT(*) >= 5
    `, [userId, daysAgo.toISOString()]);

    sportAnalysis.forEach(sport => {
      const hitRate = (sport.wins / sport.total_wagers * 100);
      const roi = calculateROI(sport.total_staked, sport.total_won);

      if (hitRate < 40) {
        insights.push({
          type: 'warning',
          category: 'sport_performance',
          title: `Bajo rendimiento en ${sport.sport}`,
          message: `Tu hit rate en ${sport.sport} es del ${hitRate.toFixed(1)}%. Considera revisar tu estrategia o reducir stakes.`,
          data: { sport: sport.sport, hitRate, roi }
        });
      } else if (hitRate > 60) {
        insights.push({
          type: 'success',
          category: 'sport_performance',
          title: `Excelente rendimiento en ${sport.sport}`,
          message: `Tu hit rate en ${sport.sport} es del ${hitRate.toFixed(1)}%. Mantén la disciplina en este deporte.`,
          data: { sport: sport.sport, hitRate, roi }
        });
      }
    });

    // Análisis de cuotas
    const oddsAnalysis = await getRow(`
      SELECT 
        AVG(CASE WHEN odds_decimal < 1.5 THEN 1 ELSE 0 END) as low_odds_pct,
        AVG(CASE WHEN odds_decimal >= 1.5 AND odds_decimal < 3.0 THEN 1 ELSE 0 END) as medium_odds_pct,
        AVG(CASE WHEN odds_decimal >= 3.0 THEN 1 ELSE 0 END) as high_odds_pct,
        AVG(odds_decimal) as avg_odds
      FROM wagers w
      JOIN bankrolls b ON w.bankroll_id = b.id
      WHERE b.user_id = $1 AND w.placed_at >= $2
    `, [userId, daysAgo.toISOString()]);

    const avgOdds = parseFloat(oddsAnalysis.avg_odds);
    if (avgOdds > 3.0) {
      insights.push({
        type: 'warning',
        category: 'odds_distribution',
        title: 'Cuotas altas predominantes',
        message: `Tu cuota promedio es ${avgOdds.toFixed(2)}. Considera incluir más apuestas con cuotas más bajas para mayor consistencia.`,
        data: { avgOdds }
      });
    }

    // Análisis de stake
    const stakeAnalysis = await getRow(`
      SELECT 
        AVG(stake_units) as avg_stake_units,
        MAX(stake_units) as max_stake_units,
        COUNT(CASE WHEN stake_units > 3 THEN 1 END) as high_stake_count
      FROM wagers w
      JOIN bankrolls b ON w.bankroll_id = b.id
      WHERE b.user_id = $1 AND w.placed_at >= $2
    `, [userId, daysAgo.toISOString()]);

    const avgStakeUnits = parseFloat(stakeAnalysis.avg_stake_units);
    const highStakeCount = parseInt(stakeAnalysis.high_stake_count);

    if (avgStakeUnits > 2.5) {
      insights.push({
        type: 'warning',
        category: 'stake_management',
        title: 'Stakes altos detectados',
        message: `Tu stake promedio es de ${avgStakeUnits.toFixed(1)} unidades. Considera reducir el tamaño para mayor sostenibilidad.`,
        data: { avgStakeUnits }
      });
    }

    if (highStakeCount > 0) {
      insights.push({
        type: 'info',
        category: 'stake_management',
        title: 'Apuestas con stakes altos',
        message: `Tienes ${highStakeCount} apuestas con stakes superiores a 3 unidades. Revisa si fueron decisiones impulsivas.`,
        data: { highStakeCount }
      });
    }

    // Análisis de CLV
    const clvAnalysis = await getRow(`
      SELECT 
        AVG((closing_odds - odds_decimal) / odds_decimal * 100) as avg_clv,
        COUNT(*) as total_with_clv
      FROM wagers w
      JOIN bankrolls b ON w.bankroll_id = b.id
      WHERE b.user_id = $1 AND w.placed_at >= $2 AND closing_odds IS NOT NULL
    `, [userId, daysAgo.toISOString()]);

    if (parseInt(clvAnalysis.total_with_clv) > 0) {
      const avgCLV = parseFloat(clvAnalysis.avg_clv);
      if (avgCLV < -1) {
        insights.push({
          type: 'warning',
          category: 'line_movement',
          title: 'CLV negativo detectado',
          message: `Tu CLV promedio es ${avgCLV.toFixed(2)}%. Considera revisar tus fuentes de información o timing de apuestas.`,
          data: { avgCLV }
        });
      } else if (avgCLV > 1) {
        insights.push({
          type: 'success',
          category: 'line_movement',
          title: 'CLV positivo detectado',
          message: `Tu CLV promedio es ${avgCLV.toFixed(2)}%. Excelente trabajo en el timing de tus apuestas.`,
          data: { avgCLV }
        });
      }
    }

    res.json({
      insights,
      summary: {
        totalInsights: insights.length,
        warnings: insights.filter(i => i.type === 'warning').length,
        successes: insights.filter(i => i.type === 'success').length,
        info: insights.filter(i => i.type === 'info').length
      },
      mentorMessage: generateInsightsMentorMessage(insights)
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Funciones para generar mensajes del mentor
 */
function generateAnalyticsMentorMessage(metrics) {
  const { roi, hitRate, streakMetrics, totalWagers, avgOdds } = metrics;
  const messages = [];

  if (roi < -5) {
    messages.push('Tu ROI está en negativo. Es momento de hacer una pausa y reevaluar tu estrategia.');
  } else if (roi > 10) {
    messages.push('¡Excelente ROI! Mantén la disciplina y no te confíes.');
  }

  if (hitRate < 40) {
    messages.push('Tu hit rate es bajo. Enfócate en la calidad sobre la cantidad.');
  } else if (hitRate > 60) {
    messages.push('Hit rate impresionante. Asegúrate de que los stakes sean apropiados.');
  }

  if (streakMetrics.currentStreak < -3) {
    messages.push('Estás en una racha negativa. Considera reducir stakes temporalmente.');
  }

  if (avgOdds > 3) {
    messages.push('Cuotas altas predominantes. Considera incluir más apuestas con cuotas más bajas.');
  }

  if (totalWagers < 10) {
    messages.push('Pocas apuestas registradas. Necesitas más datos para un análisis completo.');
  }

  return messages.length > 0 
    ? messages.join(' ') 
    : 'Tus métricas se ven bien. Mantén la consistencia y la disciplina.';
}

function generatePerformanceMentorMessage(metrics) {
  const { profitableRate, avgDailyPnL, totalDays } = metrics;
  const messages = [];

  if (profitableRate < 40) {
    messages.push('Menos del 40% de días son rentables. Considera revisar tu estrategia de selección.');
  } else if (profitableRate > 70) {
    messages.push('¡Excelente! Más del 70% de días son rentables. Mantén la disciplina.');
  }

  if (avgDailyPnL < 0) {
    messages.push('PnL diario promedio negativo. Es momento de hacer una pausa.');
  }

  if (totalDays < 7) {
    messages.push('Pocos días de datos. Necesitas más tiempo para un análisis completo.');
  }

  return messages.length > 0 
    ? messages.join(' ') 
    : 'Tu rendimiento diario se ve estable. Continúa con la disciplina.';
}

function generateInsightsMentorMessage(insights) {
  if (insights.length === 0) {
    return 'No se detectaron insights específicos. Tus patrones se ven saludables.';
  }

  const warnings = insights.filter(i => i.type === 'warning').length;
  const successes = insights.filter(i => i.type === 'success').length;

  if (warnings > successes) {
    return 'Se detectaron varias áreas de mejora. Enfócate en una a la vez para no abrumarte.';
  } else if (successes > warnings) {
    return '¡Excelente! La mayoría de insights son positivos. Mantén lo que estás haciendo bien.';
  } else {
    return 'Balance de insights mixto. Enfócate en las áreas de mejora mientras mantienes tus fortalezas.';
  }
}

module.exports = router;
