"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Film,
} from "lucide-react";

import type {
  ProfileFavouriteMovie,
} from "@/types/profile";

type FavouriteCardProps = {
  movie: ProfileFavouriteMovie;
};

export function FavouriteCard({
  movie,
}: FavouriteCardProps) {
  return (
    <article className="group">
      <Link
        href={`/movies/${movie.movieId}`}
        className="block"
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#090909]">
          {movie.poster ? (
            <Image
              src={movie.poster}
              alt={`${movie.title} poster`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 45vw, 220px"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-5 text-center">
              <Film className="size-6 text-white/15" />

              <span className="text-sm text-white/30">
                {movie.title}
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70" />

          <div className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-full bg-[#6D001A] text-white shadow-lg">
            <Heart className="size-4 fill-current" />
          </div>
        </div>

        <div className="mt-3">
          <p className="truncate text-sm font-medium text-white transition-colors group-hover:text-[#A51636]">
            {movie.title}
          </p>

          <p className="mt-1 text-xs text-white/35">
            {movie.year}

            {movie.genre
              ? ` · ${movie.genre}`
              : ""}
          </p>
        </div>
      </Link>
    </article>
  );
}