import 'package:flutter/foundation.dart';

class AppState extends ChangeNotifier {
  String userId = '';

  void setUser(String id) {
    userId = id;
    notifyListeners();
  }
}
