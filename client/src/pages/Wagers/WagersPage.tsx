import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Plus, 
  Target, 
  Filter, 
  Search,
  MoreVertical,
  Edit,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { wagerAPI } from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/api';
import { Wager } from '../../types';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import MentorMessage from '../../components/UI/MentorMessage';
import { toast } from 'react-hot-toast';

const WagersPage: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedWager, setSelectedWager] = useState<Wager | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    sport: '',
    dateFrom: '',
    dateTo: '',
  });
  const queryClient = useQueryClient();

  const { data: wagersData, isLoading } = useQuery(
    ['wagers', filters],
    () => wagerAPI.getAll(filters),
    {
      staleTime: 2 * 60 * 1000,
    }
  );

  const closeWagerMutation = useMutation(
    ({ id, outcome }: { id: number; outcome: string }) => wagerAPI.close(id, { status: outcome }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('wagers');
        toast.success('Apuesta cerrada exitosamente');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Error al cerrar la apuesta');
      },
    }
  );

  const getMentorMessage = () => {
    if (!wagersData?.wagers) return null;

    const wagers = wagersData.wagers;
    const totalWagers = wagers.length;
    const wonWagers = wagers.filter((w: any) => w.status === 'won').length;
    const lostWagers = wagers.filter((w: any) => w.status === 'lost').length;
    const activeWagers = wagers.filter((w: any) => w.status === 'active').length;

    if (totalWagers === 0) {
      return {
        type: 'info' as const,
        title: '¡Comienza a apostar!',
        message: 'Registra tu primera apuesta para comenzar a seguir tu rendimiento.',
      };
    } else if (wonWagers > lostWagers && wonWagers / totalWagers > 0.6) {
      return {
        type: 'success' as const,
        title: '¡Excelente tasa de acierto!',
        message: 'Tu análisis está siendo efectivo. Mantén esta selectividad en tus picks.',
      };
    } else if (lostWagers > wonWagers && lostWagers / totalWagers > 0.6) {
      return {
        type: 'warning' as const,
        title: 'Momento de pausa',
        message: 'Tu tasa de acierto está baja. Considera revisar tu estrategia y ser más selectivo.',
      };
    } else if (activeWagers > 5) {
      return {
        type: 'tip' as const,
        title: 'Muchas apuestas activas',
        message: 'Tienes varias apuestas pendientes. Asegúrate de no sobreexponerte.',
      };
    } else {
      return {
        type: 'tip' as const,
        title: 'Rendimiento equilibrado',
        message: 'Tu rendimiento está balanceado. Continúa analizando y mejorando.',
      };
    }
  };

  const mentorMessage = getMentorMessage();

  const handleCloseWager = (wager: Wager, outcome: string) => {
    if (window.confirm(`¿Confirmar que la apuesta ${outcome === 'won' ? 'ganó' : 'perdió'}?`)) {
      closeWagerMutation.mutate({ id: wager.id, outcome });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      won: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      lost: { color: 'bg-red-100 text-red-800', icon: XCircle },
      push: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status === 'active' ? 'Activa' : status === 'won' ? 'Ganada' : status === 'lost' ? 'Perdida' : 'Empate'}
      </span>
    );
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Mis Apuestas</h1>
          <p className="text-gray-600">Gestiona y analiza tus apuestas</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Apuesta</span>
        </button>
      </div>

      {/* Mentor Message */}
      {mentorMessage && (
        <MentorMessage
          type={mentorMessage.type}
          title={mentorMessage.title}
          message={mentorMessage.message}
        />
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="won">Ganadas</option>
            <option value="lost">Perdidas</option>
            <option value="push">Empates</option>
          </select>

          <select
            value={filters.sport}
            onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todos los deportes</option>
            <option value="football">Fútbol</option>
            <option value="basketball">Baloncesto</option>
            <option value="tennis">Tenis</option>
            <option value="baseball">Béisbol</option>
            <option value="hockey">Hockey</option>
          </select>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Desde"
          />

          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Hasta"
          />
        </div>
      </div>

      {/* Wagers List */}
      {wagersData?.wagers && wagersData.wagers.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Apuesta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deporte
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stake
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cuotas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {wagersData.wagers.map((wager: any) => (
                  <tr key={wager.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{wager.description}</div>
                        <div className="text-sm text-gray-500">{wager.bettingHouse}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">{wager.sport}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(wager.stake, wager.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{wager.odds}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(wager.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{formatDate(wager.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative">
                        <button
                          onClick={() => setSelectedWager(selectedWager?.id === wager.id ? null : wager)}
                          className="p-1 rounded-md hover:bg-gray-100"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                        
                        {selectedWager?.id === wager.id && (
                          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                            {wager.status === 'active' && (
                              <>
                                <button
                                  onClick={() => handleCloseWager(wager, 'won')}
                                  className="w-full px-3 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center space-x-2"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Marcar Ganada</span>
                                </button>
                                <button
                                  onClick={() => handleCloseWager(wager, 'lost')}
                                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span>Marcar Perdida</span>
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {/* TODO: Implement edit */}}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Editar</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay apuestas</h3>
          <p className="text-gray-500 mb-6">Registra tu primera apuesta para comenzar a seguir tu rendimiento</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Registrar Primera Apuesta
          </button>
        </div>
      )}

      {/* Create Wager Modal Placeholder */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Nueva Apuesta</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="text-center py-8">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Formulario de nueva apuesta</p>
                <p className="text-sm text-gray-400">Próximamente: formulario completo para registrar apuestas</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WagersPage;
