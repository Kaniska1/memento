import { z } from "zod";

const listMovieSchema = z.object({
  movieId: z.number().int().positive(),

  title: z
    .string()
    .trim()
    .min(1)
    .max(300),

  year: z
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

  position: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),
});

export const createListSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "List title is required.")
    .max(100),

  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .default(""),

  isPublic: z
    .boolean()
    .optional()
    .default(false),

  isRanked: z
    .boolean()
    .optional()
    .default(false),

  movies: z
    .array(listMovieSchema)
    .optional()
    .default([]),
});

export const updateListSchema =
  createListSchema.partial();