"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageSquareText,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { StarRating } from "@/components/movies/star-rating";
import { SpoilerReview } from "./spoiler-review";

import type { DiaryEntry } from "@/types/diary";

type DiaryEntryCardProps = {
  entry: DiaryEntry;
  showMonth: boolean;
  onDelete: (entryId: string) => void;
  onEdit: (entry: DiaryEntry) => void;
};

function getDateParts(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);

  return {
    month: new Intl.DateTimeFormat("en", {
      month: "short",
    })
      .format(parsedDate)
      .toUpperCase(),

    year: parsedDate.getFullYear(),

    day: new Intl.DateTimeFormat("en", {
      day: "2-digit",
    }).format(parsedDate),
  };
}

export function DiaryEntryCard({
  entry,
  showMonth,
  onDelete,
  onEdit,
}: DiaryEntryCardProps) {
  const { month, year, day } = getDateParts(entry.watchedDate);

  return (
    <article className="group border-b border-white/[0.08]">
      <div className="grid min-h-28 grid-cols-[72px_42px_62px_minmax(180px,1fr)] items-center gap-3 py-4 md:grid-cols-[82px_48px_64px_minmax(220px,1fr)_80px_150px_58px_72px_72px_48px] md:gap-4">
        {/* Month calendar */}
        <div>
          {showMonth && (
            <div className="relative w-16 rounded-xl border border-white/10 bg-[#0A0A0A] px-2 pb-2 pt-4 text-center shadow-lg shadow-black/40">
              <div className="absolute left-3 top-[-5px] h-3 w-1 rounded-full bg-[#6D001A]" />
              <div className="absolute right-3 top-[-5px] h-3 w-1 rounded-full bg-[#6D001A]" />

              <p className="text-lg font-semibold tracking-[0.08em] text-white">
                {month}
              </p>

              <p className="text-[10px] text-white/40">
                {year}
              </p>
            </div>
          )}
        </div>

        {/* Day */}
        <p className="text-2xl font-light text-white/50">
          {day}
        </p>

        {/* Poster */}
        <Link
          href={`/movies/${entry.movieId}`}
          className="relative aspect-[2/3] w-12 overflow-hidden rounded-md border border-white/10 bg-[#0A0A0A]"
        >
          {entry.poster ? (
            <Image
              src={entry.poster}
              alt={`${entry.movieTitle} poster`}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-1 text-center text-[9px] text-white/25">
              No poster
            </div>
          )}
        </Link>

        {/* Film */}
        <div className="min-w-0">
          <Link
            href={`/movies/${entry.movieId}`}
            className="truncate text-base font-semibold text-white transition-colors hover:text-[#9B1738] md:text-lg"
          >
            {entry.movieTitle}
          </Link>

          <div className="mt-2 md:hidden">
            {entry.rating > 0 && (
              <StarRating
                value={entry.rating}
                onChange={() => undefined}
                readonly
                size={15}
              />
            )}
          </div>

          <SpoilerReview
            review={entry.review}
            containsSpoilers={entry.containsSpoilers}
          />
        </div>

        {/* Released */}
        <div className="hidden text-sm text-white/40 md:block">
        {entry.movieYear || "—"}
        </div>

        {/* Rating */}
        <div className="hidden md:block">
          {entry.rating > 0 ? (
            <div className="flex items-center gap-2">
              <StarRating
                value={entry.rating}
                onChange={() => undefined}
                readonly
                size={17}
              />

              <span className="text-xs text-white/35">
                {entry.rating}
              </span>
            </div>
          ) : (
            <span className="text-sm text-white/20">
              —
            </span>
          )}
        </div>

        {/* Like */}
        <div className="hidden justify-center md:flex">
          <Heart
            className={`size-4 ${
              entry.liked
                ? "fill-[#8E1231] text-[#8E1231]"
                : "text-white/20"
            }`}
          />
        </div>

        {/* Rewatch */}
        <div className="hidden justify-center md:flex">
          <RotateCcw
            className={`size-4 ${
              entry.isRewatch
                ? "text-[#9B1738]"
                : "text-white/20"
            }`}
          />
        </div>

        {/* Review */}
        <div className="hidden justify-center md:flex">
          {entry.review ? (
            <div className="flex items-center gap-1.5 text-white/45">
              <MessageSquareText className="size-4" />

              {entry.containsSpoilers && (
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#9B1738]">
                  S
                </span>
              )}
            </div>
          ) : (
            <span className="text-white/20">—</span>
          )}
        </div>

        {/* Edit */}
        <div className="hidden justify-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => onEdit(entry)}
            aria-label={`Edit ${entry.movieTitle}`}
            className="text-white/30 transition-colors hover:text-white"
          >
            <Pencil className="size-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            aria-label={`Delete ${entry.movieTitle}`}
            className="text-white/25 transition-colors hover:text-red-400"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Mobile actions */}
      <div className="flex items-center justify-end gap-4 pb-4 md:hidden">
        {entry.liked && (
          <Heart className="size-4 fill-[#8E1231] text-[#8E1231]" />
        )}

        {entry.isRewatch && (
          <RotateCcw className="size-4 text-[#9B1738]" />
        )}

        <button
          type="button"
          onClick={() => onEdit(entry)}
          className="text-white/35 hover:text-white"
        >
          <Pencil className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          className="text-white/30 hover:text-red-400"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </article>
  );
}