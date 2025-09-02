// User types
export interface User {
  id: number;
  email: string;
  currency: string;
  riskProfile: 'conservador' | 'balanceado' | 'agresivo';
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
  bankrolls?: Bankroll[];
  metrics?: UserMetrics;
  mentorMessage: string;
}

export interface UserMetrics {
  totalWagers: number;
  wins: number;
  losses: number;
  totalStaked: number;
  totalWon: number;
}

// Bankroll types
export interface Bankroll {
  id: number;
  name: string;
  startAmount: number;
  currentAmount: number;
  unitSizePct: number;
  strategy: 'flat' | 'percentage' | 'kelly';
  stoplossDaily?: number;
  stopwinDaily?: number;
  stoplossWeekly?: number;
  stopwinWeekly?: number;
  maxDailyBets: number;
  maxOddsAllowed: number;
  createdAt: string;
  updatedAt?: string;
}

export interface BankrollMetrics {
  roi: number;
  bankrollVariation: number;
  hitRate: number;
  totalWagers: number;
  wins: number;
  losses: number;
  totalStaked: number;
  totalWon: number;
  avgOdds?: number;
  avgStakeUnits?: number;
}

export interface BankrollWithMetrics extends Bankroll {
  metrics: BankrollMetrics;
}

// Wager types
export interface Wager {
  id: number;
  bankrollId: number;
  bankrollName?: string;
  sport?: string;
  league?: string;
  event?: string;
  market?: string;
  selection?: string;
  oddsDecimal: number;
  stakeCop: number;
  stakeUnits: number;
  book?: string;
  status: 'pendiente' | 'ganada' | 'perdida' | 'push' | 'cashout';
  result?: string;
  payoutCop?: number;
  notes?: string;
  isLive: boolean;
  impliedProbability?: number;
  evExpected?: number;
  clv?: number;
  tagList?: string[];
  placedAt: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateWagerRequest {
  bankrollId: number;
  sport?: string;
  league?: string;
  event?: string;
  market?: string;
  selection?: string;
  oddsDecimal: number;
  stakeCop: number;
  stakeUnits: number;
  book?: string;
  notes?: string;
  isLive?: boolean;
  estimatedProbability?: number;
  tagList?: string[];
}

export interface UpdateWagerRequest {
  status?: 'pendiente' | 'ganada' | 'perdida' | 'push' | 'cashout';
  result?: string;
  payoutCop?: number;
  closingOdds?: number;
  notes?: string;
  tagList?: string[];
}

// Analytics types
export interface AnalyticsOverview {
  totalWagers: number;
  wins: number;
  losses: number;
  pending: number;
  pushes: number;
  totalStaked: number;
  totalWon: number;
  roi: number;
  yield: number;
  hitRate: number;
  avgOdds: number;
  avgStakeUnits: number;
  avgImpliedProb: number;
}

export interface StreakMetrics {
  currentStreak: number;
  maxWinStreak: number;
  maxLossStreak: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

export interface SportMetrics {
  sport: string;
  totalWagers: number;
  wins: number;
  losses: number;
  totalStaked: number;
  totalWon: number;
  avgOdds: number;
  hitRate: string;
  roi: string;
}

export interface BookMetrics {
  book: string;
  totalWagers: number;
  wins: number;
  losses: number;
  totalStaked: number;
  totalWon: number;
  avgOdds: number;
  hitRate: string;
  roi: string;
}

export interface OddsRangeMetrics {
  oddsRange: string;
  totalWagers: number;
  wins: number;
  losses: number;
  totalStaked: number;
  totalWon: number;
  hitRate: string;
  roi: string;
}

export interface MonthlyMetrics {
  month: string;
  totalWagers: number;
  wins: number;
  losses: number;
  totalStaked: number;
  totalWon: number;
  hitRate: string;
  roi: string;
}

export interface CLVMetrics {
  totalWithCLV: number;
  avgCLV: number;
}

export interface AnalyticsResponse {
  overview: AnalyticsOverview;
  streaks: StreakMetrics;
  bySport: SportMetrics[];
  byBook: BookMetrics[];
  byOddsRange: OddsRangeMetrics[];
  monthly: MonthlyMetrics[];
  clv: CLVMetrics;
  mentorMessage: string;
}

// Performance types
export interface DailyPerformance {
  date: string;
  totalWagers: number;
  wins: number;
  losses: number;
  totalStaked: number;
  totalWon: number;
  roi: number;
  hitRate: number;
  pnl: number;
}

export interface PerformanceStatistics {
  totalDays: number;
  profitableDays: number;
  breakEvenDays: number;
  losingDays: number;
  profitableRate: string;
  avgDailyPnL: number;
  bestDay: {
    date: string;
    pnl: number;
  };
  worstDay: {
    date: string;
    pnl: number;
  };
}

export interface PerformanceResponse {
  dailyPerformance: DailyPerformance[];
  statistics: PerformanceStatistics;
  mentorMessage: string;
}

// Insights types
export interface Insight {
  type: 'warning' | 'success' | 'info' | 'danger';
  category: string;
  title: string;
  message: string;
  data: Record<string, any>;
}

export interface InsightsSummary {
  totalInsights: number;
  warnings: number;
  successes: number;
  info: number;
}

export interface InsightsResponse {
  insights: Insight[];
  summary: InsightsSummary;
  mentorMessage: string;
}

// Simulator types
export interface LadderSimulationParams {
  steps: number;
  oddsPerStep: number;
  successProbability: number;
  stakeMode: 'all_in' | 'percentage';
  initialBankroll: number;
  stakePercentage?: number;
  simulations?: number;
}

export interface LadderSimulationSummary {
  completionRate: number;
  ruinRisk: number;
  averageProfit: number;
  maxProfit: number;
  maxLoss: number;
  theoreticalEV: number;
  simulations: number;
}

export interface LadderSimulationResult {
  simulation: number;
  success: boolean;
  finalBankroll: number;
  finalProfit: number;
  stepResults: Array<{
    step: number;
    result: 'win' | 'loss';
    profit: number;
    bankroll: number;
  }>;
}

export interface LadderSimulationResponse {
  simulation: LadderSimulationSummary;
  sampleResults: LadderSimulationResult[];
  mentorMessage: string;
  recommendations: Recommendation[];
}

export interface BankrollSimulationParams {
  initialBankroll: number;
  winProbability: number;
  averageOdds: number;
  numberOfBets: number;
  stakeStrategy: 'flat' | 'percentage' | 'kelly';
  stakeSize: number;
  simulations?: number;
}

export interface BankrollSimulationSummary {
  completionRate: number;
  ruinRisk: number;
  averageProfit: number;
  maxProfit: number;
  maxLoss: number;
  simulations: number;
  percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
}

export interface BankrollSimulationResponse {
  simulation: {
    summary: BankrollSimulationSummary;
    results: any[];
  };
  mentorMessage: string;
  recommendations: Recommendation[];
}

export interface Recommendation {
  type: 'warning' | 'info' | 'danger';
  message: string;
  action: string;
}

// API Response types
export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
  mentorMessage?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  currency: string;
  riskProfile: 'conservador' | 'balanceado' | 'agresivo';
}

export interface CreateBankrollForm {
  name: string;
  startAmount: number;
  unitSizePct: number;
  strategy: 'flat' | 'percentage' | 'kelly';
  stoplossDaily?: number;
  stopwinDaily?: number;
  stoplossWeekly?: number;
  stopwinWeekly?: number;
  maxDailyBets: number;
  maxOddsAllowed: number;
}

export interface UpdateBankrollForm {
  name?: string;
  unitSizePct?: number;
  strategy?: 'flat' | 'percentage' | 'kelly';
  stoplossDaily?: number | null;
  stopwinDaily?: number | null;
  stoplossWeekly?: number | null;
  stopwinWeekly?: number | null;
  maxDailyBets?: number;
  maxOddsAllowed?: number;
}

// Filter types
export interface WagerFilters {
  bankrollId?: number;
  status?: string;
  sport?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface AnalyticsFilters {
  from?: string;
  to?: string;
  bankrollId?: number;
}

export interface PerformanceFilters {
  period?: string;
}

export interface InsightsFilters {
  days?: number;
}

// Navigation types
export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

// Chart types
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface ChartConfig {
  data: ChartDataPoint[];
  xAxis: string;
  yAxis: string;
  color?: string;
}

// Error types
export interface ApiError {
  error: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
  type?: string;
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface LoadingStateData<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export type Currency = 'COP' | 'USD' | 'EUR';
export type RiskProfile = 'conservador' | 'balanceado' | 'agresivo';
export type WagerStatus = 'pendiente' | 'ganada' | 'perdida' | 'push' | 'cashout';
export type StakeStrategy = 'flat' | 'percentage' | 'kelly';
export type InsightType = 'warning' | 'success' | 'info' | 'danger';
