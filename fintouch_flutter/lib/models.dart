class UserCategory {
  final String id;
  final String name;
  final String icon;
  final String color;
  final String type;
  final bool? isDefault;

  UserCategory({
    required this.id,
    required this.name,
    required this.icon,
    required this.color,
    required this.type,
    this.isDefault,
  });
}

class Transaction {
  final String id;
  final String date;
  final String description;
  final double amount;
  final String type;
  final String category;
  final String recurrence;
  final String currency;

  Transaction({
    required this.id,
    required this.date,
    required this.description,
    required this.amount,
    required this.type,
    required this.category,
    required this.recurrence,
    required this.currency,
  });
}

class RecurringTransaction {
  final String id;
  final String description;
  final double amount;
  final String type;
  final String category;
  final String recurrence;
  final String currency;

  RecurringTransaction({
    required this.id,
    required this.description,
    required this.amount,
    required this.type,
    required this.category,
    required this.recurrence,
    required this.currency,
  });
}

class Budget {
  final String id;
  final String category;
  final double amount;
  final String period;
  double? spentAmount;
  double? remainingAmount;
  double? progressPercentage;

  Budget({
    required this.id,
    required this.category,
    required this.amount,
    required this.period,
    this.spentAmount,
    this.remainingAmount,
    this.progressPercentage,
  });
}

class CategorizationResult {
  final String category;
  final double confidence;

  CategorizationResult({required this.category, required this.confidence});
}

class ReceiptDetails {
  final String date;
  final String merchant;
  final double amount;

  ReceiptDetails({required this.date, required this.merchant, required this.amount});
}

class UserProfile {
  final String name;
  final String language;
  final String currency;

  UserProfile({required this.name, required this.language, required this.currency});
}
