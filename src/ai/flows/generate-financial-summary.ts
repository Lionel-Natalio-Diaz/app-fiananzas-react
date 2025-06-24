
'use server';
/**
 * @fileOverview Generates an AI-powered summary of the user's financial activity.
 *
 * - generateFinancialSummary - A function that creates a personalized financial summary.
 * - GenerateFinancialSummaryInput - The input type for the function.
 * - GenerateFinancialSummaryOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFinancialSummaryInputSchema = z.object({
  userName: z.string().describe("The user's name for personalization."),
  currency: z.string().describe('The currency symbol (e.g., $, €).'),
  currentPeriodSummary: z.object({
    periodName: z.string(),
    income: z.number(),
    expenses: z.number(),
  }),
  previousPeriodSummary: z.object({
    periodName: z.string(),
    income: z.number(),
    expenses: z.number(),
  }),
  topSpendingCategories: z
    .array(
      z.object({
        name: z.string(),
        amount: z.number(),
      })
    )
    .describe('The top spending categories for the current period.'),
  budgetPerformance: z
    .array(
      z.object({
        category: z.string(),
        budgeted: z.number(),
        spent: z.number(),
      })
    )
    .optional()
    .describe('A list of budget performance for key categories this period. Compare spent vs. budgeted. THIS IS THE ONLY SOURCE OF TRUTH FOR BUDGETS.'),
  historicalCategoryAverages: z.array(z.object({
    category: z.string(),
    average: z.number(),
  })).optional().describe('The average monthly spending for key categories over the last 6 months.'),
});
export type GenerateFinancialSummaryInput = z.infer<typeof GenerateFinancialSummaryInputSchema>;

const InsightSchema = z.object({
  type: z.enum(['positive', 'warning', 'info', 'alert']).describe('The type of insight, used for styling. "positive" for achievements, "warning" for budget risks, "alert" for significant overspending or unusual activity, "info" for neutral observations.'),
  title: z.string().describe('A short, catchy title for the insight (max 5 words).'),
  description: z.string().describe('A one-sentence explanation of the insight, providing specific numbers.'),
  icon: z.string().describe('The most relevant Lucide icon name for this insight (e.g., "TrendingUp", "AlertTriangle", "Award", "Info").'),
});

const GenerateFinancialSummaryOutputSchema = z.object({
  insights: z.array(InsightSchema).describe('An array of 3 to 5 key financial insights for the user. Prioritize the most important and actionable ones, from most to least important.'),
});
export type GenerateFinancialSummaryOutput = z.infer<typeof GenerateFinancialSummaryOutputSchema>;

export async function generateFinancialSummary(
  input: GenerateFinancialSummaryInput
): Promise<GenerateFinancialSummaryOutput> {
  return generateFinancialSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFinancialSummaryPrompt',
  input: {schema: GenerateFinancialSummaryInputSchema},
  output: {schema: GenerateFinancialSummaryOutputSchema},
  prompt: `You are Fintouch, an expert financial analyst AI. Your task is to analyze the user's monthly financial data and provide clear, actionable, and insightful feedback in Spanish.

User's name: {{{userName}}}
Currency: {{{currency}}}

**Current Month Data ({{currentPeriodSummary.periodName}}):**
- Income: {{{currency}}}{{{currentPeriodSummary.income}}}
- Expenses: {{{currency}}}{{{currentPeriodSummary.expenses}}}

**Previous Month Data ({{previousPeriodSummary.periodName}}):**
- Income: {{{currency}}}{{{previousPeriodSummary.income}}}
- Expenses: {{{currency}}}{{{previousPeriodSummary.expenses}}}

**Top Spending Categories this month:**
{{#if topSpendingCategories}}
  {{#each topSpendingCategories}}
  - {{name}}: {{{currency}}}{{amount}}
  {{/each}}
{{/if}}

**Budget Performance this month (Source of Truth):**
{{#if budgetPerformance}}
  {{#each budgetPerformance}}
  - {{category}}: Gastado {{{currency}}}{{{spent}}} de un presupuesto de {{{currency}}}{{{budgeted}}}
  {{/each}}
{{else}}
  No hay presupuestos definidos para este período.
{{/if}}

**Historical Spending Averages (last 6 months):**
{{#if historicalCategoryAverages}}
    {{#each historicalCategoryAverages}}
    - {{category}}: Promedio {{{currency}}}{{average}}
    {{/each}}
{{else}}
    No hay datos históricos suficientes para comparar.
{{/if}}

**Your Task & Analysis Framework:**
Analyze all the data provided and generate an array of 3 to 5 distinct, valuable insights for {{{userName}}}. Follow this framework for analysis and prioritize your insights from most to least critical.

1.  **Critical Alerts (Highest Priority - type: 'alert', icon: 'AlertTriangle'):**
    *   **Budget Overspends:** Iterate through the 'budgetPerformance' array. **You MUST create a separate 'alert' insight for EACH category where 'spent' is greater than 'budgeted'.** This is the most important type of insight. Do NOT invent budgets for categories not present in the 'budgetPerformance' array.
    *   **Major Deficit:** Is total spending for the month significantly higher than total income? State the deficit amount clearly.
    *   **Unusual Spending Spikes:** Is spending in any category this month drastically higher (e.g., >50%) than its 6-month historical average? Highlight this unusual deviation.

2.  **Important Warnings (Medium Priority - type: 'warning', icon: 'TrendingDown' or 'AlertCircle'):**
    *   **Approaching Budget Limits:** Look at the 'budgetPerformance' array. Is any category's spending close to its budget (e.g., >80% spent but not yet over)? Warn the user. **DO NOT warn if spending is below 80% of the budget.**
    *   **Negative Trends:** Is this month's total spending significantly higher than last month's? Highlight this negative trend.

3.  **Positive Reinforcement (Medium Priority - type: 'positive', icon: 'Award' or 'TrendingUp'):**
    *   **Staying Well Under Budget:** Did the user do exceptionally well on a budget (e.g., spent <50% of the allocated amount)? Acknowledge this positive achievement. **This is not a warning.**
    *   **Increased Surplus:** Did the user have a larger surplus (income - expenses) this month compared to last month? Congratulate them.
    *   **Reduced Spending:** Did the user significantly reduce spending in a key category compared to its historical average? Praise this positive change.

4.  **Informational Insights (Lowest Priority - type: 'info', icon: 'Info'):**
    *   If no other significant insights are found, provide a general summary.
    *   Mention the largest spending category for the month if it hasn't already been covered in a more critical insight.

**CRITICAL OUTPUT FORMATTING RULES:**
Your entire response MUST be a single, valid JSON object and nothing else. Do not wrap it in markdown backticks.
The JSON object must have a single root key called "insights".
The value of "insights" MUST be an array containing 3 to 5 insight objects.
Each insight object in the array MUST have the following four string properties:
1.  type: one of 'alert', 'warning', 'positive', 'info'.
2.  title: a very short title (max 5 words).
3.  description: a single, concise sentence explaining the insight with specific numbers.
4.  icon: the name of a relevant Lucide icon (e.g., 'AlertTriangle', 'TrendingUp').

**Example of a valid insight object:**
{
  "type": "alert",
  "title": "Presupuesto de Servicios Superado",
  "description": "Has gastado $1,200 de tu presupuesto de $1,000 para Servicios.",
  "icon": "AlertTriangle"
}

Adhere strictly to this format. Your entire response must be only the JSON object.
`,
});

const generateFinancialSummaryFlow = ai.defineFlow(
  {
    name: 'generateFinancialSummaryFlow',
    inputSchema: GenerateFinancialSummaryInputSchema,
    outputSchema: GenerateFinancialSummaryOutputSchema,
  },
  async input => {
    try {
      // Attempt 1: Use the default (more powerful) model
      console.log('Attempting financial summary with primary (pro) model...');
      const {output} = await prompt(input);
      return output!;
    } catch (error) {
      console.warn('Primary model failed for financial summary. Retrying with fallback (flash) model.', error);
      // Attempt 2: Use the fallback model if the primary one fails
      const {output} = await prompt(input, { model: 'googleai/gemini-1.5-flash-latest' });
      return output!;
    }
  }
);
