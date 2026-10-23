import { z } from 'zod';

const token = z.string().trim().min(20).max(4096);

export const registerDeviceSchema = z.object({
  token,
  platform: z.enum(['android', 'ios']),
}).strict();

export const unregisterDeviceSchema = z.object({ token }).strict();
