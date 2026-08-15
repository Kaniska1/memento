import Image from "next/image";
import Link from "next/link";

import {
  BookOpen,
  Heart,
} from "lucide-react";

import { StarRating } from "@/components/movies/star-rating";

import type { WatchedMovie } from "@/types/watched";

type WatchedMovieCardProps = {
  movie: WatchedMovie;
};

export function WatchedMovieCard({
  movie,
}: WatchedMovieCardProps) {
  return (
    <Link
      href={`/movies/${movie.movieId}`}
      className="group block min-w-0"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#080808] shadow-[0_14px_40px_rgba(0,0,0,0.18)] transition duration-300 group-hover:-translate-y-0.5 group-hover:border-white/20 group-hover:shadow-[0_18px_48px_rgba(0,0,0,0.3)]">
        {movie.poster ? (
          <Image
            src={movie.poster}
            alt={movie.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover transition duration-500 group-hover:scale-[1.035]"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-white/25">
            No poster
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10 opacity-80 transition group-hover:opacity-100" />

        {movie.liked && (
          <div className="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/80 shadow-lg backdrop-blur">
            <Heart className="size-4 fill-[#A51636] text-[#A51636]" />
          </div>
        )}

        {movie.logCount > 0 && (
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/80 px-2.5 py-1 text-[10px] text-white/70 shadow-lg backdrop-blur">
            <BookOpen className="size-3" />

            {movie.logCount}
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="truncate text-sm font-medium text-white transition group-hover:text-[#C42B4F]">
          {movie.title}
        </h3>

        <p className="mt-1 text-xs text-white/30">
          {movie.year || "—"}

          {movie.genre &&
            movie.genre !== "Film" &&
            ` · ${movie.genre}`}
        </p>

        {movie.rating !== null && (
          <div className="mt-2">
            <StarRating
              value={movie.rating}
              onChange={() => undefined}
              readonly
              size={15}
            />
          </div>
        )}
      </div>
    </Link>
  );
}