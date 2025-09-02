import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Target, ArrowRight, Shield, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import MentorMessage from '../../components/UI/MentorMessage';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  currency: string;
  riskProfile: string;
}

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await registerUser(data.email, data.password, data.currency, data.riskProfile);
      toast.success('¡Cuenta creada exitosamente! Tu mentor te dará la bienvenida.');
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al crear la cuenta';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const currencies = [
    { value: 'USD', label: 'USD - Dólar Estadounidense' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'MXN', label: 'MXN - Peso Mexicano' },
    { value: 'COP', label: 'COP - Peso Colombiano' },
    { value: 'ARS', label: 'ARS - Peso Argentino' },
    { value: 'CLP', label: 'CLP - Peso Chileno' },
  ];

  const riskProfiles = [
    {
      value: 'conservative',
      label: 'Conservador',
      description: '1-2% por apuesta, máximo 5% del bankroll',
      icon: Shield,
    },
    {
      value: 'moderate',
      label: 'Moderado',
      description: '2-3% por apuesta, máximo 8% del bankroll',
      icon: TrendingUp,
    },
    {
      value: 'aggressive',
      label: 'Agresivo',
      description: '3-5% por apuesta, máximo 12% del bankroll',
      icon: Target,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Únete a Reto Disciplina
          </h2>
          <p className="text-gray-600">
            Comienza tu jornada hacia la gestión profesional de apuestas
          </p>
        </div>

        {/* Mentor Message */}
        <MentorMessage
          type="info"
          title="¡Bienvenido al Reto!"
          message="Tu mentor te ayudará a desarrollar disciplina, gestionar tu banca de manera profesional y tomar decisiones informadas. Elige tu perfil de riesgo con sabiduría."
        />

        {/* Registration Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                {...register('email', {
                  required: 'El correo electrónico es requerido',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Correo electrónico inválido',
                  },
                })}
                type="email"
                id="email"
                className={`
                  w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent
                  ${errors.email ? 'border-red-300' : 'border-gray-300'}
                `}
                placeholder="tu@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'La contraseña es requerida',
                    minLength: {
                      value: 8,
                      message: 'La contraseña debe tener al menos 8 caracteres',
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`
                    w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    ${errors.password ? 'border-red-300' : 'border-gray-300'}
                  `}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword', {
                    required: 'Confirma tu contraseña',
                    validate: (value) => value === password || 'Las contraseñas no coinciden',
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  className={`
                    w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'}
                  `}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Currency */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                Moneda Principal
              </label>
              <select
                {...register('currency', {
                  required: 'Selecciona tu moneda principal',
                })}
                id="currency"
                className={`
                  w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent
                  ${errors.currency ? 'border-red-300' : 'border-gray-300'}
                `}
              >
                <option value="">Selecciona una moneda</option>
                {currencies.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
              {errors.currency && (
                <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>
              )}
            </div>

            {/* Risk Profile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Perfil de Riesgo
              </label>
              <div className="space-y-3">
                {riskProfiles.map((profile) => {
                  const Icon = profile.icon;
                  return (
                    <label
                      key={profile.value}
                      className={`
                        flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors
                        ${errors.riskProfile ? 'border-red-300' : 'border-gray-300'}
                        hover:border-primary-300 hover:bg-primary-50
                      `}
                    >
                      <input
                        {...register('riskProfile', {
                          required: 'Selecciona tu perfil de riesgo',
                        })}
                        type="radio"
                        value={profile.value}
                        className="mt-1 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Icon className="w-5 h-5 text-primary-600" />
                          <span className="font-medium text-gray-900">{profile.label}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{profile.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              {errors.riskProfile && (
                <p className="mt-1 text-sm text-red-600">{errors.riskProfile.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <>
                  <span>Crear Cuenta</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>Reto Disciplina - Mentor de Apuestas</p>
          <p>Tu camino hacia la disciplina comienza aquí</p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
