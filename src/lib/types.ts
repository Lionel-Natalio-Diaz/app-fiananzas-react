import type { IconName } from "./icon-map";

export type TransactionType = 'income' | 'expense';

export interface UserCategory {
  id: string;
  name: string;
  icon: IconName;
  color: string;
  type: TransactionType;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  date: string; // ISO string
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  recurrence: 'once' | 'weekly' | 'monthly' | 'yearly';
  currency: string;
}

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  recurrence: 'weekly' | 'monthly' | 'yearly';
  currency: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly'; 
  spentAmount?: number; 
  remainingAmount?: number; 
  progressPercentage?: number; // Added for BudgetOverview
  transactions?: Transaction[]; // Added for BudgetOverview calculation
}

export interface CategorizationResult {
  category: string; // Changed to string
  confidence: number;
}

export interface ReceiptDetails {
  date: string; 
  merchant: string;
  amount: number;
}

export interface UserProfile {
  name: string;
  language: string; // e.g., "es", "en"
  currency: string; // e.g., "USD", "EUR", "ARS"
}
