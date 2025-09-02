import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign,
  Percent,
  Calendar,
  Activity,
  Download
} from 'lucide-react';
import { analyticsAPI } from '../../utils/api';
import { formatCurrency, formatPercentage } from '../../utils/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import MentorMessage from '../../components/UI/MentorMessage';

const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');

  const { data: metrics, isLoading: metricsLoading } = useQuery(
    ['analytics-metrics', timeRange],
    () => analyticsAPI.getMetrics({ timeRange }),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const { data: performance, isLoading: performanceLoading } = useQuery(
    ['analytics-performance', timeRange],
    () => analyticsAPI.getPerformance({ timeRange }),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const { data: insights, isLoading: insightsLoading } = useQuery(
    ['analytics-insights'],
    () => analyticsAPI.getInsights(),
    {
      staleTime: 10 * 60 * 1000,
    }
  );

  const isLoading = metricsLoading || performanceLoading || insightsLoading;

  const getMentorMessage = () => {
    if (!metrics) return null;

    const { roi, hitRate, currentStreak } = metrics;
    
    if (roi > 0.05 && hitRate > 0.55) {
      return {
        type: 'success' as const,
        title: '¡Rendimiento excepcional!',
        message: 'Tu ROI y tasa de acierto están en niveles profesionales. Mantén esta disciplina.',
      };
    } else if (roi < -0.1 || hitRate < 0.4) {
      return {
        type: 'warning' as const,
        title: 'Necesitas ajustes',
        message: 'Tu rendimiento indica que debes revisar tu estrategia. Considera reducir el tamaño de stake.',
      };
    } else if (currentStreak < -3) {
      return {
        type: 'info' as const,
        title: 'Racha negativa',
        message: 'Estás en una racha negativa. Es normal, pero asegúrate de mantener la disciplina.',
      };
    } else {
      return {
        type: 'tip' as const,
        title: 'Progreso constante',
        message: 'Tu rendimiento es estable. Continúa analizando y mejorando gradualmente.',
      };
    }
  };

  const mentorMessage = getMentorMessage();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analítica</h1>
          <p className="text-gray-600">Análisis detallado de tu rendimiento</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="1y">Último año</option>
            <option value="all">Todo el tiempo</option>
          </select>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
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

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ROI</p>
                <p className={`text-2xl font-bold ${metrics.roi >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                  {formatPercentage(metrics.roi * 100)}
                </p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-500">
                <Percent className="w-4 h-4 mr-1" />
                <span>Retorno sobre inversión</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa de Acierto</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage(metrics.hitRate * 100)}
                </p>
              </div>
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-warning-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-500">
                <Target className="w-4 h-4 mr-1" />
                <span>Apuestas ganadas</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Yield</p>
                <p className={`text-2xl font-bold ${metrics.yield >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                  {formatPercentage(metrics.yield * 100)}
                </p>
              </div>
              <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-info-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-500">
                <Activity className="w-4 h-4 mr-1" />
                <span>Rendimiento neto</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Racha Actual</p>
                <p className={`text-2xl font-bold ${metrics.currentStreak >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                  {metrics.currentStreak >= 0 ? '+' : ''}{metrics.currentStreak}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-1" />
                <span>Apuestas consecutivas</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento Diario</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Gráfico de rendimiento</p>
            <p className="text-sm">Próximamente: visualización detallada del rendimiento diario</p>
          </div>
        </div>
      </div>

      {/* Insights and Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sport Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento por Deporte</h3>
          {metrics?.sportBreakdown && metrics.sportBreakdown.length > 0 ? (
            <div className="space-y-3">
              {metrics.sportBreakdown.map((sport) => (
                <div key={sport.sport} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 capitalize">{sport.sport}</p>
                    <p className="text-sm text-gray-500">{sport.totalWagers} apuestas</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${sport.roi >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {formatPercentage(sport.roi * 100)}
                    </p>
                    <p className="text-sm text-gray-500">{formatPercentage(sport.hitRate * 100)} acierto</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay datos de deportes</p>
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights del Mentor</h3>
          {insights?.insights && insights.insights.length > 0 ? (
            <div className="space-y-4">
              {insights.insights.map((insight, index) => (
                <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">{insight.title}</h4>
                  <p className="text-sm text-blue-800">{insight.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay insights disponibles</p>
              <p className="text-sm">Continúa apostando para recibir análisis personalizados</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas Generales</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Apuestas</span>
                <span className="font-medium">{metrics.totalWagers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Apuestas Ganadas</span>
                <span className="font-medium text-success-600">{metrics.wonWagers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Apuestas Perdidas</span>
                <span className="font-medium text-danger-600">{metrics.lostWagers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Apuestas Activas</span>
                <span className="font-medium text-blue-600">{metrics.activeWagers}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rachas</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Racha Máxima Ganadora</span>
                <span className="font-medium text-success-600">{metrics.maxWinningStreak}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Racha Máxima Perdedora</span>
                <span className="font-medium text-danger-600">{metrics.maxLosingStreak}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Promedio de Stake</span>
                <span className="font-medium">{formatCurrency(metrics.averageStake, 'USD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Promedio de Cuotas</span>
                <span className="font-medium">{metrics.averageOdds?.toFixed(2) || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento Mensual</h3>
            <div className="space-y-3">
              {metrics.monthlyBreakdown && metrics.monthlyBreakdown.length > 0 ? (
                metrics.monthlyBreakdown.slice(0, 6).map((month) => (
                  <div key={month.month} className="flex justify-between items-center">
                    <span className="text-gray-600">{month.month}</span>
                    <span className={`font-medium ${month.roi >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {formatPercentage(month.roi * 100)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No hay datos mensuales</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
