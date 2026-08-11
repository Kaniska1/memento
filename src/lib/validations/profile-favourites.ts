import { z } from "zod";

const favouriteMovieSchema = z.object({
  movieId: z
    .number()
    .int()
    .positive(),

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

export const profileFavouritesSchema = z.object({
  movies: z
    .array(favouriteMovieSchema)
    .max(
      5,
      "You may select up to five favourite films.",
    )
    .refine(
      (movies) =>
        new Set(
          movies.map(
            (movie) => movie.movieId,
          ),
        ).size === movies.length,
      "Favourite films must be unique.",
    ),
});