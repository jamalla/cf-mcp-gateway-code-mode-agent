import { z } from "zod";

export const ExecuteRequestSchema = z.object({
  prompt: z.string().min(1),
  selectedTools: z.array(z.string()).min(1),
  generatedCode: z.string().min(1),
  toolBaseUrls: z.object({
    products: z.string().url().optional(),
    fx: z.string().url().optional(),
    "cart-intel": z.string().url().optional()
  })
});

export type ExecuteRequest = z.infer<typeof ExecuteRequestSchema>;
