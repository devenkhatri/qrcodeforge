// optimize-qr-code-design.ts
'use server';

/**
 * @fileOverview An AI tool that optimizes customized QR code designs.
 *
 * - optimizeQrCodeDesign - A function that optimizes QR code designs for readability.
 * - OptimizeQrCodeDesignInput - The input type for the optimizeQrCodeDesign function.
 * - OptimizeQrCodeDesignOutput - The return type for the optimizeQrCodeDesign function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeQrCodeDesignInputSchema = z.object({
  qrCodeDataUri: z
    .string()
    .describe(
      "A QR code image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  logoDataUri: z
    .string()
    .optional()
    .describe(
      "An optional logo image to embed in the QR code, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  shapeColor: z.string().optional().describe('The color of the QR code shapes (e.g., dots, eyes).'),
  eyeShape: z.string().optional().describe('The shape of the QR code eyes.'),
  dotShape: z.string().optional().describe('The shape of the QR code dots.'),
  userInstructions: z.string().optional().describe('Additional instructions from the user regarding desired aesthetics or functionality.'),
});

export type OptimizeQrCodeDesignInput = z.infer<typeof OptimizeQrCodeDesignInputSchema>;

const OptimizeQrCodeDesignOutputSchema = z.object({
  optimizedQrCodeDataUri: z
    .string()
    .describe(
      'The optimized QR code image as a data URI, ensuring readability and visual appeal.'
    ),
  optimizationReport: z
    .string()
    .describe(
      'A report detailing the optimizations made to the QR code and any potential readability concerns.'
    ),
});

export type OptimizeQrCodeDesignOutput = z.infer<typeof OptimizeQrCodeDesignOutputSchema>;

export async function optimizeQrCodeDesign(
  input: OptimizeQrCodeDesignInput
): Promise<OptimizeQrCodeDesignOutput> {
  return optimizeQrCodeDesignFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeQrCodeDesignPrompt',
  input: {schema: OptimizeQrCodeDesignInputSchema},
  output: {schema: OptimizeQrCodeDesignOutputSchema},
  prompt: `You are an AI expert in optimizing QR code designs for readability and visual appeal.

You will receive a QR code image, an optional logo to embed, color customizations, and user instructions.
Your goal is to optimize the QR code to ensure it is easily scannable while incorporating the desired customizations.

Here is the QR code image:
{{media url=qrCodeDataUri}}

{{#if logoDataUri}}
Here is the logo to embed:
{{media url=logoDataUri}}
{{/if}}

{{#if shapeColor}}
The QR code shapes are customized with the following color: {{{shapeColor}}}.
{{/if}}

{{#if eyeShape}}
The QR code eyes have the following shape: {{{eyeShape}}}.
{{/if}}

{{#if dotShape}}
The QR code dots have the following shape: {{{dotShape}}}.
{{/if}}

{{#if userInstructions}}
Additional user instructions: {{{userInstructions}}}.
{{/if}}


Based on the above information, generate an optimized QR code and provide a report detailing the optimizations made. The optimized QR code should maintain readability and visual appeal. Please return the optimized QR code as a data URI, and the optimization report as a string.

Ensure that the outputted "optimizedQrCodeDataUri" is a data URI with proper MIME type and Base64 encoding. Example: data:image/png;base64,iVBORw...
Ensure that the outputted "optimizationReport" is a string with a report.
`,
});

const optimizeQrCodeDesignFlow = ai.defineFlow(
  {
    name: 'optimizeQrCodeDesignFlow',
    inputSchema: OptimizeQrCodeDesignInputSchema,
    outputSchema: OptimizeQrCodeDesignOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
