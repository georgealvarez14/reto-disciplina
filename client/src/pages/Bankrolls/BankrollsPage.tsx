import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Plus, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  MoreVertical, 
  Edit, 
  Trash2,
  Target,
  DollarSign,
  Percent
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { bankrollAPI } from '../../utils/api';
import { formatCurrency, formatPercentage } from '../../utils/api';
import { Bankroll, CreateBankrollRequest } from '../../types';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import MentorMessage from '../../components/UI/MentorMessage';
import { toast } from 'react-hot-toast';

interface CreateBankrollFormData {
  name: string;
  initialAmount: number;
  currency: string;
  stakingStrategy: string;
  unitSize: number;
  maxDailyBets: number;
  stopLossPercentage: number;
  stopWinPercentage: number;
}

const BankrollsPage: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBankroll, setSelectedBankroll] = useState<Bankroll | null>(null);
  const queryClient = useQueryClient();

  const { data: bankrollsData, isLoading } = useQuery(
    'bankrolls',
    () => bankrollAPI.getBankrolls(),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  const createBankrollMutation = useMutation(
    (data: CreateBankrollRequest) => bankrollAPI.createBankroll(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('bankrolls');
        setShowCreateForm(false);
        toast.success('Banca creada exitosamente');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Error al crear la banca');
      },
    }
  );

  const deleteBankrollMutation = useMutation(
    (id: number) => bankrollAPI.deleteBankroll(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('bankrolls');
        toast.success('Banca eliminada exitosamente');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Error al eliminar la banca');
      },
    }
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBankrollFormData>();

  const onSubmit = (data: CreateBankrollFormData) => {
    createBankrollMutation.mutate({
      ...data,
      initialAmount: Number(data.initialAmount),
      unitSize: Number(data.unitSize),
      maxDailyBets: Number(data.maxDailyBets),
      stopLossPercentage: Number(data.stopLossPercentage),
      stopWinPercentage: Number(data.stopWinPercentage),
    });
  };

  const handleDelete = (bankroll: Bankroll) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la banca "${bankroll.name}"?`)) {
      deleteBankrollMutation.mutate(bankroll.id);
    }
  };

  const getMentorMessage = () => {
    if (!bankrollsData?.bankrolls) return null;

    const bankrolls = bankrollsData.bankrolls;
    const totalBankrolls = bankrolls.length;
    const profitableBankrolls = bankrolls.filter(b => b.currentAmount > b.initialAmount).length;

    if (totalBankrolls === 0) {
      return {
        type: 'info' as const,
        title: '¡Comienza tu jornada!',
        message: 'Crea tu primera banca para empezar a gestionar tus apuestas de manera profesional.',
      };
    } else if (profitableBankrolls === totalBankrolls) {
      return {
        type: 'success' as const,
        title: '¡Excelente gestión!',
        message: 'Todas tus bancas están en positivo. Mantén esta disciplina y consistencia.',
      };
    } else if (profitableBankrolls === 0) {
      return {
        type: 'warning' as const,
        title: 'Momento de reflexión',
        message: 'Todas tus bancas están en negativo. Revisa tu estrategia y considera ajustar tu gestión de riesgo.',
      };
    } else {
      return {
        type: 'tip' as const,
        title: 'Progreso mixto',
        message: 'Algunas bancas están en positivo. Analiza qué está funcionando bien y aplica esas lecciones.',
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
          <h1 className="text-2xl font-bold text-gray-900">Mis Bancas</h1>
          <p className="text-gray-600">Gestiona tus fondos de apuestas</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Banca</span>
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

      {/* Bankrolls Grid */}
      {bankrollsData?.bankrolls && bankrollsData.bankrolls.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bankrollsData.bankrolls.map((bankroll) => {
            const profit = bankroll.currentAmount - bankroll.initialAmount;
            const profitPercentage = (profit / bankroll.initialAmount) * 100;
            const isProfitable = profit >= 0;

            return (
              <div key={bankroll.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{bankroll.name}</h3>
                    <p className="text-sm text-gray-500">{bankroll.currency}</p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setSelectedBankroll(selectedBankroll?.id === bankroll.id ? null : bankroll)}
                      className="p-1 rounded-md hover:bg-gray-100"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {selectedBankroll?.id === bankroll.id && (
                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                        <button
                          onClick={() => {/* TODO: Implement edit */}}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleDelete(bankroll)}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Current Amount */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Banca Actual</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(bankroll.currentAmount, bankroll.currency)}
                    </span>
                  </div>

                  {/* Profit/Loss */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">P&L</span>
                    <div className="flex items-center space-x-2">
                      {isProfitable ? (
                        <TrendingUp className="w-4 h-4 text-success-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-danger-600" />
                      )}
                      <span className={`font-semibold ${isProfitable ? 'text-success-600' : 'text-danger-600'}`}>
                        {formatCurrency(Math.abs(profit), bankroll.currency)}
                      </span>
                      <span className={`text-sm ${isProfitable ? 'text-success-600' : 'text-danger-600'}`}>
                        ({formatPercentage(profitPercentage)})
                      </span>
                    </div>
                  </div>

                  {/* Unit Size */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tamaño de Unidad</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(bankroll.unitSize, bankroll.currency)}
                    </span>
                  </div>

                  {/* Strategy */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estrategia</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {bankroll.stakingStrategy}
                    </span>
                  </div>

                  {/* Limits */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500">Stop Loss</span>
                        <p className="font-medium text-gray-900">{bankroll.stopLossPercentage}%</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Stop Win</span>
                        <p className="font-medium text-gray-900">{bankroll.stopWinPercentage}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes bancas</h3>
          <p className="text-gray-500 mb-6">Crea tu primera banca para comenzar a gestionar tus apuestas</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Crear Primera Banca
          </button>
        </div>
      )}

      {/* Create Bankroll Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Nueva Banca</h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    reset();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Banca
                  </label>
                  <input
                    {...register('name', { required: 'El nombre es requerido' })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ej: Banca Principal"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto Inicial
                  </label>
                  <input
                    {...register('initialAmount', { 
                      required: 'El monto inicial es requerido',
                      min: { value: 1, message: 'El monto debe ser mayor a 0' }
                    })}
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="1000.00"
                  />
                  {errors.initialAmount && (
                    <p className="mt-1 text-sm text-red-600">{errors.initialAmount.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Moneda
                  </label>
                  <select
                    {...register('currency', { required: 'La moneda es requerida' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Selecciona una moneda</option>
                    <option value="USD">USD - Dólar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="MXN">MXN - Peso Mexicano</option>
                    <option value="COP">COP - Peso Colombiano</option>
                    <option value="ARS">ARS - Peso Argentino</option>
                    <option value="CLP">CLP - Peso Chileno</option>
                  </select>
                  {errors.currency && (
                    <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estrategia de Stake
                  </label>
                  <select
                    {...register('stakingStrategy', { required: 'La estrategia es requerida' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Selecciona una estrategia</option>
                    <option value="flat">Flat (Unidad fija)</option>
                    <option value="percentage">Porcentaje del bankroll</option>
                    <option value="kelly">Kelly Criterion</option>
                  </select>
                  {errors.stakingStrategy && (
                    <p className="mt-1 text-sm text-red-600">{errors.stakingStrategy.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tamaño de Unidad
                  </label>
                  <input
                    {...register('unitSize', { 
                      required: 'El tamaño de unidad es requerido',
                      min: { value: 0.01, message: 'El tamaño debe ser mayor a 0' }
                    })}
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="10.00"
                  />
                  {errors.unitSize && (
                    <p className="mt-1 text-sm text-red-600">{errors.unitSize.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stop Loss (%)
                    </label>
                    <input
                      {...register('stopLossPercentage', { 
                        required: 'El stop loss es requerido',
                        min: { value: 1, message: 'Mínimo 1%' },
                        max: { value: 50, message: 'Máximo 50%' }
                      })}
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="20"
                    />
                    {errors.stopLossPercentage && (
                      <p className="mt-1 text-sm text-red-600">{errors.stopLossPercentage.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stop Win (%)
                    </label>
                    <input
                      {...register('stopWinPercentage', { 
                        required: 'El stop win es requerido',
                        min: { value: 1, message: 'Mínimo 1%' },
                        max: { value: 100, message: 'Máximo 100%' }
                      })}
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="50"
                    />
                    {errors.stopWinPercentage && (
                      <p className="mt-1 text-sm text-red-600">{errors.stopWinPercentage.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      reset();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createBankrollMutation.isLoading}
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {createBankrollMutation.isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <LoadingSpinner size="sm" color="white" />
                        <span>Creando...</span>
                      </div>
                    ) : (
                      'Crear Banca'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankrollsPage;
