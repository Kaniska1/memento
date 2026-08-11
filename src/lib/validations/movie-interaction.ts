import { z } from "zod";

const ratingSchema = z
  .number()
  .min(0.5)
  .max(5)
  .refine(
    (value) => Number.isInteger(value * 2),
    "Rating must use increments of 0.5.",
  )
  .nullable();

export const movieInteractionSchema = z.object({
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

  genre: z
    .string()
    .trim()
    .max(100)
    .optional()
    .default("Film"),

  watched: z.boolean().optional(),

  liked: z.boolean().optional(),

  watchlisted: z.boolean().optional(),

  rating: ratingSchema.optional(),

  lastWatchedAt: z
    .string()
    .datetime()
    .nullable()
    .optional(),
});