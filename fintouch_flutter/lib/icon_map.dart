import 'package:flutter/material.dart';

IconData iconFromString(String name) {
  switch (name) {
    case 'shopping_cart':
      return Icons.shopping_cart;
    case 'restaurant':
      return Icons.restaurant;
    case 'commute':
      return Icons.commute;
    case 'build':
      return Icons.build;
    case 'pets':
      return Icons.pets;
    case 'checkroom':
      return Icons.checkroom;
    case 'favorite':
      return Icons.favorite;
    case 'school':
      return Icons.school;
    case 'card_giftcard':
      return Icons.card_giftcard;
    case 'flight':
      return Icons.flight;
    case 'wallet':
      return Icons.account_balance_wallet;
    case 'account_balance':
      return Icons.account_balance;
    case 'trending_up':
      return Icons.trending_up;
    case 'more_horiz':
      return Icons.more_horiz;
    case 'work':
      return Icons.work;
    default:
      return Icons.category;
  }
}
