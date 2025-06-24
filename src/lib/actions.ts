
'use server';

import { automaticallyCategorizeTransactions } from '@/ai/flows/automatically-categorize-transactions';
import type { CategorizationResult } from './types';

export async function getAutomatedCategoryAction(input: {
  transactionDescription: string;
  availableCategories: string[];
}): Promise<CategorizationResult> {
  try {
    const availableCats = input.availableCategories;
    
    if (!availableCats || availableCats.length === 0) {
      return { category: 'Otros', confidence: 0 };
    }
    
    const result = await automaticallyCategorizeTransactions({
      transactionDescription: input.transactionDescription,
      availableCategories: availableCats.join(', '),
    });
    
    // Trim the result and find a case-insensitive match
    const suggestedCategoryTrimmed = result.category.trim().toLowerCase();
    const matchedCategory = availableCats.find(c => c.toLowerCase() === suggestedCategoryTrimmed);

    if (matchedCategory) {
      // Return the original cased category name to ensure an exact match on the client
      return {
        category: matchedCategory,
        confidence: result.confidence,
      };
    } else {
      // If the AI hallucinates a category or format is weird, we can't use it.
      // We will return a result with low confidence so the UI doesn't update.
      console.warn(`AI suggested invalid or non-matching category: "${result.category}". Not in provided list: [${availableCats.join(', ')}]`);
      return { category: result.category, confidence: 0 };
    }
  } catch (error) {
    console.error('Error in getAutomatedCategoryAction:', error);
    // On actual error, return a non-confident "Otros"
    return { category: 'Otros', confidence: 0 };
  }
}
