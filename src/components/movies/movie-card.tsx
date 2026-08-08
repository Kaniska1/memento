"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, Star } from "lucide-react";

type MovieCardProps = {
  id: number;
  title: string;
  year: string;
  rating: number;
  poster: string;
  genre?: string;
};

export function MovieCard({
  id,
  title,
  year,
  rating,
  poster,
  genre,
}: MovieCardProps) {
  return (
    <article className="group min-w-0">
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-card">
        <Link
          href={`/movies/${id}`}
          className="absolute inset-0 block"
          aria-label={`View ${title}`}
        >
          <Image
            src={poster}
            alt={`${title} poster`}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
          />

          {/* Poster shading */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-90" />

          {/* Rating */}
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-white/10 bg-black/70 px-2.5 py-1 backdrop-blur-md">
            <Star className="size-3 fill-[#8A0B29] text-[#8A0B29]" />
            <span className="text-xs font-medium text-white">
              {rating.toFixed(1)}
            </span>
          </div>

          {/* Hover content */}
          <div className="absolute inset-x-0 bottom-0 translate-y-3 p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="text-xs text-white/55">
              {year}
              {genre && ` · ${genre}`}
            </p>
          </div>

          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.08] transition group-hover:ring-[#6D001A]/70" />
        </Link>

        {/* Watchlist */}
        <button
          type="button"
          aria-label={`Add ${title} to watchlist`}
          className="absolute right-3 top-3 z-10 flex size-9 translate-y-[-4px] items-center justify-center rounded-full border border-white/10 bg-black/70 text-white/80 opacity-0 backdrop-blur-md transition-all duration-300 hover:bg-[#6D001A] hover:text-white group-hover:translate-y-0 group-hover:opacity-100"
        >
          <Bookmark className="size-4" />
        </button>
      </div>

      <div className="mt-3">
        <h3 className="truncate text-sm font-medium text-white transition-colors group-hover:text-[#B23A55]">
          {title}
        </h3>

        <p className="mt-1 text-xs text-muted-foreground">
          {year}
          {genre && ` · ${genre}`}
        </p>
      </div>
    </article>
  );
}