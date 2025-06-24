import 'package:flutter/material.dart';
import 'models.dart';

// Default categories inspired by the React version.
final List<UserCategory> defaultCategories = [
  // Expenses
  UserCategory(id: 'exp1', name: 'Supermercado', icon: 'shopping_cart', color: '#3A8CFF', type: 'expense'),
  UserCategory(id: 'exp2', name: 'Comida', icon: 'restaurant', color: '#FF7A5A', type: 'expense'),
  UserCategory(id: 'exp3', name: 'Transporte', icon: 'commute', color: '#FFD24C', type: 'expense'),
  UserCategory(id: 'exp4', name: 'Servicios', icon: 'build', color: '#29B6F6', type: 'expense'),
  UserCategory(id: 'exp5', name: 'Mascotas', icon: 'pets', color: '#A6E22E', type: 'expense'),
  UserCategory(id: 'exp6', name: 'Ropa', icon: 'checkroom', color: '#FF66B3', type: 'expense'),
  UserCategory(id: 'exp7', name: 'Salud', icon: 'favorite', color: '#30D98A', type: 'expense'),
  UserCategory(id: 'exp8', name: 'Educación', icon: 'school', color: '#B37FFF', type: 'expense'),
  UserCategory(id: 'exp9', name: 'Regalos', icon: 'card_giftcard', color: '#D960FF', type: 'expense'),
  UserCategory(id: 'exp10', name: 'Viajes', icon: 'flight', color: '#00C8E5', type: 'expense'),
  UserCategory(id: 'exp11', name: 'Entretenimiento', icon: 'wallet', color: '#FF9E40', type: 'expense'),
  UserCategory(id: 'exp12', name: 'Impuestos', icon: 'account_balance', color: '#C7AA6D', type: 'expense'),
  UserCategory(id: 'exp13', name: 'Inversiones', icon: 'trending_up', color: '#6F5CFF', type: 'expense'),
  UserCategory(id: 'exp14', name: 'Otros', icon: 'more_horiz', color: '#FF6E57', type: 'expense'),

  // Income
  UserCategory(id: 'inc1', name: 'Salario', icon: 'work', color: '#30D98A', type: 'income'),
  UserCategory(id: 'inc2', name: 'Inversiones', icon: 'trending_up', color: '#7AD7C9', type: 'income'),
  UserCategory(id: 'inc3', name: 'Regalos', icon: 'card_giftcard', color: '#D960FF', type: 'income'),
  UserCategory(id: 'inc4', name: 'Otros', icon: 'more_horiz', color: '#4DD3FF', type: 'income'),
];

const Map<String, String> currencySymbols = {
  'USD': '\$',
  'EUR': '€',
  'ARS': '\$',
  'GBP': '£',
  'JPY': '¥',
};

Color colorFromHex(String hexColor) {
  final buffer = StringBuffer();
  if (hexColor.length == 6 || hexColor.length == 7) buffer.write('ff');
  buffer.write(hexColor.replaceFirst('#', ''));
  return Color(int.parse(buffer.toString(), radix: 16));
}
