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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useCallback, useMemo } from "react";
import * as Icons from 'lucide-react';
import { cn } from "@/lib/utils";
import { iconMap, type IconName } from '@/lib/icon-map';
import { suggestCategoryIcon } from "@/ai/flows/suggest-category-icon";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { UserCategory } from "@/lib/types";

const availableIcons = Object.keys(iconMap) as IconName[];

const categoryFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  icon: z.custom<IconName>(val => typeof val === 'string' && availableIcons.includes(val as IconName), {
    message: "Por favor selecciona un icono válido.",
  }),
  color: z.string({ required_error: "Por favor selecciona un color." }),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  initialData?: UserCategory;
  onSave: (data: CategoryFormValues) => void;
  onCancel: () => void;
  onDelete: () => void;
}

const colorPalette = [
  '#3A8CFF', '#30D98A', '#FF9E40', '#FFD24C', '#FF6E57', '#B37FFF', '#29B6F6', '#FF66B3',
  '#00C8E5', '#A6E22E', '#FF7A5A', '#6F5CFF', '#D960FF', '#C7AA6D', '#4DD3FF', '#7AD7C9'
];

export function CategoryForm({ initialData, onSave, onCancel, onDelete }: CategoryFormProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      icon: initialData?.icon || 'ShoppingBag',
      color: initialData?.color || '#3A8CFF',
    },
  });

  const [searchTerm, setSearchTerm] = useState('');
  const nameValue = form.watch('name');
  const iconValue = form.watch('icon');
  const colorValue = form.watch('color');

  const [suggestedIcons, setSuggestedIcons] = useState<IconName[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const filteredIcons = useMemo(() => {
    if (!searchTerm) return [];
    return availableIcons.filter(iconName => {
      const searchKeywords = iconMap[iconName] || [];
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      
      return iconName.toLowerCase().includes(lowerCaseSearchTerm) || 
             searchKeywords.some(keyword => keyword.toLowerCase().includes(lowerCaseSearchTerm));
    }).slice(0, 6);
  }, [searchTerm]);

  const iconsToShow = useMemo(() => {
    if (searchTerm) {
      return filteredIcons;
    }
    if (suggestedIcons.length > 0) {
      return suggestedIcons.slice(0, 6);
    }
    return availableIcons.slice(0, 6);
  }, [searchTerm, filteredIcons, suggestedIcons]);

  const IconComponent = Icons[iconValue as keyof typeof Icons] || Icons.HelpCircle;

  const handleFetchSuggestions = useCallback(async (categoryName: string) => {
    if (categoryName.length < 3) {
        setSuggestedIcons([]);
        return;
    }
    setIsSuggesting(true);
    try {
        const result = await suggestCategoryIcon({ categoryName });
        setSuggestedIcons((result.icons as IconName[])); 
    } catch (error) {
        console.error("Error fetching icon suggestions:", error);
        setSuggestedIcons([]);
    } finally {
        setIsSuggesting(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
        if (nameValue && !searchTerm) {
            handleFetchSuggestions(nameValue);
        }
    }, 500); // 500ms debounce

    return () => {
        clearTimeout(handler);
    };
  }, [nameValue, searchTerm, handleFetchSuggestions]);


  function onSubmit(data: CategoryFormValues) {
    onSave(data);
  }
  
  const IconGrid = ({ icons, onSelect }: { icons: IconName[], onSelect: (icon: IconName) => void }) => (
    <div className="grid grid-cols-6 gap-2 p-1">
      {icons.map(iconName => {
          const Icon = Icons[iconName as keyof typeof Icons];
          return (
              <button
                type="button"
                key={iconName}
                onClick={() => onSelect(iconName)}
                className={cn("aspect-square flex items-center justify-center rounded-md border",
                  iconValue === iconName ? 'bg-primary text-primary-foreground' : 'bg-card'
                )}
              >
                <Icon className="w-6 h-6"/>
              </button>
          )
      })}
    </div>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        
        <div className="flex flex-col items-center justify-center space-y-3 p-4 bg-muted/50 border-b shrink-0">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: colorValue }}
            >
              <IconComponent className="w-12 h-12 text-white" />
            </div>
            <p className="text-xl font-bold">{nameValue || 'Nueva Categoría'}</p>
        </div>

        <ScrollArea className="flex-grow">
            <div className="space-y-4 p-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Categoría</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Comida Rápida" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {colorPalette.map(color => (
                           <button
                              type="button"
                              key={color}
                              onClick={() => field.onChange(color)}
                              className={cn("w-8 h-8 rounded-full border-2 transition-transform",
                                field.value === color ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : 'border-transparent'
                              )}
                              style={{ backgroundColor: color }}
                           />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex flex-col space-y-2">
                 <FormLabel>Icono</FormLabel>
                 
                 <Input 
                    placeholder="Buscar iconos en español (ej: coche, comida...)" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  
                  <div className={cn(
                      "border rounded-md min-h-[76px]",
                      isSuggesting && !searchTerm && "flex items-center justify-center"
                  )}>
                     {isSuggesting && !searchTerm ? (
                        <LoadingSpinner />
                     ) : (
                       <IconGrid icons={iconsToShow} onSelect={(icon) => form.setValue('icon', icon)} />
                     )}
                  </div>
                  {searchTerm && iconsToShow.length === 0 && (
                    <p className="p-4 text-center text-sm text-muted-foreground">No se encontraron iconos.</p>
                  )}
               </div>
            </div>
        </ScrollArea>

        <div className="flex justify-between items-center gap-2 p-4 border-t shrink-0">
          <div>
            {initialData?.id && (
              <Button type="button" variant="destructive" size="icon" onClick={onDelete}>
                <Icons.Trash2 className="h-4 w-4" />
                <span className="sr-only">Eliminar</span>
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit">Guardar Categoría</Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
