"use client";

import {
  useEffect,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";

import {
  Check,
  Copy,
  Globe2,
  ListOrdered,
  LoaderCircle,
  Lock,
  Pencil,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { fetchPublicList } from "@/lib/api/public-list";

import type { PublicMovieList } from "@/types/public-list";

type PublicListClientProps = {
  listId: string;
};

export function PublicListClient({
  listId,
}: PublicListClientProps) {
  const [list, setList] =
    useState<PublicMovieList | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  useEffect(() => {
    async function loadList() {
      try {
        setError("");

        const data =
          await fetchPublicList(
            listId,
          );

        setList(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load this list.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadList();
  }, [listId]);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(
        window.location.href,
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error(
        "Could not copy list link:",
        error,
      );
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <LoaderCircle className="size-7 animate-spin text-[#8E1231]" />
      </div>
    );
  }

  if (error || !list) {
    const isPrivate =
      error
        .toLowerCase()
        .includes("private");

    return (
      <div className="flex min-h-[600px] items-center justify-center px-5">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-white">
            {isPrivate
              ? "This list is private."
              : "This list is unavailable."}
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/40">
            {isPrivate
              ? "Only the owner and invited collaborators can view this list."
              : error ||
                "The list could not be loaded."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto max-w-[1400px]">
        <header>
          {/* Status + actions */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/35">
              <span className="flex items-center gap-1.5">
                {list.isPublic ? (
                  <Globe2 className="size-3.5" />
                ) : (
                  <Lock className="size-3.5" />
                )}

                {list.isPublic
                  ? "Public list"
                  : "Private shared list"}
              </span>

              {list.isRanked && (
                <span className="flex items-center gap-1.5">
                  <ListOrdered className="size-3.5" />
                  Ranked
                </span>
              )}

              {(list.collaborators?.length ??
                0) > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users className="size-3.5" />

                  {
                    list.collaborators
                      .length
                  }{" "}
                  collaborator
                  {list.collaborators
                    .length === 1
                    ? ""
                    : "s"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {list.isPublic && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    handleShare
                  }
                  className="border-white/10 bg-black text-white hover:bg-white/5 hover:text-white"
                >
                  {copied ? (
                    <Check className="mr-2 size-4" />
                  ) : (
                    <Copy className="mr-2 size-4" />
                  )}

                  {copied
                    ? "Copied"
                    : "Share"}
                </Button>
              )}

              {(list.isOwner ||
                list.isCollaborator) && (
                <Button
                  asChild
                  className="bg-[#6D001A] text-white hover:bg-[#850522]"
                >
                  <Link href="/lists">
                    <Pencil className="mr-2 size-4" />
                    Edit list
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
            {list.title}
          </h1>

          {/* Owner + count */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/35">
            <span>
              by{" "}
              <span className="font-medium text-white/60">
                @{
                  list.owner?.username ??
                  "unknown"
                }
              </span>
            </span>

            <span className="size-1 rounded-full bg-white/20" />

            <span>
              {list.movies.length}{" "}
              {list.movies.length === 1
                ? "film"
                : "films"}
            </span>
          </div>

          {list.description && (
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/45">
              {list.description}
            </p>
          )}
        </header>

        {/* Collaborators */}
        {(list.collaborators?.length ??
          0) > 0 && (
          <section className="mt-8 rounded-2xl border border-white/10 bg-[#080808] p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#9B1738]">
              Collaborators
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {(list.collaborators ?? []).map(
                (collaborator) => (
                  <span
                    key={
                      collaborator.userId
                    }
                    className="rounded-full border border-white/10 bg-black px-3 py-1.5 text-xs text-white/50"
                  >
                    @
                    {
                      collaborator.username
                    }
                  </span>
                ),
              )}
            </div>
          </section>
        )}

        {/* Movies */}
        {list.movies.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-white/10 bg-[#060606] px-6 py-16 text-center">
            <p className="text-sm text-white/35">
              This list doesn&apos;t
              contain any films yet.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {list.movies.map(
              (movie, index) => (
                <Link
                  key={movie.movieId}
                  href={`/movies/${movie.movieId}`}
                  className="group"
                >
                  <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-[#080808]">
                    {movie.poster ? (
                      <Image
                        src={
                          movie.poster
                        }
                        alt={`${movie.title} poster`}
                        fill
                        sizes="(max-width: 640px) 50vw, 200px"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-3 text-center text-xs text-white/25">
                        No poster
                      </div>
                    )}

                    {list.isRanked && (
                      <div className="absolute left-2 top-2 flex min-w-8 items-center justify-center rounded-lg border border-white/10 bg-black/85 px-2 py-1 text-sm font-semibold text-[#C72C52] backdrop-blur">
                        {movie.position ??
                          index + 1}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                    <div className="absolute inset-x-0 bottom-0 translate-y-3 p-3 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                      <p className="truncate text-sm font-medium text-white">
                        {movie.title}
                      </p>

                      <p className="mt-1 text-xs text-white/45">
                        {movie.year ||
                          "—"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-2 truncate text-sm text-white/75 transition-colors group-hover:text-white">
                    {movie.title}
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    {movie.year || "—"}
                  </p>
                </Link>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}