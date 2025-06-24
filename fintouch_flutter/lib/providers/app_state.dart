import 'package:flutter/foundation.dart';

import '../models.dart';
import '../constants.dart';

class AppState extends ChangeNotifier {
  String userId = '';

  List<UserCategory> categories = List.from(defaultCategories);
  List<Transaction> transactions = [];

  void setUser(String id) {
    userId = id;
    notifyListeners();
  }

  void addTransaction(Transaction transaction) {
    transactions.add(transaction);
    notifyListeners();
  }
}
