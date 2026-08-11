import Image from "next/image";
import Link from "next/link";

import {
  Heart,
  RotateCcw,
  Star,
} from "lucide-react";

import type { DiaryEntry } from "@/types/diary";

type RecentWatchesProps = {
  movies: DiaryEntry[];
};

export function RecentWatches({
  movies,
}: RecentWatchesProps) {
  const recent = movies.slice(0, 5);

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B1738]">
            Recently logged
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">
            Last five watches
          </h2>
        </div>

        <Link
          href="/diary"
          className="text-xs text-white/35 transition hover:text-white"
        >
          View diary
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-[#060606] px-6 py-10 text-center">
          <p className="text-sm text-white/35">
            Nothing logged yet.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {recent.map((entry) => (
            <Link
              key={entry.id}
              href={`/movies/${entry.movieId}`}
              className="group"
            >
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-[#080808]">                {entry.poster ? (
                  <Image
                    src={entry.poster}
                    alt={entry.movieTitle}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-white/25">
                    No poster
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-3">
                  <div className="flex items-center gap-2">
                    {entry.rating !== null && (
                      <span className="flex items-center gap-1 text-xs text-white/70">
                        <Star className="size-3 fill-[#A51636] text-[#A51636]" />
                        {entry.rating.toFixed(1)}
                      </span>
                    )}

                    {entry.liked && (
                      <Heart className="size-3.5 fill-[#A51636] text-[#A51636]" />
                    )}

                    {entry.isRewatch && (
                      <RotateCcw className="size-3.5 text-white/55" />
                    )}
                  </div>

                  <p className="mt-2 truncate text-xs font-medium text-white sm:text-sm">
                        {entry.movieTitle}
                </p>

                  <p className="mt-1 text-xs text-white/40">
                    {new Intl.DateTimeFormat("en-IN", {
                      day: "numeric",
                      month: "short",
                    }).format(
                      new Date(
                        `${entry.watchedDate}T00:00:00`,
                      ),
                    )}
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