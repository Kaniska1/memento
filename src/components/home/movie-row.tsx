import {
  ArrowRight,
  Film,
} from "lucide-react";
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
          <div className="flex items-center gap-2">
            <Film className="size-3.5 text-[#9B1738]" />

            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B1738]">
              {eyebrow}
            </p>
          </div>

          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
            {title}
          </h2>
        </div>

        <Link
          href={href}
          className="group flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-3 py-2 text-[11px] text-white/40 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
        >
          View all
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4">
        {movies
          .slice(0, 8)
          .map((movie) => (
            <div
              key={movie.id}
              className="w-[148px] shrink-0 snap-start sm:w-[165px] md:w-[175px] lg:w-[185px]"
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