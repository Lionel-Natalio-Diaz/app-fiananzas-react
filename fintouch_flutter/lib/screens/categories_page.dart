import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_state.dart';
import '../icon_map.dart';
import '../constants.dart';

class CategoriesPage extends StatefulWidget {
  const CategoriesPage({super.key});

  @override
  State<CategoriesPage> createState() => _CategoriesPageState();
}

class _CategoriesPageState extends State<CategoriesPage>
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
    final expenseCats =
        state.categories.where((c) => c.type == 'expense').toList();
    final incomeCats =
        state.categories.where((c) => c.type == 'income').toList();

    Widget buildGrid(List<UserCategory> cats) {
      return GridView.count(
        crossAxisCount: 3,
        childAspectRatio: 1,
        padding: const EdgeInsets.all(16),
        children: cats
            .map((c) => Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircleAvatar(
                      backgroundColor: colorFromHex(c.color),
                      child: Icon(iconFromString(c.icon), color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      c.name,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall,
                    )
                  ],
                ))
            .toList(),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Categorías')),
      body: Column(
        children: [
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
                buildGrid(expenseCats),
                buildGrid(incomeCats),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
