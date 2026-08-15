"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

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
      <Link
        href={`/movies/${id}`}
        className="block"
        aria-label={`View ${title}`}
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#080808] shadow-[0_14px_40px_rgba(0,0,0,0.18)] transition duration-300 group-hover:-translate-y-0.5 group-hover:border-white/20 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <Image
            src={poster}
            alt={`${title} poster`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
            sizes="(max-width: 640px) 50vw, 20vw"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />

          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-white/10 bg-black/70 px-2 py-1 backdrop-blur-md">
            <Star className="size-3 fill-[#A51636] text-[#A51636]" />

            <span className="text-[11px] font-medium text-white">
              {rating.toFixed(1)}
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className="truncate text-sm font-medium text-white">
              {title}
            </p>

            <p className="mt-1 truncate text-xs text-white/40">
              {year}
              {genre && ` · ${genre}`}
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}