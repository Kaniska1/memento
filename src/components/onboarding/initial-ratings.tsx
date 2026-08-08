"use client";

import Image from "next/image";

import type {
  InitialRating,
  OnboardingMovie,
} from "@/types/onboarding";

import { StarRating } from "@/components/movies/star-rating";



type InitialRatingsProps = {
  movies: OnboardingMovie[];
  ratings: InitialRating[];
  onChange: (ratings: InitialRating[]) => void;
};

export function InitialRatings({
  movies,
  ratings,
  onChange,
}: InitialRatingsProps) {
  function updateRating(movieId: number, rating: number) {
    const existingRating = ratings.some(
      (item) => item.movieId === movieId,
    );

    if (existingRating) {
      onChange(
        ratings.map((item) =>
          item.movieId === movieId
            ? { ...item, rating }
            : item,
        ),
      );

      return;
    }

    onChange([...ratings, { movieId, rating }]);
  }

  return (
    <div>
      <p className="text-sm leading-6 text-white/45">
        Rate films you have already seen. Skip anything unfamiliar—we would
        rather have fewer honest ratings than more random ones.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {movies.map((movie) => {
          const rating = ratings.find(
            (item) => item.movieId === movie.id,
          )?.rating;

          return (
            <article
              key={movie.id}
              className="flex gap-4 rounded-2xl border border-white/10 bg-[#090909] p-3"
            >
              <div className="relative aspect-2/3 w-20 shrink-0 overflow-hidden rounded-xl bg-white/5">
                {movie.poster ? (
                  <Image
                    src={movie.poster}
                    alt={`${movie.title} poster`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center text-xs text-white/25">
                    No poster
                  </div>
                )}
              </div>

              <div className="min-w-0 py-2">
                <h3 className="truncate text-sm font-medium text-white">
                  {movie.title}
                </h3>

                <p className="mt-1 text-xs text-white/35">
                  {movie.year}
                </p>

                <div className="mt-5">
                  <StarRating
                    value={
                      ratings.find(
                        (rating) => rating.movieId === movie.id,
                      )?.rating ?? 0
                    }
                    onChange={(value) => {
                      const existingRating = ratings.find(
                        (rating) => rating.movieId === movie.id,
                      );

                      if (existingRating) {
                        onChange(
                          ratings.map((rating) =>
                            rating.movieId === movie.id
                              ? {
                                  ...rating,
                                  rating: value,
                                }
                              : rating,
                          ),
                        );
                      } else {
                        onChange([
                          ...ratings,
                          {
                            movieId: movie.id,
                            rating: value,
                          },
                        ]);
                      }
                    }}
                  />
                </div>

                {!rating && (
                  <p className="mt-2 text-xs text-white/25">
                    Not watched? Leave it blank.
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}