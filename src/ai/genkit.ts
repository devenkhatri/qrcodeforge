import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      supportedGenerations: [
        'gemini-2.0-flash-preview-image-generation',
        'gemini-2.0-flash',
      ],
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
