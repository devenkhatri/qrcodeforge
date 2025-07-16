// optimize-qr-code-design.ts
'use server';

/**
 * @fileOverview An AI tool that generates and optimizes customized QR code designs.
 *
 * - optimizeQrCodeDesign - A function that generates and optimizes QR code designs for readability.
 * - OptimizeQrCodeDesignInput - The input type for the optimizeQrCodeDesign function.
 * - OptimizeQrCodeDesignOutput - The return type for the optimizeQrCodeDesign function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeQrCodeDesignInputSchema = z.object({
  qrCodeDataUri: z
    .string()
    .describe(
      "A base QR code image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
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
  optimizationReport: z
    .string()
    .describe(
      'A report detailing the optimizations made to the QR code and any potential readability concerns.'
    ),
});

export type OptimizeQrCodeDesignOutput = z.infer<typeof OptimizeQrCodeDesignOutputSchema>;


export async function optimizeQrCodeDesign(
  input: OptimizeQrCodeDesignInput
): Promise<OptimizeQrCodeDesignOutput & { optimizedQrCodeDataUri: string }> {
  const [reportResult, imageResult] = await Promise.all([
    diagnoseFlow(input),
    generateImageFlow(input)
  ]);
  
  return {
    optimizationReport: reportResult.optimizationReport,
    optimizedQrCodeDataUri: imageResult,
  };
}

const diagnosePrompt = ai.definePrompt({
    name: 'diagnoseQrCodePrompt',
    input: {schema: OptimizeQrCodeDesignInputSchema},
    output: {schema: OptimizeQrCodeDesignOutputSchema},
    prompt: `You are an AI expert in optimizing QR code designs for readability and visual appeal.
  
  You will receive a QR code image, an optional logo to embed, color customizations, and user instructions.
  Your goal is to provide a report on how the design could be optimized to ensure it is easily scannable while incorporating the desired customizations.
  
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
  
  Based on the above information, provide a report detailing the optimizations made.
  `,
  });
  
  const diagnoseFlow = ai.defineFlow(
    {
      name: 'diagnoseQrCodeFlow',
      inputSchema: OptimizeQrCodeDesignInputSchema,
      outputSchema: OptimizeQrCodeDesignOutputSchema,
    },
    async (input) => {
      const {output} = await diagnosePrompt(input);
      return output!;
    }
  );

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateQrCodeImageFlow',
    inputSchema: OptimizeQrCodeDesignInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    let promptParts = [
      {
        text: `Generate a QR code with the following customizations. The QR code should be perfectly scannable.
        - Data from this QR code:`,
      },
      { media: { url: input.qrCodeDataUri } },
    ];

    if (input.logoDataUri) {
      promptParts.push({ text: '- Embed this logo:' });
      promptParts.push({ media: { url: input.logoDataUri } });
    }
    if (input.shapeColor) {
      promptParts.push({ text: `- Shape color: ${input.shapeColor}` });
    }
    if (input.eyeShape) {
      promptParts.push({ text: `- Eye shape: ${input.eyeShape}` });
    }
    if (input.dotShape) {
      promptParts.push({ text: `- Dot shape: ${input.dotShape}` });
    }
    if (input.userInstructions) {
      promptParts.push({ text: `- User instructions: ${input.userInstructions}` });
    }

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: promptParts,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
        throw new Error('Image generation failed.');
    }

    return media.url;
  }
);
