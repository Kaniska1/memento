import Image from "next/image";
import Link from "next/link";

import type { ProfileFavouriteMovie } from "@/types/profile";

type FavouriteFilmsProps = {
  movies: ProfileFavouriteMovie[];
};

export function FavouriteFilms({
  movies,
}: FavouriteFilmsProps) {
  return (
    <section>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B1738]">
          The essential four
        </p>

        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
          Favourite films
        </h2>
      </div>

      {movies.length === 0 ? (
        <div className="mt-7 rounded-2xl border border-dashed border-white/10 bg-[#060606] p-10 text-center">
          <p className="text-sm text-white/35">
            No favourite films selected yet.
          </p>
        </div>
      ) : (
        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {movies.slice(0, 4).map((movie) => (
            <Link
              key={movie.id}
              href={`/movies/${movie.id}`}
              className="group"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#090909]">
                {movie.poster ? (
                  <Image
                    src={movie.poster}
                    alt={`${movie.title} poster`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 45vw, 240px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-5 text-center text-sm text-white/30">
                    {movie.title}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-sm font-semibold text-white">
                    {movie.title}
                  </p>

                  <p className="mt-1 text-xs text-white/40">
                    {movie.year}
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