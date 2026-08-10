import { z } from "zod";

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
  favouriteMovieIds: z
    .array(z.number().int().positive())
    .length(4, "Choose exactly four favourite films."),

  preferredGenreIds: z
    .array(z.number().int().positive())
    .min(3, "Choose at least three genres."),

  initialRatings: z
    .array(ratingSchema)
    .min(3, "Rate at least three films."),
});

export type OnboardingInput = z.infer<
  typeof onboardingSchema
>;