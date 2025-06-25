import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models.dart';
import '../providers/app_state.dart';
import '../icon_map.dart';
import '../constants.dart';

class TransactionForm extends StatefulWidget {
  final VoidCallback onClose;
  const TransactionForm({super.key, required this.onClose});

  @override
  State<TransactionForm> createState() => _TransactionFormState();
}

class _TransactionFormState extends State<TransactionForm> {
  final _formKey = GlobalKey<FormState>();

  String description = '';
  double amount = 0;
  DateTime date = DateTime.now();
  String type = 'expense';
  UserCategory? category;

  @override
  Widget build(BuildContext context) {
    final state = Provider.of<AppState>(context);
    final List<UserCategory> categories =
        state.categories.where((c) => c.type == type).toList();
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                decoration: const InputDecoration(labelText: 'Descripción'),
                onChanged: (v) => description = v,
                validator: (v) => v == null || v.isEmpty ? 'Requerido' : null,
              ),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Monto'),
                keyboardType: TextInputType.number,
                onChanged: (v) => amount = double.tryParse(v) ?? 0,
                validator: (v) => v == null || double.tryParse(v) == null
                    ? 'Ingrese un número'
                    : null,
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: type,
                      decoration: const InputDecoration(labelText: 'Tipo'),
                      items: const [
                        DropdownMenuItem(value: 'expense', child: Text('Gasto')),
                        DropdownMenuItem(value: 'income', child: Text('Ingreso')),
                      ],
                      onChanged: (v) {
                        if (v != null) setState(() => type = v);
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: DropdownButtonFormField<UserCategory>(
                      value: category,
                      decoration: const InputDecoration(labelText: 'Categoría'),
                      items: categories
                          .map((c) => DropdownMenuItem(
                                value: c,
                                child: Text(c.name),
                              ))
                          .toList(),
                      onChanged: (v) => setState(() => category = v),
                      validator: (v) => v == null ? 'Seleccione una' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      decoration: const InputDecoration(labelText: 'Fecha'),
                      readOnly: true,
                      controller: TextEditingController(
                          text: '${date.year}-${date.month}-${date.day}'),
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: date,
                          firstDate: DateTime(2000),
                          lastDate: DateTime(2100),
                        );
                        if (picked != null) {
                          setState(() => date = picked);
                        }
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: widget.onClose,
                    child: const Text('Cancelar'),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: () {
                      if (!_formKey.currentState!.validate()) return;
                      final newTransaction = Transaction(
                        id: DateTime.now().millisecondsSinceEpoch.toString(),
                        date: date.toIso8601String(),
                        description: description,
                        amount: amount,
                        type: type,
                        category: category!.name,
                        recurrence: 'once',
                        currency: 'USD',
                      );
                      state.addTransaction(newTransaction);
                      widget.onClose();
                    },
                    child: const Text('Guardar'),
                  ),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }
}
