import { z } from "zod";

const ratingSchema = z
  .number()
  .min(0.5)
  .max(5)
  .refine(
    (value) => Number.isInteger(value * 2),
    "Rating must use 0.5 increments.",
  )
  .nullable();

export const createDiaryEntrySchema = z.object({
  movieId: z.number().int().positive(),

  movieTitle: z
    .string()
    .trim()
    .min(1)
    .max(300),

  movieYear: z
    .string()
    .trim()
    .max(10)
    .optional()
    .default(""),

  poster: z
    .string()
    .nullable()
    .optional()
    .default(null),

  watchedDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Invalid watch date.",
    ),

  rating: ratingSchema.optional().default(null),

  review: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .default(""),

  containsSpoilers: z
    .boolean()
    .optional()
    .default(false),

  liked: z
    .boolean()
    .optional()
    .default(false),

  isRewatch: z
    .boolean()
    .optional()
    .default(false),
});

export const updateDiaryEntrySchema =
  createDiaryEntrySchema
    .omit({
      movieId: true,
      movieTitle: true,
    })
    .partial();

export type CreateDiaryEntryInput = z.infer<
  typeof createDiaryEntrySchema
>;