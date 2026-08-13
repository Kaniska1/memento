"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Film,
  Globe2,
  Lock,
  Pencil,
  Trash2,
  Users,
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
  const previewMovies =
    list.movies.slice(0, 4);

  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-[#080808] transition-colors hover:border-white/20">
      {/* Preview opens the list page */}
      <Link
        href={`/lists/${list.id}`}
        className="block"
      >
        <div className="relative grid aspect-[16/9] grid-cols-4 overflow-hidden bg-[#0A0A0A]">
          {Array.from({
            length: 4,
          }).map((_, index) => {
            const movie =
              previewMovies[index];

            return (
              <div
                key={`${
                  movie?.movieId ??
                  "empty"
                }-${index}`}
                className="relative border-r border-black last:border-r-0"
              >
                {movie?.poster ? (
                  <Image
                    src={movie.poster}
                    alt={`${movie.title} poster`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
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
      </Link>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Link
              href={`/lists/${list.id}`}
              className="block"
            >
              <h2 className="truncate text-xl font-semibold tracking-[-0.03em] text-white transition-colors group-hover:text-[#A51636]">
                {list.title}
              </h2>

              <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-white/40">
                {list.description ||
                  "No description yet."}
              </p>
            </Link>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/35">
            <span>
              {list.movies.length}{" "}
              {list.movies.length === 1
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

            {list.collaborators.length >
              0 && (
              <>
                <span className="size-1 rounded-full bg-white/20" />

                <span className="flex items-center gap-1.5">
                  <Users className="size-3.5" />

                  {
                    list.collaborators
                      .length
                  }
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Owner + collaborators can edit */}
            <button
              type="button"
              onClick={() =>
                onOpen(list)
              }
              className="text-white/30 transition-colors hover:text-white"
              aria-label={`Edit ${list.title}`}
            >
              <Pencil className="size-4" />
            </button>

            {/* Only owner can delete */}
            {list.isOwner && (
              <button
                type="button"
                onClick={() =>
                  onDelete(list.id)
                }
                className="text-white/25 transition-colors hover:text-red-400"
                aria-label={`Delete ${list.title}`}
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        </div>

        {!list.isOwner && (
          <p className="mt-3 text-[11px] text-white/25">
            Shared with you
          </p>
        )}
      </div>
    </article>
  );
}