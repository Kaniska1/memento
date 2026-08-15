"use client";

import Image from "next/image";

import {
  Film,
  Globe2,
  ListOrdered,
  LoaderCircle,
  Lock,
  Pencil,
  Trash2,
} from "lucide-react";

import type { MovieList } from "@/types/list";

type ListCardProps = {
  list: MovieList;
  onOpen: (
    list: MovieList,
  ) => void;
  onDelete: (
    listId: string,
  ) => void;
  isDeleting?: boolean;
};

export function ListCard({
  list,
  onOpen,
  onDelete,
  isDeleting = false,
}: ListCardProps) {
  const previewMovies =
    list.movies.slice(
      0,
      4,
    );

  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-[#080808] shadow-[0_18px_50px_rgba(0,0,0,0.14)] transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_24px_65px_rgba(0,0,0,0.25)]">
      <button
        type="button"
        onClick={() =>
          onOpen(list)
        }
        className="block w-full text-left"
      >
        <div className="relative grid aspect-[16/9] grid-cols-4 overflow-hidden bg-[#0A0A0A]">
          {Array.from({
            length: 4,
          }).map(
            (
              _,
              index,
            ) => {
              const movie =
                previewMovies[
                  index
                ];

              return (
                <div
                  key={
                    movie?.movieId ??
                    `empty-${index}`
                  }
                  className="relative overflow-hidden border-r border-black last:border-r-0"
                >
                  {movie?.poster ? (
                    <Image
                      src={
                        movie.poster
                      }
                      alt={`${movie.title} poster`}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-[1.035]"
                      sizes="180px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[#0D0D0D] text-white/10">
                      <Film className="size-5" />
                    </div>
                  )}
                </div>
              );
            },
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/5" />

          {list.isRanked && (
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/75 px-2.5 py-1 text-[10px] text-white/70 backdrop-blur">
              <ListOrdered className="size-3" />
              Ranked
            </div>
          )}
        </div>
      </button>

      <div className="p-5">
        <button
          type="button"
          onClick={() =>
            onOpen(list)
          }
          className="block w-full text-left"
        >
          <h2 className="truncate text-xl font-semibold tracking-[-0.035em] text-white transition-colors group-hover:text-[#C42B4F]">
            {list.title}
          </h2>

          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-white/40">
            {list.description ||
              "No description yet."}
          </p>
        </button>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-[11px] text-white/35">
            <span>
              {list.movies.length}{" "}
              {list.movies.length ===
              1
                ? "film"
                : "films"}
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

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() =>
                onOpen(list)
              }
              className="flex size-8 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/[0.05] hover:text-white"
              aria-label={`Edit ${list.title}`}
            >
              <Pencil className="size-4" />
            </button>

            <button
              type="button"
              disabled={
                isDeleting
              }
              onClick={() =>
                onDelete(
                  list.id,
                )
              }
              className="flex size-8 items-center justify-center rounded-lg text-white/25 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-wait disabled:opacity-50"
              aria-label={`Delete ${list.title}`}
            >
              {isDeleting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}