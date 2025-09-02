import React from 'react';
import { Brain, TrendingUp, AlertTriangle, Info, CheckCircle } from 'lucide-react';

interface MentorMessageProps {
  type?: 'info' | 'success' | 'warning' | 'error' | 'tip';
  title?: string;
  message: string;
  className?: string;
  showIcon?: boolean;
}

const MentorMessage: React.FC<MentorMessageProps> = ({
  type = 'info',
  title,
  message,
  className = '',
  showIcon = true,
}) => {
  const typeConfig = {
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50 border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
    },
    error: {
      icon: AlertTriangle,
      bgColor: 'bg-red-50 border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
    },
    tip: {
      icon: Brain,
      bgColor: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-800',
      iconColor: 'text-purple-600',
    },
  };

  const config = typeConfig[type];
  const IconComponent = config.icon;

  return (
    <div className={`mentor-message ${config.bgColor} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        {showIcon && (
          <div className={`flex-shrink-0 ${config.iconColor}`}>
            <IconComponent className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1">
          {title && (
            <h4 className={`font-semibold text-sm mb-1 ${config.textColor}`}>
              {title}
            </h4>
          )}
          <p className={`text-sm ${config.textColor}`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MentorMessage;
