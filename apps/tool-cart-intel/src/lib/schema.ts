import { z } from "zod";

export const ProductSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  category: z.string().optional().default("unknown"),
  price: z.number().nonnegative(),
  currency: z.string().default("USD"),
  rating: z.number().min(0).max(5).optional().default(0),
  stock: z.number().int().nonnegative().optional().default(0),
  brand: z.string().optional(),
  thumbnail: z.string().optional()
});

export const AnalyzeRequestSchema = z.object({
  targetCurrency: z.string().default("USD"),
  rates: z.record(z.number().positive()).optional().default({}),
  preferences: z
    .object({
      prioritizeRating: z.boolean().optional().default(true),
      prioritizeLowerPrice: z.boolean().optional().default(true),
      inStockOnly: z.boolean().optional().default(true),
      preferredCategory: z.string().optional()
    })
    .optional()
    .default({}),
  products: z.array(ProductSchema).min(1).max(50)
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type ProductInput = z.infer<typeof ProductSchema>;
