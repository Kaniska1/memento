"use client";

import Image from "next/image";
import Link from "next/link";
import { Film } from "lucide-react";

import { EditFavouritesDialog } from "./edit-favourites-dialog";

import type { ProfileFavouriteMovie } from "@/types/profile";

type FavouriteFilmsProps = {
  movies: ProfileFavouriteMovie[];
  onUpdated: (
    movies: ProfileFavouriteMovie[],
  ) => void;
};

export function FavouriteFilms({
  movies,
  onUpdated,
}: FavouriteFilmsProps) {
  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B1738]">
            The essential five
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">
            Favourite films
          </h2>
        </div>

        <EditFavouritesDialog
          favourites={movies}
          onUpdated={onUpdated}
        />
      </div>

      {movies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#060606] px-6 py-12 text-center">
          <Film className="mx-auto size-5 text-white/20" />

          <p className="mt-3 text-sm text-white/35">
            No favourite films selected yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {movies.slice(0, 5).map((movie) => (
            <Link
              key={movie.movieId}
              href={`/movies/${movie.movieId}`}
              className="group"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-[#080808]">
                {movie.poster ? (
                  <Image
                    src={movie.poster}
                    alt={movie.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 50vw, 20vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-xs text-white/25">
                    {movie.title}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="truncate text-sm font-medium text-white">
                    {movie.title}
                  </p>

                  <p className="mt-1 text-xs text-white/40">
                    {movie.year || "—"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}