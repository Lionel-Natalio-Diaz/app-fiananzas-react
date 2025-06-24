
'use server';
/**
 * @fileOverview Automatically categorizes transactions based on the transaction description.
 *
 * - automaticallyCategorizeTransactions - A function that categorizes transactions.
 * - AutomaticallyCategorizeTransactionsInput - The input type for the automaticallyCategorizeTransactions function.
 * - AutomaticallyCategorizeTransactionsOutput - The return type for the automaticallyCategorizeTransactions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutomaticallyCategorizeTransactionsInputSchema = z.object({
  transactionDescription: z.string().describe('The description of the transaction.'),
  availableCategories: z.string().describe('A comma-separated list of available categories to choose from.')
});
export type AutomaticallyCategorizeTransactionsInput = z.infer<typeof AutomaticallyCategorizeTransactionsInputSchema>;

const AutomaticallyCategorizeTransactionsOutputSchema = z.object({
  category: z.string().describe('The predicted category of the transaction. Must be one of the available categories.'),
  confidence: z.number().describe('The confidence level of the categorization (0-1).'),
});
export type AutomaticallyCategorizeTransactionsOutput = z.infer<typeof AutomaticallyCategorizeTransactionsOutputSchema>;

export async function automaticallyCategorizeTransactions(
  input: AutomaticallyCategorizeTransactionsInput
): Promise<AutomaticallyCategorizeTransactionsOutput> {
  return automaticallyCategorizeTransactionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'automaticallyCategorizeTransactionsPrompt',
  input: {schema: AutomaticallyCategorizeTransactionsInputSchema},
  output: {schema: AutomaticallyCategorizeTransactionsOutputSchema},
  prompt: `You are a personal finance expert tasked with categorizing a transaction based on its description.
  Based on the transaction description, determine the most appropriate category for the transaction from the provided list.
  Respond with the category and a confidence level (0-1).

  Transaction Description: {{{transactionDescription}}}

  You MUST choose one of the following categories: {{{availableCategories}}}
  `,
});

const automaticallyCategorizeTransactionsFlow = ai.defineFlow(
  {
    name: 'automaticallyCategorizeTransactionsFlow',
    inputSchema: AutomaticallyCategorizeTransactionsInputSchema,
    outputSchema: AutomaticallyCategorizeTransactionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, { model: 'googleai/gemini-1.5-flash-latest' });
    return output!;
  }
);

    