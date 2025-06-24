'use server';
/**
 * @fileOverview Suggests category icons based on a category name.
 *
 * - suggestCategoryIcon - A function that suggests icons.
 * - SuggestCategoryIconInput - The input type for the function.
 * - SuggestCategoryIconOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {iconMap, type IconName} from '@/lib/icon-map';

const allIconNames = Object.keys(iconMap) as IconName[];

const SuggestCategoryIconInputSchema = z.object({
  categoryName: z.string().describe('The name of the category to suggest icons for.'),
});
export type SuggestCategoryIconInput = z.infer<typeof SuggestCategoryIconInputSchema>;

const SuggestCategoryIconOutputSchema = z.object({
  icons: z.array(z.string()).describe('An array of up to 5 suggested icon names from the available list.'),
});
export type SuggestCategoryIconOutput = z.infer<typeof SuggestCategoryIconOutputSchema>;

export async function suggestCategoryIcon(
  input: SuggestCategoryIconInput
): Promise<SuggestCategoryIconOutput> {
  return suggestCategoryIconFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCategoryIconPrompt',
  input: {schema: SuggestCategoryIconInputSchema},
  output: {schema: SuggestCategoryIconOutputSchema},
  prompt: `You are a UI/UX expert specializing in personal finance apps.
Your task is to suggest the most relevant icons for a given category name.

Category Name: {{{categoryName}}}

Based on the category name, choose the 5 most appropriate icon names from the following list.
Return your answer as a JSON object with an "icons" array.

Available Icons:
${allIconNames.join(', ')}
`,
});

const suggestCategoryIconFlow = ai.defineFlow(
  {
    name: 'suggestCategoryIconFlow',
    inputSchema: SuggestCategoryIconInputSchema,
    outputSchema: SuggestCategoryIconOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input, { model: 'googleai/gemini-1.5-flash-latest' });
    // Filter out any icons the LLM might have hallucinated
    const validIcons = output?.icons.filter(icon => allIconNames.includes(icon as IconName)) || [];
    return { icons: validIcons };
  }
);
