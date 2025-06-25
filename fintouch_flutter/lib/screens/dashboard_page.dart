import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_state.dart';
import '../icon_map.dart';
import '../widgets/transaction_form.dart';
import '../constants.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    final state = Provider.of<AppState>(context);
    final transactions = state.transactions;
    final incomeTotal = transactions
        .where((t) => t.type == 'income')
        .fold<double>(0, (p, t) => p + t.amount);
    final expenseTotal = transactions
        .where((t) => t.type == 'expense')
        .fold<double>(0, (p, t) => p + t.amount);
    final balance = incomeTotal - expenseTotal;

    Widget buildSummaryRow(String label, double value) {
      return Column(
        children: [
          Text(label,
              style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 4),
          Text(
            '${currencySymbols['USD']}${value.toStringAsFixed(0)}',
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ],
      );
    }

    Widget buildCategoryList(String type) {
      final data = transactions.where((t) => t.type == type).toList();
      final total = data.fold<double>(0, (p, t) => p + t.amount);
      final Map<String, double> totals = {};
      for (var t in data) {
        totals[t.category] = (totals[t.category] ?? 0) + t.amount;
      }
      final categories = state.categories;
      final items = totals.entries.map((e) {
        final cat = categories.firstWhere((c) => c.name == e.key);
        final percentage = total > 0 ? (e.value / total) * 100 : 0;
        return ListTile(
          leading: CircleAvatar(
            backgroundColor: colorFromHex(cat.color),
            child: Icon(iconFromString(cat.icon), color: Colors.white),
          ),
          title: Text(cat.name),
          subtitle: Text('${percentage.toStringAsFixed(0)}%'),
          trailing: Text(
              '${currencySymbols['USD']}${e.value.toStringAsFixed(0)}'),
        );
      }).toList();
      if (items.isEmpty) {
        return const Padding(
          padding: EdgeInsets.all(16),
          child: Text('No hay datos.'),
        );
      }
      return Column(children: items);
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Fintouch')),
      body: Column(
        children: [
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              buildSummaryRow('Ingresos', incomeTotal),
              buildSummaryRow('Gastos', expenseTotal),
              buildSummaryRow('Balance', balance),
            ],
          ),
          const SizedBox(height: 16),
          TabBar(
            controller: _tabController,
            tabs: const [
              Tab(text: 'Gastos'),
              Tab(text: 'Ingresos'),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                SingleChildScrollView(child: buildCategoryList('expense')),
                SingleChildScrollView(child: buildCategoryList('income')),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => showDialog(
          context: context,
          builder: (_) => AlertDialog(
            content: TransactionForm(
              onClose: () => Navigator.of(context).pop(),
            ),
          ),
        ),
        child: const Icon(Icons.add),
      ),
    );
  }
}
