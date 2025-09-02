import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { 
  Play, 
  Target, 
  TrendingUp, 
  BarChart3, 
  Settings,
  Zap,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { simulatorAPI } from '../../utils/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import MentorMessage from '../../components/UI/MentorMessage';
import { toast } from 'react-hot-toast';

interface LadderSimulationParams {
  initialBankroll: number;
  targetAmount: number;
  unitSize: number;
  odds: number;
  maxSteps: number;
}

interface BankrollSimulationParams {
  initialBankroll: number;
  numberOfBets: number;
  averageOdds: number;
  hitRate: number;
  stakeStrategy: string;
  unitSize: number;
}

const SimulatorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ladder' | 'bankroll'>('ladder');
  const [ladderParams, setLadderParams] = useState<LadderSimulationParams>({
    initialBankroll: 1000,
    targetAmount: 2000,
    unitSize: 50,
    odds: 2.0,
    maxSteps: 10,
  });

  const [bankrollParams, setBankrollParams] = useState<BankrollSimulationParams>({
    initialBankroll: 1000,
    numberOfBets: 100,
    averageOdds: 2.0,
    hitRate: 0.55,
    stakeStrategy: 'flat',
    unitSize: 50,
  });

  const ladderSimulationMutation = useMutation(
    (params: LadderSimulationParams) => simulatorAPI.ladderSimulation(params),
    {
      onSuccess: (data) => {
        toast.success('Simulación completada');
        console.log('Ladder simulation results:', data);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Error en la simulación');
      },
    }
  );

  const bankrollSimulationMutation = useMutation(
    (params: BankrollSimulationParams) => simulatorAPI.bankrollSimulation(params),
    {
      onSuccess: (data) => {
        toast.success('Simulación completada');
        console.log('Bankroll simulation results:', data);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Error en la simulación');
      },
    }
  );

  const handleLadderSimulation = () => {
    ladderSimulationMutation.mutate(ladderParams);
  };

  const handleBankrollSimulation = () => {
    bankrollSimulationMutation.mutate(bankrollParams);
  };

  const getMentorMessage = () => {
    if (activeTab === 'ladder') {
      return {
        type: 'warning' as const,
        title: '¡Cuidado con el Ladder Challenge!',
        message: 'El ladder challenge es una estrategia de alto riesgo. Solo úsala con fondos que puedas permitirte perder completamente.',
      };
    } else {
      return {
        type: 'tip' as const,
        title: 'Simulación de Gestión de Banca',
        message: 'Esta herramienta te ayuda a entender cómo diferentes estrategias afectan tu bankroll a largo plazo.',
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Simulador</h1>
          <p className="text-gray-600">Prueba estrategias sin arriesgar tu dinero real</p>
        </div>
      </div>

      {/* Mentor Message */}
      <MentorMessage
        type={getMentorMessage().type}
        title={getMentorMessage().title}
        message={getMentorMessage().message}
      />

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('ladder')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ladder'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Ladder Challenge</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('bankroll')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bankroll'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Gestión de Banca</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'ladder' ? (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ladder Challenge</h3>
                  <p className="text-sm text-gray-600">Simula una estrategia de progresión de stakes</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banca Inicial
                  </label>
                  <input
                    type="number"
                    value={ladderParams.initialBankroll}
                    onChange={(e) => setLadderParams({ ...ladderParams, initialBankroll: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objetivo
                  </label>
                  <input
                    type="number"
                    value={ladderParams.targetAmount}
                    onChange={(e) => setLadderParams({ ...ladderParams, targetAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="2000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamaño de Unidad
                  </label>
                  <input
                    type="number"
                    value={ladderParams.unitSize}
                    onChange={(e) => setLadderParams({ ...ladderParams, unitSize: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuotas Promedio
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={ladderParams.odds}
                    onChange={(e) => setLadderParams({ ...ladderParams, odds: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="2.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Máximo de Pasos
                  </label>
                  <input
                    type="number"
                    value={ladderParams.maxSteps}
                    onChange={(e) => setLadderParams({ ...ladderParams, maxSteps: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900">Advertencia de Riesgo</h4>
                    <p className="text-sm text-red-800 mt-1">
                      El ladder challenge es una estrategia extremadamente arriesgada. 
                      Puedes perder todo tu bankroll en una sola racha negativa. 
                      Solo usa esta simulación para fines educativos.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLadderSimulation}
                disabled={ladderSimulationMutation.isLoading}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
              >
                {ladderSimulationMutation.isLoading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span>Simulando...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Ejecutar Simulación Ladder</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Gestión de Banca</h3>
                  <p className="text-sm text-gray-600">Simula el comportamiento de tu bankroll a largo plazo</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banca Inicial
                  </label>
                  <input
                    type="number"
                    value={bankrollParams.initialBankroll}
                    onChange={(e) => setBankrollParams({ ...bankrollParams, initialBankroll: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Apuestas
                  </label>
                  <input
                    type="number"
                    value={bankrollParams.numberOfBets}
                    onChange={(e) => setBankrollParams({ ...bankrollParams, numberOfBets: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuotas Promedio
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={bankrollParams.averageOdds}
                    onChange={(e) => setBankrollParams({ ...bankrollParams, averageOdds: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="2.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tasa de Acierto (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={bankrollParams.hitRate * 100}
                    onChange={(e) => setBankrollParams({ ...bankrollParams, hitRate: Number(e.target.value) / 100 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="55"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estrategia de Stake
                  </label>
                  <select
                    value={bankrollParams.stakeStrategy}
                    onChange={(e) => setBankrollParams({ ...bankrollParams, stakeStrategy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="flat">Flat (Unidad fija)</option>
                    <option value="percentage">Porcentaje del bankroll</option>
                    <option value="kelly">Kelly Criterion</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamaño de Unidad
                  </label>
                  <input
                    type="number"
                    value={bankrollParams.unitSize}
                    onChange={(e) => setBankrollParams({ ...bankrollParams, unitSize: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Simulación Educativa</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      Esta simulación usa Monte Carlo para mostrar diferentes escenarios posibles. 
                      Los resultados son estimaciones basadas en probabilidades, no predicciones exactas.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBankrollSimulation}
                disabled={bankrollSimulationMutation.isLoading}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
              >
                {bankrollSimulationMutation.isLoading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span>Simulando...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Ejecutar Simulación de Banca</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultados de Simulación</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Resultados de simulación</p>
            <p className="text-sm">Ejecuta una simulación para ver los resultados detallados</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulatorPage;
