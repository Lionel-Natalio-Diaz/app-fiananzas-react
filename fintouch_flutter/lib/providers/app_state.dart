import 'package:flutter/foundation.dart';

import '../models.dart';
import '../constants.dart';
import '../services/auth_service.dart';

class AppState extends ChangeNotifier {
  final AuthService _authService = AuthService();

  String userId = '';
  bool onboardingComplete = false;
  UserProfile? profile;

  Future<void> signIn() async {
    final cred = await _authService.signInAnonymously();
    userId = cred.user?.uid ?? '';
    notifyListeners();
  }

  Future<void> signOut() async {
    await _authService.signOut();
    userId = '';
    onboardingComplete = false;
    profile = null;
    notifyListeners();
  }

  List<UserCategory> categories = List.from(defaultCategories);
  List<Transaction> transactions = [];

  void setUser(String id) {
    userId = id;
  void completeOnboarding({required String name, required String language, required String currency}) {
    profile = UserProfile(name: name, language: language, currency: currency);
    onboardingComplete = true;
    notifyListeners();
  }

  void addTransaction(Transaction transaction) {
    transactions.add(transaction);
    notifyListeners();
  }
}
