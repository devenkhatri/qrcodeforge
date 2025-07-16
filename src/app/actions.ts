'use server';

import { z } from 'zod';
import { optimizeQrCodeDesign, OptimizeQrCodeDesignInput } from '@/ai/flows/optimize-qr-code-design';

const actionSchema = z.object({
  qrCodeDataUri: z.string(),
  logoDataUri: z.string().optional(),
  shapeColor: z.string().optional(),
  eyeShape: z.string().optional(),
  dotShape: z.string().optional(),
});

export async function handleOptimize(data: OptimizeQrCodeDesignInput) {
  const validation = actionSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: 'Invalid input.' };
  }

  try {
    const result = await optimizeQrCodeDesign(validation.data);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error optimizing QR code:', error);
    return { success: false, error: 'Failed to optimize QR code with AI. Please try again.' };
  }
}
