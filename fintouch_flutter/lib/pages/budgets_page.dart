import 'package:flutter/material.dart';
import '../theme.dart';

class BudgetsPage extends StatelessWidget {
  const BudgetsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Presupuestos')),
      backgroundColor: AppTheme.backgroundColor,
      body: const Center(
        child: Text('Sección de presupuestos en construcción'),
      ),
    );
  }
}
