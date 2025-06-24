import { config } from 'dotenv';
config();

import '@/ai/flows/automatically-categorize-transactions.ts';
import '@/ai/flows/extract-transaction-details-from-receipt.ts';
import '@/ai/flows/suggest-category-icon.ts';
import '@/ai/flows/extract-transaction-from-audio.ts';
import '@/ai/flows/generate-financial-summary.ts';
