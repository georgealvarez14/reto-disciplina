import { 
  Home, 
  Wallet, 
  Target, 
  BarChart3, 
  Play, 
  Settings 
} from 'lucide-react';
import { NavItem } from '../types';

export const getNavItems = (): NavItem[] => [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: Home,
  },
  {
    path: '/bankrolls',
    label: 'Mis Bancas',
    icon: Wallet,
  },
  {
    path: '/wagers',
    label: 'Apuestas',
    icon: Target,
  },
  {
    path: '/analytics',
    label: 'Analítica',
    icon: BarChart3,
  },
  {
    path: '/simulator',
    label: 'Simulador',
    icon: Play,
  },
  {
    path: '/settings',
    label: 'Configuración',
    icon: Settings,
  },
];
