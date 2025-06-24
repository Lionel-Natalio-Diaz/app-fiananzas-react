import type { UserCategory } from './types';

// Default categories to seed for new users.
export const DEFAULT_CATEGORIES: Omit<UserCategory, 'id' | 'isDefault'>[] = [
  // Expenses
  { name: 'Supermercado', icon: 'ShoppingCart', color: '#3A8CFF', type: 'expense' },
  { name: 'Comida', icon: 'Utensils', color: '#FF7A5A', type: 'expense' },
  { name: 'Transporte', icon: 'Car', color: '#FFD24C', type: 'expense' },
  { name: 'Servicios', icon: 'Wrench', color: '#29B6F6', type: 'expense' },
  { name: 'Mascotas', icon: 'PawPrint', color: '#A6E22E', type: 'expense' },
  { name: 'Ropa', icon: 'Shirt', color: '#FF66B3', type: 'expense' },
  { name: 'Salud', icon: 'HeartPulse', color: '#30D98A', type: 'expense' },
  { name: 'Educación', icon: 'GraduationCap', color: '#B37FFF', type: 'expense' },
  { name: 'Regalos', icon: 'Gift', color: '#D960FF', type: 'expense' },
  { name: 'Viajes', icon: 'Plane', color: '#00C8E5', type: 'expense' },
  { name: 'Entretenimiento', icon: 'Wallet', color: '#FF9E40', type: 'expense' },
  { name: 'Impuestos', icon: 'Landmark', color: '#C7AA6D', type: 'expense' },
  { name: 'Inversiones', icon: 'TrendingUp', color: '#6F5CFF', type: 'expense' },
  { name: 'Otros', icon: 'MoreHorizontal', color: '#FF6E57', type: 'expense' },

  // Income
  { name: 'Salario', icon: 'Briefcase', color: '#30D98A', type: 'income' },
  { name: 'Inversiones', icon: 'TrendingUp', color: '#7AD7C9', type: 'income' },
  { name: 'Regalos', icon: 'Gift', color: '#D960FF', type: 'income' },
  { name: 'Otros', icon: 'MoreHorizontal', color: '#4DD3FF', type: 'income' },
];


export const APP_NAME = "Fintouch";

// Updated to provide symbols for different currencies
export const CURRENCY_SYMBOL = {
  USD: "$",
  EUR: "€",
  ARS: "$", // ARS also uses $
  GBP: "£",
  JPY: "¥"
};
