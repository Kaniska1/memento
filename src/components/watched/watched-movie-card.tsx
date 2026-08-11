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
      className="group block"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-[#080808]">
        {movie.poster ? (
          <Image
            src={movie.poster}
            alt={movie.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover transition duration-300 group-hover:scale-[1.025]"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-white/25">
            No poster
          </div>
        )}

        {movie.liked && (
          <div className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/80 backdrop-blur">
            <Heart className="size-4 fill-[#A51636] text-[#A51636]" />
          </div>
        )}

        {movie.logCount > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/80 px-2.5 py-1 text-[10px] text-white/65 backdrop-blur">
            <BookOpen className="size-3" />

            {movie.logCount}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium text-white transition group-hover:text-[#C42B4F]">
              {movie.title}
            </h3>

            <p className="mt-1 text-xs text-white/30">
              {movie.year || "—"}

              {movie.genre &&
                movie.genre !== "Film" &&
                ` · ${movie.genre}`}
            </p>
          </div>
        </div>

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