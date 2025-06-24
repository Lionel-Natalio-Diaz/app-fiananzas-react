
"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import type { Transaction, TransactionType, UserCategory } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Mic, Edit3, PiggyBank, MoreHorizontal, Menu, LayoutGrid, X, History, PieChart, Bot, Target, Repeat } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import type { TransactionFormValues } from '@/components/transactions/TransactionForm';
import { AudioTransactionModal } from '@/components/shared/AudioTransactionModal';
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { cn } from '@/lib/utils';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAutomatedCategoryAction } from '@/lib/actions';
import { extractTransactionFromAudio } from '@/ai/flows/extract-transaction-from-audio';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--primary))", "hsl(var(--accent))"];

const formatCurrency = (amount: number, currency: string) => {
  return `${currency}${Math.trunc(amount).toLocaleString('es-ES')}`;
};

type PeriodOption = "day" | "week" | "month" | "year" ; 

const getPeriodDateRangeText = (period: PeriodOption, date: Date = new Date()): string => {
  switch (period) {
    case 'day':
      return format(date, "d MMM yyyy", { locale: es });
    case 'week':
      const sow = startOfWeek(date, { weekStartsOn: 1, locale: es });
      const eow = endOfWeek(date, { weekStartsOn: 1, locale: es });
      return `${format(sow, "d MMM", { locale: es })} - ${format(eow, "d MMM yyyy", { locale: es })}`;
    case 'month':
      return format(date, "MMMM yyyy", { locale: es });
    case 'year':
      return format(date, "yyyy", { locale: es });
    default:
      return "";
  }
};


export default function DashboardPage() {
  const { state, addTransaction, dispatch } = useAppContext();
  const { transactions, userProfile, categories } = state;
  const currency = userProfile?.currency ? CURRENCY_SYMBOL[userProfile.currency as keyof typeof CURRENCY_SYMBOL] || CURRENCY_SYMBOL.USD : CURRENCY_SYMBOL.USD;
  
  const [isClient, setIsClient] = useState(false);
  const [activeView, setActiveView] = useState<TransactionType>('expense');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('month');
  const [currentDateForFilters, setCurrentDateForFilters] = useState(new Date()); 
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [isManualTransactionModalOpen, setIsManualTransactionModalOpen] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isSendingAudio, setIsSendingAudio] = useState(false);
  const [audioModalInitialData, setAudioModalInitialData] = useState<Partial<TransactionFormValues> | null>(null);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [audioFormKey, setAudioFormKey] = useState(0);

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const wasCancelledRef = useRef(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const categoryMap = useMemo(() => {
    return new Map(categories.map(cat => [cat.name, cat]));
  }, [categories]);

  const financialSummary = useMemo(() => {
    const totalIncome = transactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum, 0);
    const totalExpenses = transactions.reduce((sum, t) => t.type === 'expense' ? sum + t.amount : sum, 0);
    const currentBalance = totalIncome - totalExpenses;
    return { totalIncome, totalExpenses, currentBalance };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const targetDate = currentDateForFilters;
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      if (selectedPeriod === 'month') {
        return tDate.getMonth() === targetDate.getMonth() && tDate.getFullYear() === targetDate.getFullYear();
      }
      if (selectedPeriod === 'year') {
        return tDate.getFullYear() === targetDate.getFullYear();
      }
      if (selectedPeriod === 'day') {
        return tDate.getDate() === targetDate.getDate() && tDate.getMonth() === targetDate.getMonth() && tDate.getFullYear() === targetDate.getFullYear();
      }
      if (selectedPeriod === 'week') {
        const start = startOfWeek(targetDate, { weekStartsOn: 1 });
        const end = endOfWeek(targetDate, { weekStartsOn: 1 });
        return tDate >= start && tDate <= end;
      }
      return true;
    });
  }, [transactions, selectedPeriod, currentDateForFilters]);

  const dataForView = useMemo(() => {
    return filteredTransactions.filter(t => t.type === activeView);
  }, [filteredTransactions, activeView]);

  const totalForView = useMemo(() => {
    return dataForView.reduce((sum, t) => sum + t.amount, 0);
  }, [dataForView]);

  const categorySummary = useMemo(() => {
    const summaryMap = new Map<string, { value: number; count: number }>();
    dataForView.forEach(t => {
      const existing = summaryMap.get(t.category);
      if (existing) {
        existing.value += t.amount;
        existing.count += 1;
      } else {
        summaryMap.set(t.category, { value: t.amount, count: 1 });
      }
    });

    const summary = Array.from(summaryMap.entries()).map(([name, { value }]) => {
        const categoryInfo = categoryMap.get(name);
        return {
            name,
            value,
            color: categoryInfo?.color || CHART_COLORS[0],
            icon: categoryInfo?.icon || 'MoreHorizontal'
        };
    });

    const sortedSummary = summary.sort((a, b) => b.value - a.value);
    return sortedSummary.map(s => ({
      ...s,
      percentage: totalForView > 0 ? (s.value / totalForView) * 100 : 0,
    }));
  }, [dataForView, totalForView, categoryMap]);

  const chartConfig = useMemo(() => {
    return categorySummary.reduce((acc, item) => {
      acc[item.name] = { label: item.name, color: item.color };
      return acc;
    }, {} as any);
  }, [categorySummary]);

  const getDynamicFontSize = (value: number) => {
    const valueString = String(Math.trunc(value));
    if (valueString.length > 8) return 'text-xl'; // for 9+ digits
    if (valueString.length > 6) return 'text-2xl'; // for 7-8 digits
    return 'text-3xl'; // for 1-6 digits
  };

  const handleStartRecording = async () => {
    wasCancelledRef.current = false;
    setIsFabMenuOpen(false);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.onstop = () => {
        if (wasCancelledRef.current) {
          mediaStreamRef.current?.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
          return;
        }
        const completeAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        processAudioWithGenkit(completeAudioBlob);
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({ title: "Error de Micrófono", description: "No se pudo acceder al micrófono.", variant: "destructive" });
    }
  };


  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      wasCancelledRef.current = true;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: "Grabación cancelada", duration: 2000 });
    }
  };
  
  const processAudioWithGenkit = async (blob: Blob) => {
    if (!blob || blob.size === 0) {
      toast({ title: "Error", description: "No hay audio grabado para enviar.", variant: "destructive" });
      return;
    }
    setIsSendingAudio(true);

    const reader = new FileReader();
    reader.readAsDataURL(blob);

    reader.onloadend = async () => {
      try {
        const audioDataUri = reader.result as string;
        
        const allUserCategories = categories.map(c => c.name);
        const userCurrency = userProfile?.currency || 'USD';
        const currentDate = format(new Date(), 'yyyy-MM-dd');
        
        const result = await extractTransactionFromAudio({
          audioDataUri,
          availableCategories: allUserCategories,
          userCurrency: userCurrency,
          currentDate: currentDate
        });
        
        if (!result || !result.description || result.amount <= 0) {
          throw new Error("No se pudo extraer una transacción válida del audio.");
        }
        
        const transactionDate = new Date(`${result.date}T12:00:00`);

        setAudioModalInitialData({
            amount: Math.trunc(result.amount),
            date: transactionDate,
            category: result.category,
            type: result.type,
            description: result.description,
            currency: result.currency,
            recurrence: result.recurrence,
        });

        setAudioFormKey(prev => prev + 1);
        setIsAudioModalOpen(true);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido.";
        toast({ title: "Error de Procesamiento", description: `No se pudo procesar el audio: ${errorMessage}`, variant: "destructive" });
      } finally {
        setIsSendingAudio(false);
      }
    };
    
    reader.onerror = () => {
      toast({ title: "Error de Lectura", description: "No se pudo leer el archivo de audio.", variant: "destructive" });
      setIsSendingAudio(false);
    };
  };

  const handleAudioModalClose = () => {
    setIsAudioModalOpen(false);
    setAudioModalInitialData(null);
  };

  const handleAudioTransactionSaved = () => {
    setIsAudioModalOpen(false);
    setAudioModalInitialData(null);
  };

  const openManualTransactionModal = () => {
    setIsFabMenuOpen(false);
    setIsManualTransactionModalOpen(true);
  };


  const BottomNavBar = () => {
    return (
        <footer className="fixed bottom-0 left-0 right-0 h-24 z-50">
            <svg
                viewBox="0 0 375 80"
                preserveAspectRatio="none"
                className="absolute bottom-0 w-full h-24 drop-shadow-[0_-4px_8px_rgba(0,0,0,0.05)]"
                fill="hsl(var(--surface))"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M0 80 H375 V20 C300 20 280 0 187.5 0 C95 0 75 20 0 20 Z" />
            </svg>
            
            <div className="relative h-full flex items-center justify-between px-6 z-50">
                 <div className="flex-1 flex justify-around">
                    <SheetTrigger asChild>
                        <button className="p-2 text-muted-foreground hover:text-primary transition-transform translate-y-2" aria-label="Abrir menú">
                            <Menu size={28} />
                        </button>
                    </SheetTrigger>
                    <Link href="/history" className="p-2 text-muted-foreground hover:text-primary transition-transform -translate-y-2" aria-label="Historial">
                        <History size={28} />
                    </Link>
                 </div>
                 <div className="w-20" /> 
                 <div className="flex-1 flex justify-around">
                     <Link href="/reports" className="p-2 text-muted-foreground hover:text-primary transition-transform -translate-y-2" aria-label="Análisis">
                        <PieChart size={28} />
                     </Link>
                     <button className="p-2 text-muted-foreground hover:text-primary transition-transform translate-y-2" onClick={() => alert('Chatbot de finanzas (próximamente)')} aria-label="Asistente IA">
                        <Bot size={28} />
                     </button>
                 </div>
            </div>

            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 z-[51]">
              {isRecording ? (
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -left-[96px] h-16 w-16 rounded-full shadow-lg"
                    onClick={handleCancelRecording}
                    aria-label="Cancelar grabación"
                  >
                    <X size={28} />
                  </Button>

                  <div className="relative h-20 w-20">
                    <span className="absolute inset-0 animate-ripple rounded-full bg-primary/75"></span>
                    <span className="absolute inset-0 animate-ripple rounded-full bg-primary/75 [animation-delay:0.75s]"></span>
                    <Button
                      size="icon"
                      className="relative z-10 h-20 w-20 rounded-full bg-primary shadow-xl"
                      onClick={handleStopRecording}
                      aria-label="Detener grabación"
                    >
                      <Mic size={32} />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative flex h-16 w-16 items-center justify-center">
                    <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                            "absolute rounded-full w-14 h-14 bg-background shadow-lg transition-all duration-300 ease-in-out",
                            isFabMenuOpen
                                ? "transform -translate-x-16 -translate-y-8 scale-100 opacity-100"
                                : "transform translate-y-0 scale-75 opacity-0 pointer-events-none"
                        )}
                        onClick={() => { handleStartRecording(); setIsFabMenuOpen(false); }}
                        disabled={isSendingAudio}
                        aria-label="Grabar audio"
                        style={{ transitionDelay: isFabMenuOpen ? '0.1s' : '0.2s' }}
                    >
                        {isSendingAudio ? <LoadingSpinner size="sm"/> : <Mic size={24}/>}
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                            "absolute rounded-full w-14 h-14 bg-background shadow-lg transition-all duration-300 ease-in-out",
                            isFabMenuOpen
                                ? "transform translate-x-16 -translate-y-8 scale-100 opacity-100"
                                : "transform translate-y-0 scale-75 opacity-0 pointer-events-none"
                        )}
                        onClick={() => { openManualTransactionModal(); setIsFabMenuOpen(false); }}
                        aria-label="Añadir manualmente"
                        style={{ transitionDelay: isFabMenuOpen ? '0.2s' : '0.1s' }}
                    >
                        <Edit3 size={24}/>
                    </Button>
                    <Button
                        size="icon"
                        className="z-10 h-16 w-16 rounded-full shadow-xl"
                        onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
                        aria-label={isFabMenuOpen ? "Cerrar menú" : "Abrir menú de acciones"}
                    >
                        <Plus size={28} className={cn("transition-transform duration-300", isFabMenuOpen && "rotate-45")} />
                    </Button>
                </div>
              )}
            </div>
        </footer>
    );
  };

  if (!isClient) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <div className="flex flex-col min-h-screen bg-background text-foreground">
        
        {isSendingAudio && (
            <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0">
                <LoadingSpinner size="lg" className="text-primary" />
                <p className="mt-4 text-lg font-medium text-white">Procesando audio...</p>
            </div>
        )}

        {/* Header Section */}
        <div className="bg-surfaceVariant shadow-lg rounded-b-3xl p-4 pb-2 text-center sticky top-0 z-30">
            <p className="text-sm text-muted-foreground uppercase tracking-wider">Balance</p>
            <p className="text-2xl font-bold bg-gradient-to-b from-primary to-primary-light text-transparent bg-clip-text mb-3">{formatCurrency(financialSummary.currentBalance, currency)}</p>
        
            <Tabs value={activeView} onValueChange={(value) => setActiveView(value as TransactionType)} className="w-full">
            <TabsList className="bg-transparent p-0 w-full justify-around">
                <TabsTrigger 
                value="expense" 
                className="pb-2 text-lg font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-transparent border-b-[3px]"
                >
                Gastos
                </TabsTrigger>
                <TabsTrigger 
                value="income" 
                className="pb-2 text-lg font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-transparent border-b-[3px]"
                >
                Ingresos
                </TabsTrigger>
            </TabsList>
            </Tabs>
        </div>

        {/* Content Area */}
        <div className="flex-grow space-y-4 p-4 overflow-y-auto pb-36"> {/* Padding bottom for Nav Bar */}
            <Card className="shadow-lg rounded-xl">
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-around items-center text-sm mb-1">
                {(['day', 'week', 'month', 'year'] as PeriodOption[]).map(period => (
                    <button
                    key={period}
                    onClick={() => {
                        setSelectedPeriod(period);
                        setCurrentDateForFilters(new Date()); 
                    }}
                    className={cn(
                        "px-2 py-1 capitalize rounded-md",
                        selectedPeriod === period 
                        ? "font-semibold text-primary border-b-2 border-primary" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    >
                    {period === 'day' ? 'Día' : period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : 'Año'}
                    </button>
                ))}
                </div>
                <div className="text-center text-xs text-muted-foreground font-medium">
                {getPeriodDateRangeText(selectedPeriod, currentDateForFilters)}
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 aspect-[4/3] sm:aspect-square flex items-center justify-center relative">
                {categorySummary.length > 0 ? (
                <>
                    <ChartContainer config={chartConfig} className="h-full w-full">
                    <RechartsPieChart>
                        <ChartTooltipContent 
                        nameKey="name"
                        formatter={(value, name) => `${formatCurrency(Number(value), currency)} (${Math.trunc(categorySummary.find(c=>c.name === name)?.percentage || 0)}%)`}
                        />
                        <Pie 
                        data={categorySummary} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        innerRadius="60%" 
                        outerRadius="90%"
                        labelLine={false}
                        animationDuration={500}
                        >
                        {categorySummary.map((entry, index) => (
                            <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                            stroke="hsl(var(--card))"
                            strokeWidth={2}
                            />
                        ))}
                        </Pie>
                    </RechartsPieChart>
                    </ChartContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className={cn("font-bold", getDynamicFontSize(totalForView))}>{formatCurrency(totalForView, currency)}</p>
                    </div>
                </>
                ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <PiggyBank className="w-16 h-16 mb-2" />
                    <p>No hay datos de {activeView === 'expense' ? 'gastos' : 'ingresos'}.</p>
                </div>
                )}
            </CardContent>
            </Card>

            <Card className="shadow-none rounded-xl bg-transparent border-none">
                <CardContent className="space-y-3 p-0">
                    {categorySummary.length > 0 ? (
                        categorySummary.map(cat => {
                            const Icon = Icons[cat.icon as keyof typeof Icons] || MoreHorizontal;
                            return (
                                <Link href={`/category/${encodeURIComponent(cat.name)}`} key={cat.name} className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                    <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-surfaceVariant shadow-sm border cursor-pointer hover:bg-muted/50 transition-colors duration-200">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                                                style={{ backgroundColor: cat.color }}
                                            >
                                                <Icon className="h-5 w-5 text-white" />
                                            </div>
                                            <span className="font-medium">{cat.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-right">
                                            <span className="font-semibold text-muted-foreground">{Math.trunc(cat.percentage)}%</span>
                                            <span className="font-bold text-muted-foreground">{formatCurrency(cat.value, currency)}</span>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })
                    ) : (
                    <div className="text-center p-4 rounded-lg bg-card shadow">
                        <p className="text-muted-foreground text-sm">No hay categorías en este período.</p>
                    </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {isFabMenuOpen && (
            <div
                className="fixed inset-0 bg-black/50 z-40 animate-in fade-in-0"
                onClick={() => setIsFabMenuOpen(false)}
                aria-hidden="true"
            />
        )}
        
        <BottomNavBar />
        
        <Dialog open={isManualTransactionModalOpen} onOpenChange={setIsManualTransactionModalOpen}>
            <DialogContent className="w-[calc(100vw-2rem)] h-[80vh] flex flex-col rounded-lg">
            <DialogHeader className="p-4 border-b">
                <DialogTitle>Nueva Transacción</DialogTitle>
            </DialogHeader>
            <div className="flex-grow min-h-0">
                <TransactionForm onSave={() => setIsManualTransactionModalOpen(false)} onCancel={() => setIsManualTransactionModalOpen(false)} />
            </div>
            </DialogContent>
        </Dialog>

        {audioModalInitialData && isAudioModalOpen && (
            <AudioTransactionModal
                isOpen={isAudioModalOpen}
                onClose={handleAudioModalClose}
                initialData={audioModalInitialData}
                onTransactionSaved={handleAudioTransactionSaved}
                formKey={audioFormKey} 
            />
        )}
        </div>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
            <SheetHeader className="p-4 border-b">
                <SheetTitle className="text-left">Fintouch</SheetTitle>
            </SheetHeader>
            <div className="p-2 mt-4">
                <nav className="flex flex-col gap-1">
                    <Link href="/categories" passHref>
                        <Button variant="ghost" className="w-full justify-start text-md p-3 h-auto" onClick={() => setIsSheetOpen(false)}>
                            <LayoutGrid className="mr-3 h-5 w-5" />
                            Categorías
                        </Button>
                    </Link>
                    <Link href="/budgets" passHref>
                        <Button variant="ghost" className="w-full justify-start text-md p-3 h-auto" onClick={() => setIsSheetOpen(false)}>
                            <Target className="mr-3 h-5 w-5" />
                            Presupuestos
                        </Button>
                    </Link>
                    <Link href="/recurring" passHref>
                        <Button variant="ghost" className="w-full justify-start text-md p-3 h-auto" onClick={() => setIsSheetOpen(false)}>
                            <Repeat className="mr-3 h-5 w-5" />
                            Pagos Recurrentes
                        </Button>
                    </Link>
                </nav>
            </div>
        </SheetContent>
    </Sheet>
  );
}
