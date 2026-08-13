import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { MovieCard } from "@/components/movies/movie-card";
import type { TrendingMovieCard } from "@/lib/tmdb";

type MovieRowProps = {
  title: string;
  eyebrow: string;
  href: string;
  movies: TrendingMovieCard[];
};

export function MovieRow({
  title,
  eyebrow,
  href,
  movies,
}: MovieRowProps) {
  if (movies.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-5">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B1738]">
            {eyebrow}
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">
            {title}
          </h2>
        </div>

        <Link
          href={href}
          className="group flex items-center gap-2 text-xs text-white/40 transition-colors hover:text-white"
        >
          View all
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {movies.slice(0, 6).map((movie) => (
          <div
            key={movie.id}
            className="w-[150px] shrink-0 sm:w-[165px] md:w-[175px]"
          >
            <MovieCard
              id={movie.id}
              title={movie.title}
              year={movie.year}
              rating={movie.rating}
              genre={movie.genre}
              poster={movie.poster}
            />
          </div>
        ))}
      </div>
    </section>
  );
}