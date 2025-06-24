
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as Icons from 'lucide-react';
import { useAppContext } from "@/contexts/AppContext";
import type { RecurringTransaction } from "@/lib/types";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import React, { useMemo, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wand2, ChevronDown, MoreHorizontal, Shapes } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { getAutomatedCategoryAction } from "@/lib/actions";

const formSchema = z.object({
  description: z.string().min(2, { message: "La descripción debe tener al menos 2 caracteres." }),
  amount: z.coerce.number({invalid_type_error: "El monto es requerido."}).positive({ message: "El monto debe ser un número positivo." }),
  type: z.enum(["income", "expense"], { required_error: "El tipo es requerido." }),
  recurrence: z.enum(['weekly', 'monthly', 'yearly'], { required_error: "La recurrencia es requerida." }),
  currency: z.string({ required_error: "La moneda es requerida." }),
  category: z.string({ required_error: "La categoría es requerida." }),
});

export type RecurringTransactionFormValues = z.infer<typeof formSchema>;

interface RecurringTransactionFormProps {
  initialData?: RecurringTransaction;
  onSave: (data: RecurringTransactionFormValues) => void;
  onCancel: () => void;
}

export function RecurringTransactionForm({ initialData, onSave, onCancel }: RecurringTransactionFormProps) {
  const { state } = useAppContext();
  const { categories, userProfile } = state;
  const { toast } = useToast();

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);
  const [categoryWasSuggested, setCategoryWasSuggested] = useState(false);

  const form = useForm<RecurringTransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: initialData?.description || '',
      amount: initialData?.amount || undefined,
      type: initialData?.type || 'expense',
      recurrence: initialData?.recurrence || 'monthly',
      currency: initialData?.currency || userProfile?.currency || 'USD',
      category: initialData?.category || '',
    },
  });

  const selectedType = form.watch("type");
  const descriptionValue = form.watch("description");

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => cat.type === selectedType).sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, selectedType]);
  
  useEffect(() => {
    const fetchCategorySuggestion = async () => {
      if (descriptionValue.length >= 3) {
        setIsSuggestingCategory(true);
        try {
          const availableCategories = categories
            .filter(c => c.type === selectedType)
            .map(c => c.name);

          if (availableCategories.length === 0) return;

          const result = await getAutomatedCategoryAction({
            transactionDescription: descriptionValue,
            availableCategories: availableCategories,
          });

          if (result && result.confidence > 0.6 && availableCategories.includes(result.category)) {
            form.setValue('category', result.category, { shouldValidate: true });
            setCategoryWasSuggested(true);
          } else {
            setCategoryWasSuggested(false);
          }
        } catch (error) {
          console.error("Error fetching category suggestion:", error);
          setCategoryWasSuggested(false);
        } finally {
          setIsSuggestingCategory(false);
        }
      }
    };

    const handler = setTimeout(() => {
      if (!initialData?.id) { 
        fetchCategorySuggestion();
      }
    }, 800);

    return () => {
      clearTimeout(handler);
      setIsSuggestingCategory(false);
    };
  }, [descriptionValue, selectedType, categories, form, initialData?.id]);


  useEffect(() => {
    const currentCategoryName = form.getValues('category');
    const isCurrentCategoryValid = filteredCategories.some(c => c.name === currentCategoryName);
    
    if (!isCurrentCategoryValid) {
        form.setValue('category', filteredCategories[0]?.name || '');
    }
  }, [selectedType, filteredCategories, form]);

  function onSubmit(data: RecurringTransactionFormValues) {
    onSave(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-6 pt-2">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Suscripción a Netflix" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex gap-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Monto</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="ej: 15000" 
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => {
                      const valueAsNumber = e.target.valueAsNumber;
                      field.onChange(isNaN(valueAsNumber) ? undefined : valueAsNumber);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-[80px]">
                      <SelectValue placeholder="Moneda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(CURRENCY_SYMBOL).map(([code]) => (
                      <SelectItem key={code} value={code}>{code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="expense">Gasto</SelectItem>
                    <SelectItem value="income">Ingreso</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="recurrence"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Frecuencia</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Frecuencia" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => {
            const selectedCategoryDetails = categories.find(c => c.name === field.value);
            const IconComponent = selectedCategoryDetails ? Icons[selectedCategoryDetails.icon as keyof typeof Icons] || MoreHorizontal : Shapes;

            return (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between h-11 text-base font-normal"
                      disabled={filteredCategories.length === 0}
                    >
                      <div className="flex items-center gap-3">
                        {selectedCategoryDetails ? (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: selectedCategoryDetails.color }}
                          >
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted">
                            <Shapes className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium">{field.value || "Seleccionar Categoría"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSuggestingCategory && <LoadingSpinner size="sm" />}
                        {!isSuggestingCategory && categoryWasSuggested && (
                          <Wand2 className="h-5 w-5 text-primary" />
                        )}
                        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                      </div>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md h-auto p-0">
                    <DialogHeader className="p-4 border-b">
                      <DialogTitle>Seleccionar Categoría</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-72 p-1">
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-3">
                        {filteredCategories.map((category) => {
                          const Icon = Icons[category.icon as keyof typeof Icons] || MoreHorizontal;
                          return (
                            <button
                              type="button"
                              key={category.id}
                              onClick={() => {
                                field.onChange(category.name);
                                setCategoryWasSuggested(false);
                                setIsCategoryModalOpen(false);
                              }}
                              className={cn(
                                "aspect-square flex flex-col items-center justify-center p-2 text-center transition-colors cursor-pointer",
                                "rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-muted/50",
                                field.value === category.name && "ring-2 ring-primary"
                              )}
                            >
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-colors"
                                style={{ backgroundColor: category.color }}
                              >
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <span className="text-xs font-medium text-foreground text-center break-words">{category.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={!form.formState.isValid}>Guardar</Button>
        </div>
      </form>
    </Form>
  );
}
