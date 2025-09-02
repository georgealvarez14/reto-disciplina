/**
 * Utilidades para cálculos de apuestas
 * Implementa las fórmulas clave especificadas en la documentación
 */

/**
 * Calcula la probabilidad implícita de una cuota
 * @param {number} odds - Cuota en formato decimal
 * @returns {number} Probabilidad implícita (0-1)
 */
const calculateImpliedProbability = (odds) => {
  if (odds <= 1) throw new Error('La cuota debe ser mayor a 1');
  return 1 / odds;
};

/**
 * Calcula el Valor Esperado (EV) de una apuesta
 * @param {number} estimatedProbability - Probabilidad estimada de ganar
 * @param {number} odds - Cuota en formato decimal
 * @returns {number} Valor esperado
 */
const calculateExpectedValue = (estimatedProbability, odds) => {
  if (estimatedProbability < 0 || estimatedProbability > 1) {
    throw new Error('La probabilidad debe estar entre 0 y 1');
  }
  if (odds <= 1) throw new Error('La cuota debe ser mayor a 1');
  
  const winAmount = odds - 1;
  const loseAmount = 1;
  
  return (estimatedProbability * winAmount) - ((1 - estimatedProbability) * loseAmount);
};

/**
 * Calcula el stake por Kelly Criterion (fraccional y capado)
 * @param {number} bankroll - Banca actual
 * @param {number} estimatedProbability - Probabilidad estimada de ganar
 * @param {number} odds - Cuota en formato decimal
 * @param {number} kellyFraction - Fracción de Kelly (0-1, default 0.25)
 * @param {number} maxStakePercent - Porcentaje máximo de stake (0-1, default 0.03)
 * @returns {number} Stake recomendado en unidades monetarias
 */
const calculateKellyStake = (bankroll, estimatedProbability, odds, kellyFraction = 0.25, maxStakePercent = 0.03) => {
  if (estimatedProbability < 0 || estimatedProbability > 1) {
    throw new Error('La probabilidad debe estar entre 0 y 1');
  }
  if (odds <= 1) throw new Error('La cuota debe ser mayor a 1');
  if (kellyFraction <= 0 || kellyFraction > 1) {
    throw new Error('La fracción de Kelly debe estar entre 0 y 1');
  }
  if (maxStakePercent <= 0 || maxStakePercent > 1) {
    throw new Error('El porcentaje máximo debe estar entre 0 y 1');
  }

  const b = odds - 1;
  const q = 1 - estimatedProbability;
  
  // Kelly Criterion completo
  const kellyFull = ((b * estimatedProbability) - q) / b;
  
  // Kelly fraccional y capado
  const kellyFractional = Math.max(0, kellyFull * kellyFraction);
  const kellyCapped = Math.min(kellyFractional, maxStakePercent);
  
  return bankroll * kellyCapped;
};

/**
 * Calcula el tamaño de unidad recomendado basado en el perfil de riesgo
 * @param {string} riskProfile - Perfil de riesgo ('conservador', 'balanceado', 'agresivo')
 * @returns {number} Porcentaje de unidad recomendado
 */
const calculateRecommendedUnitSize = (riskProfile) => {
  const unitSizes = {
    'conservador': 0.02,    // 2%
    'balanceado': 0.025,    // 2.5%
    'agresivo': 0.03        // 3%
  };
  
  return unitSizes[riskProfile] || unitSizes.balanceado;
};

/**
 * Simula un reto escalera usando Monte Carlo
 * @param {Object} params - Parámetros de simulación
 * @param {number} params.steps - Número de pasos
 * @param {number} params.oddsPerStep - Cuota por paso
 * @param {number} params.successProbability - Probabilidad de éxito por paso
 * @param {string} params.stakeMode - Modo de stake ('all_in', 'percentage')
 * @param {number} params.initialBankroll - Banca inicial
 * @param {number} params.stakePercentage - Porcentaje de stake (si no es all_in)
 * @param {number} params.simulations - Número de simulaciones (default 10000)
 * @returns {Object} Resultados de la simulación
 */
const simulateLadderChallenge = (params) => {
  const {
    steps,
    oddsPerStep,
    successProbability,
    stakeMode,
    initialBankroll,
    stakePercentage = 0.1,
    simulations = 10000
  } = params;

  if (steps <= 0) throw new Error('El número de pasos debe ser positivo');
  if (oddsPerStep <= 1) throw new Error('La cuota debe ser mayor a 1');
  if (successProbability < 0 || successProbability > 1) {
    throw new Error('La probabilidad debe estar entre 0 y 1');
  }
  if (initialBankroll <= 0) throw new Error('La banca inicial debe ser positiva');

  const results = [];
  let completions = 0;
  let totalProfit = 0;
  let maxProfit = 0;
  let maxLoss = 0;

  for (let sim = 0; sim < simulations; sim++) {
    let currentBankroll = initialBankroll;
    let success = true;
    let stepResults = [];

    for (let step = 0; step < steps; step++) {
      const stake = stakeMode === 'all_in' 
        ? currentBankroll 
        : currentBankroll * stakePercentage;

      // Simular resultado del paso
      const random = Math.random();
      if (random < successProbability) {
        // Ganar
        const winAmount = stake * (oddsPerStep - 1);
        currentBankroll += winAmount;
        stepResults.push({ step: step + 1, result: 'win', profit: winAmount, bankroll: currentBankroll });
      } else {
        // Perder
        currentBankroll -= stake;
        stepResults.push({ step: step + 1, result: 'loss', profit: -stake, bankroll: currentBankroll });
        success = false;
        break;
      }
    }

    const finalProfit = currentBankroll - initialBankroll;
    results.push({
      simulation: sim + 1,
      success,
      finalBankroll: currentBankroll,
      finalProfit,
      stepResults
    });

    if (success) completions++;
    totalProfit += finalProfit;
    maxProfit = Math.max(maxProfit, finalProfit);
    maxLoss = Math.min(maxLoss, finalProfit);
  }

  const completionRate = completions / simulations;
  const averageProfit = totalProfit / simulations;
  const ruinRisk = 1 - completionRate;

  // Calcular EV teórico
  const theoreticalEV = Math.pow(successProbability, steps) * (Math.pow(oddsPerStep, steps) - 1) - (1 - Math.pow(successProbability, steps));

  return {
    summary: {
      completionRate,
      ruinRisk,
      averageProfit,
      maxProfit,
      maxLoss,
      theoreticalEV,
      simulations
    },
    results: results.slice(0, 100) // Solo retornar las primeras 100 simulaciones para evitar respuesta muy grande
  };
};

/**
 * Calcula el CLV (Closing Line Value)
 * @param {number} openingOdds - Cuota de apertura
 * @param {number} closingOdds - Cuota de cierre
 * @returns {number} CLV como porcentaje
 */
const calculateCLV = (openingOdds, closingOdds) => {
  if (openingOdds <= 1 || closingOdds <= 1) {
    throw new Error('Las cuotas deben ser mayores a 1');
  }
  
  return ((closingOdds - openingOdds) / openingOdds) * 100;
};

/**
 * Calcula métricas de racha
 * @param {Array} wagers - Array de apuestas con resultados
 * @returns {Object} Métricas de racha
 */
const calculateStreakMetrics = (wagers) => {
  const completedWagers = wagers.filter(w => w.status === 'ganada' || w.status === 'perdida');
  
  if (completedWagers.length === 0) {
    return {
      currentStreak: 0,
      maxWinStreak: 0,
      maxLossStreak: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0
    };
  }

  let currentStreak = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let consecutiveWins = 0;
  let consecutiveLosses = 0;

  // Calcular desde la apuesta más reciente
  for (let i = completedWagers.length - 1; i >= 0; i--) {
    const wager = completedWagers[i];
    
    if (wager.status === 'ganada') {
      if (currentStreak >= 0) {
        currentStreak++;
        consecutiveWins++;
        maxWinStreak = Math.max(maxWinStreak, consecutiveWins);
      } else {
        break; // Romper la racha
      }
    } else if (wager.status === 'perdida') {
      if (currentStreak <= 0) {
        currentStreak--;
        consecutiveLosses++;
        maxLossStreak = Math.max(maxLossStreak, consecutiveLosses);
      } else {
        break; // Romper la racha
      }
    }
  }

  return {
    currentStreak,
    maxWinStreak,
    maxLossStreak,
    consecutiveWins,
    consecutiveLosses
  };
};

/**
 * Calcula el ROI (Return on Investment)
 * @param {number} totalStaked - Total apostado
 * @param {number} totalWon - Total ganado
 * @returns {number} ROI como porcentaje
 */
const calculateROI = (totalStaked, totalWon) => {
  if (totalStaked === 0) return 0;
  return ((totalWon - totalStaked) / totalStaked) * 100;
};

/**
 * Calcula el Yield (porcentaje de ganancia sobre lo apostado)
 * @param {number} totalStaked - Total apostado
 * @param {number} totalWon - Total ganado
 * @returns {number} Yield como porcentaje
 */
const calculateYield = (totalStaked, totalWon) => {
  if (totalStaked === 0) return 0;
  return (totalWon / totalStaked - 1) * 100;
};

module.exports = {
  calculateImpliedProbability,
  calculateExpectedValue,
  calculateKellyStake,
  calculateRecommendedUnitSize,
  simulateLadderChallenge,
  calculateCLV,
  calculateStreakMetrics,
  calculateROI,
  calculateYield
};
