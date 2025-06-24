'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CategoryForm, type CategoryFormValues } from '@/components/categories/CategoryForm';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/contexts/AppContext';
import type { UserCategory } from '@/lib/types';
import * as Icons from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function CategoriesPage() {
  const { state, addCategory, updateCategory, deleteCategory } = useAppContext();
  const { categories } = state;
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<UserCategory | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const { expenseCategories, incomeCategories } = useMemo(() => {
    const expenseCats = categories.filter(c => c.type === 'expense').sort((a, b) => a.name.localeCompare(b.name));
    const incomeCats = categories.filter(c => c.type === 'income').sort((a, b) => a.name.localeCompare(b.name));
    return { expenseCategories: expenseCats, incomeCategories: incomeCats };
  }, [categories]);
  
  const handleOpenModal = (category: UserCategory | null) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  const handleSaveCategory = async (data: CategoryFormValues) => {
    try {
        if (selectedCategory) {
            // Update existing category, preserving original type and isDefault status
            const updatedCategory: UserCategory = {
                id: selectedCategory.id,
                name: data.name,
                icon: data.icon,
                color: data.color,
                type: selectedCategory.type, // Preserve original type
                isDefault: selectedCategory.isDefault ?? false, // Preserve isDefault
            };
            await updateCategory(updatedCategory);
        } else {
            // Create new category using the active tab's type
            const newCategoryData = {
                name: data.name,
                icon: data.icon,
                color: data.color,
                type: activeTab,
            };
            await addCategory(newCategoryData);
        }
        handleCloseModal();
    } catch (error) {
        console.error("Error saving category:", error);
        toast({ title: "Error", description: "No se pudo guardar la categoría.", variant: "destructive" });
    }
  };
  
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    try {
      await deleteCategory(selectedCategory.id);
      setIsDeleteAlertOpen(false);
      handleCloseModal();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({ title: "Error", description: "No se pudo eliminar la categoría.", variant: "destructive" });
    }
  };

  const CategoryGrid = ({ categories }: { categories: UserCategory[] }) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
      <button 
        onClick={() => handleOpenModal(null)}
        className="aspect-square flex flex-col items-center justify-center p-3 text-center rounded-lg border-2 border-dashed border-muted-foreground/50 hover:border-primary hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary"
      >
        <PlusCircle className="h-6 w-6 mb-1" />
        <span className="text-xs font-medium">Agregar</span>
      </button>
      {categories.map(category => {
        const Icon = Icons[category.icon as keyof typeof Icons] || MoreHorizontal;
        return (
          <button 
            key={category.id} 
            onClick={() => handleOpenModal(category)}
            className={cn(
              "aspect-square flex flex-col items-center justify-center p-2 text-center transition-colors cursor-pointer",
              "rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-muted/50"
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
  );

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
        {isMobile && (
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm shrink-0">
                <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Volver</span>
                </Button>
                <h1 className="text-xl font-semibold">Categorías</h1>
            </header>
        )}
        <main className="flex-grow space-y-4 p-4 md:p-6 overflow-y-auto">
            {!isMobile && (
                <div className="flex items-center gap-4 mb-4">
                    <Button variant="outline" asChild className="h-9 w-9 p-0">
                        <Link href="/">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Volver</span>
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold">Gestionar Categorías</h1>
                </div>
            )}
            
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'expense' | 'income')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-transparent p-0">
                    <TabsTrigger 
                      value="expense"
                      className="pb-2 text-md font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-transparent border-b-2"
                    >
                      Gastos
                    </TabsTrigger>
                    <TabsTrigger 
                      value="income"
                      className="pb-2 text-md font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-transparent border-b-2"
                    >
                      Ingresos
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="expense" className="mt-6">
                    <CategoryGrid categories={expenseCategories} />
                </TabsContent>
                <TabsContent value="income" className="mt-6">
                    <CategoryGrid categories={incomeCategories} />
                </TabsContent>
            </Tabs>
        </main>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="h-[80vh] flex flex-col rounded-lg">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>{selectedCategory ? 'Editar Categoría' : 'Crear Nueva Categoría'}</DialogTitle>
                </DialogHeader>
                <div className="flex-grow min-h-0">
                    <CategoryForm 
                       initialData={selectedCategory ?? undefined}
                       onSave={handleSaveCategory}
                       onCancel={handleCloseModal}
                       onDelete={() => setIsDeleteAlertOpen(true)}
                    />
                </div>
            </DialogContent>
        </Dialog>
        
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro de que quieres eliminar esta categoría?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Las transacciones existentes que usen esta categoría no serán eliminadas y podrían quedar sin una categoría visible. Se recomienda reasignarlas antes de continuar.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteCategory}>Eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
