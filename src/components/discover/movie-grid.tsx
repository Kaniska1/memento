"use client";

import { Film } from "lucide-react";

import { MovieCard } from "@/components/movies/movie-card";

export type DiscoverMovie = {
  id: number;
  title: string;
  overview: string;
  year: string;
  poster: string | null;
  rating: number;
  voteCount: number;
  genre: string;
};

type MovieGridProps = {
  movies: DiscoverMovie[];
};

export function MovieGrid({
  movies,
}: MovieGridProps) {
  if (movies.length === 0) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#060606]">
        <div className="max-w-sm px-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white/5 text-white/25">
            <Film className="size-5" />
          </div>

          <h2 className="mt-5 text-lg font-medium text-white">
            No films found
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/35">
            Try changing your search, year, genre, or minimum
            rating.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {movies.map((movie) =>
        movie.poster ? (
          <MovieCard
            key={movie.id}
            id={movie.id}
            title={movie.title}
            year={movie.year}
            rating={movie.rating}
            genre={movie.genre}
            poster={movie.poster}
          />
        ) : (
          <article key={movie.id}>
            <div className="flex aspect-[2/3] items-center justify-center rounded-2xl border border-white/10 bg-[#090909] px-5 text-center">
              <p className="text-sm text-white/35">
                {movie.title}
              </p>
            </div>

            <h3 className="mt-3 truncate text-sm font-medium text-white">
              {movie.title}
            </h3>

            <p className="mt-1 text-xs text-white/35">
              {movie.year} · {movie.genre}
            </p>
          </article>
        ),
      )}
    </div>
  );
}