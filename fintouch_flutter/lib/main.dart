import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';

import 'providers/app_state.dart';
import 'theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(const FintouchApp());
}

class FintouchApp extends StatelessWidget {
  const FintouchApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppState(),
      child: MaterialApp(
        title: 'Fintouch',
        theme: AppTheme.themeData,
        home: const HomePage(),
      ),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final state = Provider.of<AppState>(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Fintouch')),
      backgroundColor: AppTheme.backgroundColor,
      body: Center(
        child: ElevatedButton(
          onPressed: () => state.setUser('demo'),
          child: Text(
            state.userId.isEmpty
                ? 'Login (mock)'
                : 'Logged in as ${state.userId}',
          ),
        ),
      ),
    );
  }
}
