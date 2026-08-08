import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { MovieCard } from "@/components/movies/movie-card";
import type { TrendingMovieCard } from "@/lib/tmdb";

type TrendingSectionProps = {
  movies: TrendingMovieCard[];
};

export function TrendingSection({ movies }: TrendingSectionProps) {
  if (movies.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-white/10 bg-black px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px w-6 bg-primary" />

              <span className="text-xs font-medium uppercase tracking-[0.24em] text-white/50">
                Popular right now
              </span>
            </div>

            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
              Trending this week
            </h2>
          </div>

          <Link
            href="/discover"
            className="group hidden items-center gap-2 text-sm text-white/50 transition-colors hover:text-white sm:flex"
          >
            View all

            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 lg:gap-5">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              id={movie.id}
              title={movie.title}
              year={movie.year}
              rating={movie.rating}
              genre={movie.genre}
              poster={movie.poster}
            />
          ))}
        </div>
      </div>
    </section>
  );
}