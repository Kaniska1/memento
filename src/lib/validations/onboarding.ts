import { z } from "zod";

const favouriteMovieSchema = z.object({
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
});

const ratingSchema = z.object({
  movieId: z.number().int().positive(),

  rating: z
    .number()
    .min(0.5)
    .max(5)
    .refine(
      (value) => Number.isInteger(value * 2),
      "Rating must use 0.5 increments.",
    ),
});

export const onboardingSchema = z.object({
  favouriteMovies: z
    .array(favouriteMovieSchema)
    .min(
      1,
      "Choose at least one favourite film.",
    )
    .max(
      5,
      "Choose up to five favourite films.",
    ),

  preferredGenreIds: z
    .array(z.number().int().positive())
    .min(
      1,
      "Choose at least one genre.",
    ),

  initialRatings: z
    .array(ratingSchema)
    .max(30),
});

export type OnboardingInput = z.infer<
  typeof onboardingSchema
>;