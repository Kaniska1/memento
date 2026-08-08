"use client";

import Image from "next/image";
import {
  Film,
  Globe2,
  Lock,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import type { MovieList } from "@/types/list";

type ListCardProps = {
  list: MovieList;
  onOpen: (list: MovieList) => void;
  onDelete: (listId: string) => void;
};

export function ListCard({
  list,
  onOpen,
  onDelete,
}: ListCardProps) {
  const previewMovies = list.movies.slice(0, 4);

  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-[#080808] transition-colors hover:border-white/20">
      <button
        type="button"
        onClick={() => onOpen(list)}
        className="block w-full text-left"
      >
        <div className="grid aspect-[16/9] grid-cols-4 overflow-hidden bg-[#0A0A0A]">
          {Array.from({ length: 4 }).map((_, index) => {
            const movie = previewMovies[index];

            return (
              <div
                key={movie?.id ?? `empty-${index}`}
                className="relative border-r border-black last:border-r-0"
              >
                {movie?.poster ? (
                  <Image
                    src={movie.poster}
                    alt={`${movie.title} poster`}
                    fill
                    className="object-cover"
                    sizes="180px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[#0D0D0D] text-white/10">
                    <Film className="size-5" />
                  </div>
                )}
              </div>
            );
          })}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        </div>
      </button>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={() => onOpen(list)}
            className="min-w-0 text-left"
          >
            <h2 className="truncate text-xl font-semibold tracking-[-0.03em] text-white transition-colors group-hover:text-[#A51636]">
              {list.title}
            </h2>

            <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-white/40">
              {list.description || "No description yet."}
            </p>
          </button>

          <button
            type="button"
            className="shrink-0 text-white/25 transition-colors hover:text-white"
            aria-label={`More options for ${list.title}`}
          >
            <MoreHorizontal className="size-5" />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 text-xs text-white/35">
            <span>
              {list.movies.length}{" "}
              {list.movies.length === 1 ? "film" : "films"}
            </span>

            <span className="size-1 rounded-full bg-white/20" />

            <span className="flex items-center gap-1.5">
              {list.isPublic ? (
                <>
                  <Globe2 className="size-3.5" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="size-3.5" />
                  Private
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onOpen(list)}
              className="text-white/30 transition-colors hover:text-white"
              aria-label={`Edit ${list.title}`}
            >
              <Pencil className="size-4" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(list.id)}
              className="text-white/25 transition-colors hover:text-red-400"
              aria-label={`Delete ${list.title}`}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}