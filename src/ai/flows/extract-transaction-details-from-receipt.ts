'use server';
/**
 * @fileOverview Extracts transaction details from a receipt image using Genkit and Gemini.
 *
 * This file defines:
 * - `extractTransactionDetailsFromReceipt`: The main function to extract transaction details.
 * - `ExtractTransactionDetailsFromReceiptInput`: The input type for the function.
 * - `ExtractTransactionDetailsFromReceiptOutput`: The output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTransactionDetailsFromReceiptInputSchema = z.object({
  receiptImage: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTransactionDetailsFromReceiptInput = z.infer<typeof ExtractTransactionDetailsFromReceiptInputSchema>;

const ExtractTransactionDetailsFromReceiptOutputSchema = z.object({
  date: z.string().describe('The date of the transaction.'),
  merchant: z.string().describe('The name of the merchant.'),
  amount: z.number().describe('The total amount of the transaction.'),
});
export type ExtractTransactionDetailsFromReceiptOutput = z.infer<typeof ExtractTransactionDetailsFromReceiptOutputSchema>;

export async function extractTransactionDetailsFromReceipt(
  input: ExtractTransactionDetailsFromReceiptInput
): Promise<ExtractTransactionDetailsFromReceiptOutput> {
  return extractTransactionDetailsFromReceiptFlow(input);
}

const extractTransactionDetailsFromReceiptPrompt = ai.definePrompt({
  name: 'extractTransactionDetailsFromReceiptPrompt',
  input: {schema: ExtractTransactionDetailsFromReceiptInputSchema},
  output: {schema: ExtractTransactionDetailsFromReceiptOutputSchema},
  prompt: `You are an expert in extracting transaction details from receipts.

  Given an image of a receipt, extract the date, merchant name, and total amount.

  Receipt Image: {{media url=receiptImage}}
  \n
  Return the extracted details in JSON format.`,
});

const extractTransactionDetailsFromReceiptFlow = ai.defineFlow(
  {
    name: 'extractTransactionDetailsFromReceiptFlow',
    inputSchema: ExtractTransactionDetailsFromReceiptInputSchema,
    outputSchema: ExtractTransactionDetailsFromReceiptOutputSchema,
  },
  async input => {
    const {output} = await extractTransactionDetailsFromReceiptPrompt(input);
    return output!;
  }
);
