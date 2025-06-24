import 'package:cloud_firestore/cloud_firestore.dart';

import '../models.dart';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  CollectionReference<Map<String, dynamic>> _userCollection(String uid, String path) {
    return _db.collection('users').doc(uid).collection(path);
  }

  // User profile
  Future<void> setUserProfile(String uid, UserProfile profile) {
    return _db.collection('users').doc(uid).set({
      'name': profile.name,
      'language': profile.language,
      'currency': profile.currency,
    }, SetOptions(merge: true));
  }

  Stream<UserProfile?> watchUserProfile(String uid) {
    return _db.collection('users').doc(uid).snapshots().map((doc) {
      if (!doc.exists) return null;
      final data = doc.data()!;
      return UserProfile(
        name: data['name'] ?? '',
        language: data['language'] ?? 'en',
        currency: data['currency'] ?? 'USD',
      );
    });
  }

  // Transactions
  Stream<List<Transaction>> watchTransactions(String uid) {
    return _userCollection(uid, 'transactions').snapshots().map((snapshot) {
      return snapshot.docs.map((d) {
        final data = d.data();
        return Transaction(
          id: d.id,
          date: data['date'] ?? '',
          description: data['description'] ?? '',
          amount: (data['amount'] ?? 0).toDouble(),
          type: data['type'] == 'income' ? TransactionType.income : TransactionType.expense,
          category: data['category'] ?? '',
          recurrence: data['recurrence'] ?? 'once',
          currency: data['currency'] ?? 'USD',
        );
      }).toList();
    });
  }

  Future<void> addTransaction(String uid, Transaction tx) {
    return _userCollection(uid, 'transactions').doc(tx.id).set({
      'date': tx.date,
      'description': tx.description,
      'amount': tx.amount,
      'type': tx.type.name,
      'category': tx.category,
      'recurrence': tx.recurrence,
      'currency': tx.currency,
    });
  }

  Future<void> deleteTransaction(String uid, String id) {
    return _userCollection(uid, 'transactions').doc(id).delete();
  }
}
