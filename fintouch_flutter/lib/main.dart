import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';

import 'providers/app_state.dart';
import 'screens/login_screen.dart';
import 'screens/onboarding_screen.dart';
import 'theme.dart';
import 'pages/budgets_page.dart';
import 'pages/reports_page.dart';
import 'services/audio_service.dart';
import 'services/ocr_service.dart';

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
        home: const RootNavigator(),
      ),
    );
  }
}

class RootNavigator extends StatelessWidget {
  const RootNavigator({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, state, _) {
        if (state.userId.isEmpty) {
          return const LoginScreen();
        }
        if (!state.onboardingComplete) {
          return const OnboardingScreen();
        }
        return const HomePage();
      },
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final state = Provider.of<AppState>(context);
    final audioService = AudioService();
    final ocrService = OcrService();

    if (state.userId.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Fintouch')),
        backgroundColor: AppTheme.backgroundColor,
        body: Center(
          child: ElevatedButton(
            onPressed: () => state.setUser('demo'),
            child: const Text('Login (mock)'),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Fintouch')),
      backgroundColor: AppTheme.backgroundColor,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ElevatedButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const BudgetsPage()),
              ),
              child: const Text('Presupuestos'),
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const ReportsPage()),
              ),
              child: const Text('Informes'),
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: () async {
                final text = await audioService.recordAndTranscribe();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(text ?? 'Sin texto')),
                  );
                }
              },
              child: const Text('Grabar Audio'),
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: () async {
                final text = await ocrService.pickAndExtractText();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(text ?? 'Sin texto')),
                  );
                }
              },
              child: const Text('Escanear Recibo'),

            ),
          ],
        ),
      ),
    );
  }
}
