import React from 'react';
import { useQuery } from 'react-query';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Wallet, 
  BarChart3, 
  Calendar,
  DollarSign,
  Percent,
  Activity
} from 'lucide-react';
import { analyticsAPI, bankrollAPI } from '../../utils/api';
import { formatCurrency, formatPercentage } from '../../utils/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import MentorMessage from '../../components/UI/MentorMessage';

const DashboardPage: React.FC = () => {
  // Fetch dashboard data
  const { data: metrics, isLoading: metricsLoading } = useQuery(
    'dashboard-metrics',
    () => analyticsAPI.getMetrics(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const { data: bankrolls, isLoading: bankrollsLoading } = useQuery(
    'dashboard-bankrolls',
    () => bankrollAPI.getAll(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const isLoading = metricsLoading || bankrollsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalBankroll = bankrolls?.bankrolls?.reduce((sum: number, bankroll: any) => sum + bankroll.currentAmount, 0) || 0;
  const totalProfit = bankrolls?.bankrolls?.reduce((sum: number, bankroll: any) => sum + (bankroll.currentAmount - bankroll.startAmount), 0) || 0;
  const totalROI = totalBankroll > 0 ? ((totalProfit / (totalBankroll - totalProfit)) * 100) : 0;

  const getMentorMessage = () => {
    if (!metrics) return null;

    const { roi, hitRate, currentStreak } = metrics;
    
    if (roi > 0 && hitRate > 0.55) {
      return {
        type: 'success' as const,
        title: '¡Excelente rendimiento!',
        message: 'Estás demostrando disciplina y consistencia. Mantén este nivel de análisis y gestión de riesgo.',
      };
    } else if (roi < 0 && currentStreak < -3) {
      return {
        type: 'warning' as const,
        title: 'Momentos difíciles',
        message: 'Es normal tener rachas negativas. Revisa tus últimas apuestas, ajusta tu tamaño de stake y mantén la calma.',
      };
    } else if (hitRate < 0.45) {
      return {
        type: 'info' as const,
        title: 'Oportunidad de mejora',
        message: 'Tu tasa de acierto puede mejorar. Considera ser más selectivo con tus picks y analizar más a fondo las líneas.',
      };
    } else {
      return {
        type: 'tip' as const,
        title: 'Mantén el enfoque',
        message: 'La consistencia es clave. Continúa siguiendo tu estrategia y mantén un registro detallado de tus decisiones.',
      };
    }
  };

  const mentorMessage = getMentorMessage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Resumen de tu rendimiento y actividad reciente</p>
        </div>
        <div className="text-sm text-gray-500">
          Última actualización: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Mentor Message */}
      {mentorMessage && (
        <MentorMessage
          type={mentorMessage.type}
          title={mentorMessage.title}
          message={mentorMessage.message}
        />
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Bankroll */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Banca Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalBankroll, 'USD')}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {totalProfit >= 0 ? (
              <TrendingUp className="w-4 h-4 text-success-600 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-danger-600 mr-1" />
            )}
            <span className={totalProfit >= 0 ? 'text-success-600' : 'text-danger-600'}>
              {formatCurrency(Math.abs(totalProfit), 'USD')}
            </span>
            <span className="text-gray-500 ml-1">vs inicial</span>
          </div>
        </div>

        {/* ROI */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ROI Total</p>
              <p className={`text-2xl font-bold ${totalROI >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                {formatPercentage(totalROI)}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <Percent className="w-6 h-6 text-success-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-500">
              <BarChart3 className="w-4 h-4 mr-1" />
              <span>Rendimiento general</span>
            </div>
          </div>
        </div>

        {/* Hit Rate */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasa de Acierto</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics?.hitRate ? formatPercentage(metrics.hitRate * 100) : '0%'}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-warning-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-500">
              <Activity className="w-4 h-4 mr-1" />
              <span>Últimas apuestas</span>
            </div>
          </div>
        </div>

        {/* Active Wagers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Apuestas Activas</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics?.activeWagers || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-info-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-500">
              <DollarSign className="w-4 h-4 mr-1" />
              <span>En curso</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Wagers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Apuestas Recientes</h3>
          {metrics?.recentWagers && metrics.recentWagers.length > 0 ? (
            <div className="space-y-3">
              {metrics.recentWagers.slice(0, 5).map((wager: any) => (
                <div key={wager.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{wager.description}</p>
                    <p className="text-sm text-gray-500">{wager.sport} • {wager.bettingHouse}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${wager.status === 'won' ? 'text-success-600' : wager.status === 'lost' ? 'text-danger-600' : 'text-gray-600'}`}>
                      {wager.status === 'won' ? '+' : wager.status === 'lost' ? '-' : ''}
                      {formatCurrency(wager.stake, 'USD')}
                    </p>
                    <p className="text-sm text-gray-500">{wager.odds}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay apuestas recientes</p>
              <p className="text-sm">Comienza registrando tu primera apuesta</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors">
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-primary-600" />
                <span className="font-medium text-primary-900">Nueva Apuesta</span>
              </div>
              <span className="text-primary-600">→</span>
            </button>
            
            <button className="w-full flex items-center justify-between p-4 bg-success-50 border border-success-200 rounded-lg hover:bg-success-100 transition-colors">
              <div className="flex items-center space-x-3">
                <Wallet className="w-5 h-5 text-success-600" />
                <span className="font-medium text-success-900">Nueva Banca</span>
              </div>
              <span className="text-success-600">→</span>
            </button>
            
            <button className="w-full flex items-center justify-between p-4 bg-warning-50 border border-warning-200 rounded-lg hover:bg-warning-100 transition-colors">
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-5 h-5 text-warning-600" />
                <span className="font-medium text-warning-900">Ver Analítica</span>
              </div>
              <span className="text-warning-600">→</span>
            </button>
            
            <button className="w-full flex items-center justify-between p-4 bg-info-50 border border-info-200 rounded-lg hover:bg-info-100 transition-colors">
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-info-600" />
                <span className="font-medium text-info-900">Simulador</span>
              </div>
              <span className="text-info-600">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento Semanal</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Gráfico de rendimiento</p>
            <p className="text-sm">Próximamente: visualización detallada de tu progreso</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
