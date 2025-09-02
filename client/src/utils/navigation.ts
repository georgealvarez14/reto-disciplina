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
    href: '/dashboard',
    label: 'Dashboard',
    icon: Home,
  },
  {
    href: '/bankrolls',
    label: 'Mis Bancas',
    icon: Wallet,
  },
  {
    href: '/wagers',
    label: 'Apuestas',
    icon: Target,
  },
  {
    href: '/analytics',
    label: 'Analítica',
    icon: BarChart3,
  },
  {
    href: '/simulator',
    label: 'Simulador',
    icon: Play,
  },
  {
    href: '/settings',
    label: 'Configuración',
    icon: Settings,
  },
];
