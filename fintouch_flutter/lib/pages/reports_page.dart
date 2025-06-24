import 'package:flutter/material.dart';
import '../theme.dart';

class ReportsPage extends StatelessWidget {
  const ReportsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Informes')),
      backgroundColor: AppTheme.backgroundColor,
      body: const Center(
        child: Text('Sección de informes en construcción'),
      ),
    );
  }
}
