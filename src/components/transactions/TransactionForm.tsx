
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, ChevronDown, Check, Wand2, Shapes, MoreHorizontal } from "lucide-react";
import * as Icons from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { useAppContext } from "@/contexts/AppContext";
import type { Transaction, UserCategory } from "@/lib/types";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import React, { useState, useEffect, useMemo } from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAutomatedCategoryAction } from "@/lib/actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const formSchema = z.object({
  description: z.string().min(2, {
    message: "La descripción debe tener al menos 2 caracteres.",
  }).max(100, {
    message: "La descripción no debe exceder los 100 caracteres."
  }),
  amount: z.coerce.number({invalid_type_error: "El monto es requerido."}).positive({
    message: "El monto debe ser un número positivo.",
  }),
  date: z.date({
    required_error: "La fecha es requerida.",
  }),
  type: z.enum(["income", "expense"], {
    required_error: "El tipo de transacción es requerido.",
  }),
  recurrence: z.enum(['once', 'weekly', 'monthly', 'yearly'], {
    required_error: "La recurrencia es requerida."
  }),
  currency: z.string({
    required_error: "La moneda es requerida."
  }),
  category: z.string({
    required_error: "La categoría es requerida.",
  }),
});

export type TransactionFormValues = z.infer<typeof formSchema>;

interface TransactionFormProps {
  initialData?: Partial<TransactionFormValues & { id?: string }>;
  onSave?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

const getFormValues = (data?: Partial<TransactionFormValues & {id?: string}>, defaultCurrency?: string, categories?: UserCategory[]): TransactionFormValues => {
    let dateValue: Date;
    if (data?.date) {
        if (data.date instanceof Date && !isNaN(data.date.getTime())) {
            dateValue = data.date;
        } else if (typeof data.date === 'string') {
            const parsedDate = new Date(data.date);
            dateValue = !isNaN(parsedDate.getTime()) ? parsedDate : new Date();
        } else {
            dateValue = new Date();
        }
    } else {
        dateValue = new Date();
    }
    
    const type = data?.type || 'expense';
    const defaultCategory = categories?.find(c => c.type === type)?.name || 'Otros';

    return {
        description: data?.description || '',
        amount: data?.amount || 0,
        date: dateValue,
        type: type,
        recurrence: (data as Transaction)?.recurrence || 'once',
        currency: (data as Transaction)?.currency || defaultCurrency || 'USD',
        category: data?.category || defaultCategory,
    };
};

export function TransactionForm({ initialData, onSave, onCancel, onDelete }: TransactionFormProps) {
  const { state, dispatch, addTransaction, updateTransaction, addRecurringTransaction } = useAppContext();
  const { categories } = state;
  const { toast } = useToast();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);
  const [categoryWasSuggested, setCategoryWasSuggested] = useState(false);
  
  const userCurrency = state.userProfile?.currency || "USD";

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getFormValues(initialData, userCurrency, categories),
    mode: 'onChange',
  });

  const selectedType = form.watch("type");
  const descriptionValue = form.watch("description");

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => cat.type === selectedType);
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
      if (!initialData?.id) { // Don't suggest if user is editing an existing transaction
        fetchCategorySuggestion();
      }
    }, 800); // Debounce for 800ms

    return () => {
      clearTimeout(handler);
      setIsSuggestingCategory(false);
    };
  }, [descriptionValue, selectedType, categories, form, initialData?.id]);


  useEffect(() => {
    // When type changes, if the current category is not valid for the new type, reset it.
    const currentCategoryName = form.getValues('category');
    const isCurrentCategoryValid = filteredCategories.some(c => c.name === currentCategoryName);
    
    if (!isCurrentCategoryValid) {
        form.setValue('category', filteredCategories[0]?.name || '');
    }
  }, [selectedType, filteredCategories, form]);

  async function onSubmit(data: TransactionFormValues) {
    if (!state.user) {
      toast({ title: "Error", description: "Debes iniciar sesión para registrar una transacción.", variant: "destructive" });
      return;
    }
    
    try {
      if (initialData?.id) {
        const transactionToUpdate: Transaction = {
          id: initialData.id,
          date: data.date.toISOString(),
          amount: data.amount,
          type: data.type,
          category: data.category,
          description: data.description,
          recurrence: data.recurrence,
          currency: data.currency
        };
        await updateTransaction(transactionToUpdate);
        dispatch({ type: 'SHOW_SUCCESS_MESSAGE', payload: `"${data.description}" ha sido actualizada.` });
      } else {
        const transactionToAdd = {
          date: data.date,
          amount: data.amount,
          type: data.type,
          category: data.category,
          description: data.description,
          recurrence: data.recurrence,
          currency: data.currency
        };
        await addTransaction(transactionToAdd);

        if (data.recurrence !== 'once') {
            await addRecurringTransaction({
                description: data.description,
                amount: data.amount,
                type: data.type,
                category: data.category,
                recurrence: data.recurrence as 'weekly' | 'monthly' | 'yearly',
                currency: data.currency,
            });
        }
        dispatch({ type: 'SHOW_SUCCESS_MESSAGE', payload: `"${data.description}" ha sido registrada.` });
      }

      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast({ title: "Error", description: "No se pudo guardar la transacción.", variant: "destructive" });
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-grow min-h-0 overflow-y-auto p-4 flex flex-col justify-evenly">
          {/* Top row controls */}
          <div className="flex items-start gap-2">
          <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
              <FormItem className="flex-1">
                  <Popover>
                  <PopoverTrigger asChild>
                      <FormControl>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal text-sm h-11", !field.value && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "dd/MM/yyyy") : <span>Elige fecha</span>}
                      </Button>
                      </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus locale={es} />
                  </PopoverContent>
                  </Popover>
                  <FormMessage />
              </FormItem>
              )}
          />
          <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
              <FormItem className="w-[100px]">
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                      <SelectTrigger className="text-sm h-11"><SelectValue placeholder="Tipo" /></SelectTrigger>
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
              <FormItem className="w-[120px]">
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                      <SelectTrigger className="text-sm h-11"><SelectValue placeholder="Recurrencia" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                      <SelectItem value="once">Una vez</SelectItem>
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

          {/* Description Input */}
          <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
              <FormItem>
              <FormControl>
                  <Input 
                  placeholder="Título" 
                  {...field}
                  value={field.value || ''}
                  className="text-base md:text-lg h-auto border-0 border-b-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-2" />
              </FormControl>
              <FormMessage />
              </FormItem>
          )}
          />
          
          {/* Amount Input */}
          <div className="flex items-center gap-4">
              <span className={cn("text-2xl md:text-3xl font-bold", selectedType === 'expense' ? 'text-destructive' : 'text-accent')}>
                  {selectedType === 'expense' ? '-' : '+'}
              </span>
              <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                  <FormItem className="flex-grow">
                  <FormControl>
                      <Input 
                      type="number" 
                      placeholder="0" 
                      {...field}
                      value={field.value || ''}
                      onChange={e => {
                          const valueAsNumber = e.target.valueAsNumber;
                          field.onChange(isNaN(valueAsNumber) ? undefined : valueAsNumber);
                      }}
                      className={cn(
                          "text-2xl md:text-3xl font-bold h-auto border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0",
                          selectedType === 'expense' ? 'text-destructive' : 'text-accent',
                          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      )}
                      />
                  </FormControl>
                  <FormMessage className="absolute"/>
                  </FormItem>
              )}
              />
              <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                  <FormItem>
                      <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                              <SelectTrigger className="w-[80px] h-11 text-base">
                                  <SelectValue placeholder="Moneda"/>
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

          {/* Category Selector */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => {
              const selectedCategoryDetails = categories.find(c => c.name === field.value);
              const IconComponent = selectedCategoryDetails ? Icons[selectedCategoryDetails.icon as keyof typeof Icons] || Icons.Shapes : Icons.Shapes;

              return (
                <FormItem>
                  <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between h-14 text-base"
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
                              <Icons.Shapes className="h-5 w-5 text-muted-foreground" />
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
                            const Icon = Icons[category.icon as keyof typeof Icons] || Icons.MoreHorizontal;
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
        </div>
        
        <div className="flex justify-between items-center gap-2 p-4 border-t shrink-0">
          <div>
            {initialData?.id && onDelete && (
              <Button type="button" variant="destructive" size="icon" onClick={onDelete}>
                <Icons.Trash2 className="h-4 w-4" />
                <span className="sr-only">Eliminar</span>
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>}
            <Button type="submit" className="h-11" disabled={!form.formState.isValid || form.formState.isSubmitting}>
              {form.formState.isSubmitting && <LoadingSpinner size="sm" className="mr-2"/>}
              {initialData?.id ? 'Actualizar' : 'Registrar'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
