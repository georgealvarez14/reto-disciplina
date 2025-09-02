const express = require('express');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { query, getRows } = require('../database/connection');

const router = express.Router();

/**
 * GET /api/export/wagers.csv
 * Exporta todas las apuestas del usuario a CSV
 */
router.get('/wagers.csv', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { from, to, bankrollId, status } = req.query;

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

    // Obtener todas las apuestas
    const wagers = await getRows(`
      SELECT 
        w.id,
        w.placed_at,
        b.name as bankroll_name,
        w.sport,
        w.league,
        w.event,
        w.market,
        w.selection,
        w.odds_decimal,
        w.stake_cop,
        w.stake_units,
        w.book,
        w.status,
        w.result,
        w.payout_cop,
        w.notes,
        w.is_live,
        w.closing_odds,
        w.implied_prob,
        w.ev_expected,
        w.tag_list,
        w.created_at,
        w.updated_at
      FROM wagers w
      JOIN bankrolls b ON w.bankroll_id = b.id
      WHERE ${whereClause}
      ORDER BY w.placed_at DESC
    `, queryParams);

    // Configurar CSV writer
    const csvWriter = createCsvWriter({
      path: 'temp_wagers_export.csv',
      header: [
        { id: 'id', title: 'ID' },
        { id: 'placed_at', title: 'Fecha_Apuesta' },
        { id: 'bankroll_name', title: 'Banca' },
        { id: 'sport', title: 'Deporte' },
        { id: 'league', title: 'Liga' },
        { id: 'event', title: 'Evento' },
        { id: 'market', title: 'Mercado' },
        { id: 'selection', title: 'Selección' },
        { id: 'odds_decimal', title: 'Cuota' },
        { id: 'stake_cop', title: 'Stake_COP' },
        { id: 'stake_units', title: 'Stake_Unidades' },
        { id: 'book', title: 'Casa_Apuestas' },
        { id: 'status', title: 'Estado' },
        { id: 'result', title: 'Resultado' },
        { id: 'payout_cop', title: 'Pago_COP' },
        { id: 'notes', title: 'Notas' },
        { id: 'is_live', title: 'Es_Live' },
        { id: 'closing_odds', title: 'Cuota_Cierre' },
        { id: 'implied_prob', title: 'Prob_Implícita' },
        { id: 'ev_expected', title: 'EV_Esperado' },
        { id: 'tag_list', title: 'Etiquetas' },
        { id: 'created_at', title: 'Fecha_Creación' },
        { id: 'updated_at', title: 'Fecha_Actualización' }
      ]
    });

    // Preparar datos para CSV
    const csvData = wagers.map(wager => ({
      id: wager.id,
      placed_at: wager.placed_at,
      bankroll_name: wager.bankroll_name,
      sport: wager.sport || '',
      league: wager.league || '',
      event: wager.event || '',
      market: wager.market || '',
      selection: wager.selection || '',
      odds_decimal: wager.odds_decimal,
      stake_cop: wager.stake_cop,
      stake_units: wager.stake_units,
      book: wager.book || '',
      status: wager.status,
      result: wager.result || '',
      payout_cop: wager.payout_cop || '',
      notes: wager.notes || '',
      is_live: wager.is_live ? 'Sí' : 'No',
      closing_odds: wager.closing_odds || '',
      implied_prob: wager.implied_prob || '',
      ev_expected: wager.ev_expected || '',
      tag_list: wager.tag_list ? wager.tag_list.join(', ') : '',
      created_at: wager.created_at,
      updated_at: wager.updated_at
    }));

    // Escribir CSV
    await csvWriter.writeRecords(csvData);

    // Configurar headers para descarga
    const filename = `wagers_export_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Enviar archivo
    const fs = require('fs');
    const fileStream = fs.createReadStream('temp_wagers_export.csv');
    fileStream.pipe(res);

    // Limpiar archivo temporal después de enviar
    fileStream.on('end', () => {
      fs.unlink('temp_wagers_export.csv', (err) => {
        if (err) console.error('Error eliminando archivo temporal:', err);
      });
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/export/metrics.csv
 * Exporta métricas y análisis a CSV
 */
router.get('/metrics.csv', async (req, res, next) => {
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

    // Obtener métricas por deporte
    const sportMetrics = await getRows(`
      SELECT 
        sport,
        COUNT(*) as total_wagers,
        COUNT(CASE WHEN status = 'ganada' THEN 1 END) as wins,
        COUNT(CASE WHEN status = 'perdida' THEN 1 END) as losses,
        COALESCE(SUM(stake_cop), 0) as total_staked,
        COALESCE(SUM(CASE WHEN status = 'ganada' THEN payout_cop ELSE 0 END), 0) as total_won,
        COALESCE(AVG(odds_decimal), 0) as avg_odds,
        COALESCE(AVG(stake_units), 0) as avg_stake_units
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
    `, queryParams);

    // Configurar CSV writer para métricas
    const csvWriter = createCsvWriter({
      path: 'temp_metrics_export.csv',
      header: [
        { id: 'category', title: 'Categoría' },
        { id: 'name', title: 'Nombre' },
        { id: 'total_wagers', title: 'Total_Apuestas' },
        { id: 'wins', title: 'Victorias' },
        { id: 'losses', title: 'Pérdidas' },
        { id: 'hit_rate', title: 'Hit_Rate_%' },
        { id: 'total_staked', title: 'Total_Apostado' },
        { id: 'total_won', title: 'Total_Ganado' },
        { id: 'roi', title: 'ROI_%' },
        { id: 'avg_odds', title: 'Cuota_Promedio' },
        { id: 'avg_stake_units', title: 'Stake_Promedio_Unidades' }
      ]
    });

    // Preparar datos para CSV
    const csvData = [];

    // Agregar métricas por deporte
    sportMetrics.forEach(sport => {
      const hitRate = sport.total_wagers > 0 ? (sport.wins / sport.total_wagers * 100) : 0;
      const roi = sport.total_staked > 0 ? ((sport.total_won - sport.total_staked) / sport.total_staked * 100) : 0;
      
      csvData.push({
        category: 'Deporte',
        name: sport.sport,
        total_wagers: sport.total_wagers,
        wins: sport.wins,
        losses: sport.losses,
        hit_rate: parseFloat(hitRate.toFixed(2)),
        total_staked: parseFloat(sport.total_staked),
        total_won: parseFloat(sport.total_won),
        roi: parseFloat(roi.toFixed(2)),
        avg_odds: parseFloat(sport.avg_odds),
        avg_stake_units: parseFloat(sport.avg_stake_units)
      });
    });

    // Agregar métricas por casa de apuestas
    bookMetrics.forEach(book => {
      const hitRate = book.total_wagers > 0 ? (book.wins / book.total_wagers * 100) : 0;
      const roi = book.total_staked > 0 ? ((book.total_won - book.total_staked) / book.total_staked * 100) : 0;
      
      csvData.push({
        category: 'Casa_Apuestas',
        name: book.book,
        total_wagers: book.total_wagers,
        wins: book.wins,
        losses: book.losses,
        hit_rate: parseFloat(hitRate.toFixed(2)),
        total_staked: parseFloat(book.total_staked),
        total_won: parseFloat(book.total_won),
        roi: parseFloat(roi.toFixed(2)),
        avg_odds: parseFloat(book.avg_odds),
        avg_stake_units: ''
      });
    });

    // Agregar métricas mensuales
    monthlyMetrics.forEach(month => {
      const hitRate = month.total_wagers > 0 ? (month.wins / month.total_wagers * 100) : 0;
      const roi = month.total_staked > 0 ? ((month.total_won - month.total_staked) / month.total_staked * 100) : 0;
      
      csvData.push({
        category: 'Mes',
        name: month.month.split('T')[0],
        total_wagers: month.total_wagers,
        wins: month.wins,
        losses: month.losses,
        hit_rate: parseFloat(hitRate.toFixed(2)),
        total_staked: parseFloat(month.total_staked),
        total_won: parseFloat(month.total_won),
        roi: parseFloat(roi.toFixed(2)),
        avg_odds: '',
        avg_stake_units: ''
      });
    });

    // Escribir CSV
    await csvWriter.writeRecords(csvData);

    // Configurar headers para descarga
    const filename = `metrics_export_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Enviar archivo
    const fs = require('fs');
    const fileStream = fs.createReadStream('temp_metrics_export.csv');
    fileStream.pipe(res);

    // Limpiar archivo temporal después de enviar
    fileStream.on('end', () => {
      fs.unlink('temp_metrics_export.csv', (err) => {
        if (err) console.error('Error eliminando archivo temporal:', err);
      });
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/export/bankrolls.csv
 * Exporta información de bancas a CSV
 */
router.get('/bankrolls.csv', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Obtener bancas con métricas
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

    // Configurar CSV writer
    const csvWriter = createCsvWriter({
      path: 'temp_bankrolls_export.csv',
      header: [
        { id: 'id', title: 'ID' },
        { id: 'name', title: 'Nombre' },
        { id: 'start_amount', title: 'Banca_Inicial' },
        { id: 'current_amount', title: 'Banca_Actual' },
        { id: 'bankroll_variation', title: 'Variación_Banca_%' },
        { id: 'unit_size_pct', title: 'Tamaño_Unidad_%' },
        { id: 'strategy', title: 'Estrategia' },
        { id: 'stoploss_daily', title: 'Stop_Loss_Diario' },
        { id: 'stopwin_daily', title: 'Stop_Win_Diario' },
        { id: 'stoploss_weekly', title: 'Stop_Loss_Semanal' },
        { id: 'stopwin_weekly', title: 'Stop_Win_Semanal' },
        { id: 'max_daily_bets', title: 'Máx_Apuestas_Diarias' },
        { id: 'max_odds_allowed', title: 'Máx_Cuota_Permitida' },
        { id: 'total_wagers', title: 'Total_Apuestas' },
        { id: 'wins', title: 'Victorias' },
        { id: 'losses', title: 'Pérdidas' },
        { id: 'hit_rate', title: 'Hit_Rate_%' },
        { id: 'total_staked', title: 'Total_Apostado' },
        { id: 'total_won', title: 'Total_Ganado' },
        { id: 'roi', title: 'ROI_%' },
        { id: 'created_at', title: 'Fecha_Creación' },
        { id: 'updated_at', title: 'Fecha_Actualización' }
      ]
    });

    // Preparar datos para CSV
    const csvData = bankrolls.map(bankroll => {
      const hitRate = bankroll.total_wagers > 0 ? (bankroll.wins / bankroll.total_wagers * 100) : 0;
      const roi = bankroll.total_staked > 0 ? ((bankroll.total_won - bankroll.total_staked) / bankroll.total_staked * 100) : 0;
      const bankrollVariation = bankroll.start_amount > 0 ? ((bankroll.current_amount - bankroll.start_amount) / bankroll.start_amount * 100) : 0;

      return {
        id: bankroll.id,
        name: bankroll.name,
        start_amount: parseFloat(bankroll.start_amount),
        current_amount: parseFloat(bankroll.current_amount),
        bankroll_variation: parseFloat(bankrollVariation.toFixed(2)),
        unit_size_pct: parseFloat(bankroll.unit_size_pct * 100),
        strategy: bankroll.strategy,
        stoploss_daily: bankroll.stoploss_daily || '',
        stopwin_daily: bankroll.stopwin_daily || '',
        stoploss_weekly: bankroll.stoploss_weekly || '',
        stopwin_weekly: bankroll.stopwin_weekly || '',
        max_daily_bets: bankroll.max_daily_bets,
        max_odds_allowed: parseFloat(bankroll.max_odds_allowed),
        total_wagers: bankroll.total_wagers,
        wins: bankroll.wins,
        losses: bankroll.losses,
        hit_rate: parseFloat(hitRate.toFixed(2)),
        total_staked: parseFloat(bankroll.total_staked),
        total_won: parseFloat(bankroll.total_won),
        roi: parseFloat(roi.toFixed(2)),
        created_at: bankroll.created_at,
        updated_at: bankroll.updated_at
      };
    });

    // Escribir CSV
    await csvWriter.writeRecords(csvData);

    // Configurar headers para descarga
    const filename = `bankrolls_export_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Enviar archivo
    const fs = require('fs');
    const fileStream = fs.createReadStream('temp_bankrolls_export.csv');
    fileStream.pipe(res);

    // Limpiar archivo temporal después de enviar
    fileStream.on('end', () => {
      fs.unlink('temp_bankrolls_export.csv', (err) => {
        if (err) console.error('Error eliminando archivo temporal:', err);
      });
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/export/simulations.csv
 * Exporta historial de simulaciones a CSV
 */
router.get('/simulations.csv', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    let whereConditions = ['user_id = $1'];
    let queryParams = [userId];
    let paramCount = 1;

    if (type) {
      paramCount++;
      whereConditions.push(`type = $${paramCount}`);
      queryParams.push(type);
    }

    const whereClause = whereConditions.join(' AND ');

    // Obtener simulaciones
    const simulations = await getRows(`
      SELECT id, type, params_json, result_json, created_at
      FROM simulations
      WHERE ${whereClause}
      ORDER BY created_at DESC
    `, queryParams);

    // Configurar CSV writer
    const csvWriter = createCsvWriter({
      path: 'temp_simulations_export.csv',
      header: [
        { id: 'id', title: 'ID' },
        { id: 'type', title: 'Tipo' },
        { id: 'params', title: 'Parámetros' },
        { id: 'results', title: 'Resultados' },
        { id: 'created_at', title: 'Fecha_Creación' }
      ]
    });

    // Preparar datos para CSV
    const csvData = simulations.map(sim => ({
      id: sim.id,
      type: sim.type,
      params: JSON.stringify(JSON.parse(sim.params_json)),
      results: JSON.stringify(JSON.parse(sim.result_json)),
      created_at: sim.created_at
    }));

    // Escribir CSV
    await csvWriter.writeRecords(csvData);

    // Configurar headers para descarga
    const filename = `simulations_export_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Enviar archivo
    const fs = require('fs');
    const fileStream = fs.createReadStream('temp_simulations_export.csv');
    fileStream.pipe(res);

    // Limpiar archivo temporal después de enviar
    fileStream.on('end', () => {
      fs.unlink('temp_simulations_export.csv', (err) => {
        if (err) console.error('Error eliminando archivo temporal:', err);
      });
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
