import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Download,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import MentorMessage from '../../components/UI/MentorMessage';
import { toast } from 'react-hot-toast';

const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'data'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    email: user?.email || '',
    currency: user?.currency || 'USD',
    riskProfile: user?.riskProfile || 'moderate',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    mentorMessages: true,
    weeklyReports: true,
    lossAlerts: true,
    winAlerts: false,
  });

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement profile update API call
      updateUser(profileData);
      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      toast.error('Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement password change API call
      toast.success('Contraseña actualizada exitosamente');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error('Error al actualizar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataExport = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement data export
      toast.success('Datos exportados exitosamente');
    } catch (error) {
      toast.error('Error al exportar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
      setIsLoading(true);
      try {
        // TODO: Implement account deletion
        toast.success('Cuenta eliminada exitosamente');
      } catch (error) {
        toast.error('Error al eliminar la cuenta');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600">Gestiona tu cuenta y preferencias</p>
        </div>
      </div>

      {/* Mentor Message */}
      <MentorMessage
        type="info"
        title="Configuración Personalizada"
        message="Ajusta la aplicación según tus necesidades. Recuerda que la configuración de riesgo afecta directamente tu gestión de banca."
      />

      {/* Settings Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Perfil</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Seguridad</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Notificaciones</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'data'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Datos</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Información del Perfil</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">El correo electrónico no se puede cambiar</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moneda Principal
                  </label>
                  <select
                    value={profileData.currency}
                    onChange={(e) => setProfileData({ ...profileData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="USD">USD - Dólar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="MXN">MXN - Peso Mexicano</option>
                    <option value="COP">COP - Peso Colombiano</option>
                    <option value="ARS">ARS - Peso Argentino</option>
                    <option value="CLP">CLP - Peso Chileno</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Perfil de Riesgo
                  </label>
                  <select
                    value={profileData.riskProfile}
                    onChange={(e) => setProfileData({ ...profileData, riskProfile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="conservative">Conservador</option>
                    <option value="moderate">Moderado</option>
                    <option value="aggressive">Agresivo</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleProfileUpdate}
                disabled={isLoading}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" color="white" />
                    <span>Actualizando...</span>
                  </div>
                ) : (
                  'Actualizar Perfil'
                )}
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Seguridad de la Cuenta</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña Actual
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handlePasswordChange}
                  disabled={isLoading}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" color="white" />
                      <span>Actualizando...</span>
                    </div>
                  ) : (
                    'Cambiar Contraseña'
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Configuración de Notificaciones</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Notificaciones por Email</h4>
                    <p className="text-sm text-gray-600">Recibe actualizaciones importantes por correo</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Notificaciones Push</h4>
                    <p className="text-sm text-gray-600">Alertas en tiempo real en tu dispositivo</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.pushNotifications}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Mensajes del Mentor</h4>
                    <p className="text-sm text-gray-600">Consejos y recomendaciones personalizadas</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.mentorMessages}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, mentorMessages: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Reportes Semanales</h4>
                    <p className="text-sm text-gray-600">Resumen semanal de tu rendimiento</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.weeklyReports}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, weeklyReports: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Gestión de Datos</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Exportar Datos</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    Descarga todos tus datos en formato CSV para análisis externo o respaldo.
                  </p>
                  <button
                    onClick={handleDataExport}
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar Datos</span>
                  </button>
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2">Eliminar Cuenta</h4>
                  <p className="text-sm text-red-800 mb-3">
                    Esta acción eliminará permanentemente tu cuenta y todos tus datos. Esta acción no se puede deshacer.
                  </p>
                  <button
                    onClick={handleAccountDeletion}
                    disabled={isLoading}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar Cuenta</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
