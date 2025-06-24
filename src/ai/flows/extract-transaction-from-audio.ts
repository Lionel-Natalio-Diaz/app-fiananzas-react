'use server';
/**
 * @fileOverview Extracts and consolidates multiple purchases from an audio recording into a single transaction.
 *
 * This file defines:
 * - `extractTransactionFromAudio`: The main function to extract and consolidate transaction details from audio.
 * - `AudioTransactionInput`: The input type for the function.
 * - `AudioTransactionOutput`: The output type for the function, representing a single consolidated transaction.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AudioTransactionInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio recording of a transaction, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  availableCategories: z.array(z.string()).describe('A list of available categories for the transaction type.'),
  userCurrency: z.string().describe('The default currency of the user (e.g., USD, EUR, ARS).'),
  currentDate: z.string().describe('The current date in YYYY-MM-DD format to resolve relative dates like "today" or "yesterday".')
});
export type AudioTransactionInput = z.infer<typeof AudioTransactionInputSchema>;


const AudioTransactionOutputSchema = z.object({
  amount: z.number().describe('The SUM of all amounts mentioned in the audio.'),
  date: z.string().describe('The date of the transaction in YYYY-MM-DD format.'),
  description: z.string().describe('A concise, combined description of all items mentioned.'),
  category: z.string().describe('The determined category. If items are varied, this MUST be "Otros". Must be one of the available categories.'),
  type: z.enum(['income', 'expense']).describe('The type of the transaction (income or expense).'),
  currency: z.string().describe('The currency code for the transaction (e.g., USD, EUR). Defaults to user currency if not specified.'),
  recurrence: z.enum(['once', 'weekly', 'monthly', 'yearly']).describe('The recurrence of the transaction. Defaults to "once" if not specified.'),
});

export type AudioTransactionOutput = z.infer<typeof AudioTransactionOutputSchema>;

export async function extractTransactionFromAudio(
  input: AudioTransactionInput
): Promise<AudioTransactionOutput> {
  return extractTransactionFromAudioFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTransactionFromAudioPrompt',
  input: {schema: AudioTransactionInputSchema},
  output: {schema: AudioTransactionOutputSchema},
  prompt: `You are a personal finance assistant. Your task is to listen to an audio clip, transcribe it, and extract a SINGLE consolidated transaction from it, even if multiple purchases or items are mentioned.

  Current Date: {{{currentDate}}}
  User's Default Currency: {{{userCurrency}}}
  
  Audio Input: {{media url=audioDataUri}}

  Analyze the audio and follow these rules STRICTLY:
  1.  **Amount**: You MUST sum up ALL monetary values mentioned to get a single total amount for the transaction. For example, if the user says "I spent 3000 on vegetables and 5000 on meat", the final amount is 8000.
  2.  **Description**: Create a concise, combined description of all items mentioned. For example, "Vegetables and meat" or "Dog food, Coca-cola, Netflix subscription".
  3.  **Type**: Is it an 'income' or an 'expense'? All items are assumed to be of the same type. If mixed, default to 'expense'.
  4.  **Date**: Resolve any relative terms like "today" or "yesterday" to a 'YYYY-MM-DD' format based on the current date. If no date is mentioned, use the current date.
  5.  **Category**: This is the most important rule.
      *   If all items mentioned clearly belong to a single, specific category (e.g., "vegetables" and "meat" both fit into 'Supermercado'), you MUST use that specific category.
      *   If the items are from different, unrelated categories (e.g., "dog food", "a coke", "netflix"), you MUST use the category 'Otros'.
      *   You MUST choose one from this list of available categories: {{{json availableCategories}}}.
  6.  **Currency**: Identify the currency code (e.g., USD, ARS, EUR). Default to the user's currency if not specified.
  7.  **Recurrence**: Default to 'once' unless explicitly mentioned otherwise.

  Your final output MUST be a single JSON object representing ONE consolidated transaction. Do NOT return an array. If no transaction can be clearly identified, respond with an amount of 0 and an empty description.`,
});

const extractTransactionFromAudioFlow = ai.defineFlow(
  {
    name: 'extractTransactionFromAudioFlow',
    inputSchema: AudioTransactionInputSchema,
    outputSchema: AudioTransactionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, { model: 'googleai/gemini-1.5-flash-latest' });
    return output!;
  }
);
