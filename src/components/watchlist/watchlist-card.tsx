"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BookmarkCheck,
  Eye,
  Heart,
  Star,
  Trash2,
} from "lucide-react";

import type { WatchlistMovie } from "@/types/watchlist";

type WatchlistCardProps = {
  movie: WatchlistMovie;
  onRemove: (movie: WatchlistMovie) => void;
};

export function WatchlistCard({
  movie,
  onRemove,
}: WatchlistCardProps) {
  return (
    <article className="group">
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#090909]">
        <Link href={`/movies/${movie.movieId}`}>
          {movie.poster ? (
            <Image
              src={movie.poster}
              alt={`${movie.title} poster`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 45vw, 220px"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-5 text-center text-sm text-white/30">
              {movie.title}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-70" />
        </Link>

        {movie.rating !== null && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/75 px-2.5 py-1 text-xs text-white backdrop-blur-md">
            <Star className="size-3 fill-[#8E1231] text-[#8E1231]" />
            {movie.rating.toFixed(1)}
          </div>
        )}

        <button
          type="button"
          onClick={() => onRemove(movie)}
          aria-label={`Remove ${movie.title} from watchlist`}
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/75 text-white/60 opacity-0 backdrop-blur-md transition hover:bg-[#6D001A] hover:text-white group-hover:opacity-100"
        >
          <Trash2 className="size-4" />
        </button>

        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {movie.watched && (
            <div className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/75 text-white">
              <Eye className="size-4" />
            </div>
          )}

          {movie.liked && (
            <div className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/75">
              <Heart className="size-4 fill-[#A51636] text-[#A51636]" />
            </div>
          )}

          <div className="flex size-8 items-center justify-center rounded-full bg-[#6D001A] text-white">
            <BookmarkCheck className="size-4" />
          </div>
        </div>
      </div>

      <div className="mt-3">
        <Link
          href={`/movies/${movie.movieId}`}
          className="block truncate text-sm font-medium text-white transition-colors hover:text-[#A51636]"
        >
          {movie.title}
        </Link>

        <p className="mt-1 text-xs text-white/35">
          {movie.year || "—"}
          {movie.genre &&
            movie.genre !== "Film" &&
            ` · ${movie.genre}`}
        </p>
      </div>
    </article>
  );
}