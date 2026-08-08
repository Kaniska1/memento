import { ArrowRight, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Features } from "@/components/landing/features";

import { Button } from "@/components/ui/button";
import type { TrendingMovie } from "@/lib/tmdb";

type HeroProps = {
  trendingMovie: TrendingMovie | null;
};

const fallbackMovie: TrendingMovie = {
  id: 157336,
  title: "Interstellar",
  year: "2014",
  genre: "Science Fiction",
  rating: "8.5",
  voteCount: 38000,
  popularity: 150,
  overview:
    "A team of explorers travels through a wormhole in space in an attempt to ensure humanity's survival.",
  backdrop:
    "https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
};
function formatCount(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function Hero({ trendingMovie }: HeroProps) {
  const movie = trendingMovie ?? fallbackMovie;

  return (
    <>
      <section className="relative overflow-hidden bg-black px-6 pb-24 pt-10 lg:px-20 lg:pb-32 lg:pt-18">
        <div className="relative mx-auto grid max-w-[1440px] items-center gap-16 lg:grid-cols-[0.95fr_1.05fr]">
          {/* Copy */}
          <div className="relative z-20 max-w-2xl">
            <div className="mb-7 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />

              <span className="text-xs font-medium uppercase tracking-[0.25em] text-white/65">
                Your personal film archive
              </span>
            </div>

            <h1 className="text-[clamp(3.5rem,7vw,7.4rem)] font-semibold leading-[0.9] tracking-[-0.065em] text-white/90">
              Your cinema,
              <br />

              <span
                className="
                  bg-[linear-gradient(180deg,#941D3C_0%,#6D001A_38%,#39000D_72%,#120004_100%)]
                  bg-clip-text
                  text-transparent
                  drop-shadow-[0_6px_20px_rgba(109,0,26,0.22)]
                "
              >
                remembered.
              </span>
            </h1>

            <p className="mt-8 max-w-xl text-base leading-7 text-white/55 sm:text-lg sm:leading-8">
              Discover films worth watching, keep a diary of everything you see,
              and get recommendations that actually understand your taste.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-[#6D001A] px-6 text-white hover:bg-[#850522]"
              >
                <Link href="/signup">
                  Start your diary
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>

            </div>

          {/*
            <div className="mt-14 grid max-w-lg grid-cols-5 align-middle border-t border-white/10 pt-6">
              {[
                ["01", "Discover"],
                ["02", "Watch"],
                ["03", "Log"],
                ["04", "Remember"],
                ["05", "Socialize"],
              ].map(([number, label]) => (
                <div key={number}>
                  <p className="text-xs text-red-400">{number}</p>

                  <p className="mt-1 text-sm font-medium text-white/75">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            */}
          </div>

          {/* Current top trending movie */}
          <div className="relative hidden h-[590px] lg:block">
            {/* Backdrop image */}
            <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl">
              <Image
                src={movie.backdrop}
                alt={`${movie.title} backdrop`}
                fill
                priority
                sizes="75vw"
                className="object-cover object-center"
              />

              {/* Overall darkening */}
              <div className="absolute inset-0 bg-black/30" />

              {/* Burgundy tint */}
              <div className="absolute inset-0 bg-[#6D001A]/10 mix-blend-color" />

              {/* Fade toward heading */}
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent" />

              {/* Top and bottom fades */}
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-black via-black/75 to-transparent" />

              {/* Right fade */}
              <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black/60 to-transparent" />
            </div>

            {/* Strong blend into left side */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[78%] bg-gradient-to-t from-black via-black/80 to-transparent" />

              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[42%] bg-gradient-to-r from-black via-black/70 to-transparent" />
            {/* Movie information */}
            <div className="absolute bottom-10 left-[12%] right-10 z-30 max-w-xl">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#6D001A] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                  #1 trending today
                </span>

                <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/65 backdrop-blur-sm">
                  {formatCount(movie.voteCount)} ratings
                </span>
              </div>

              <h2 className="text-4xl font-semibold tracking-[-0.04em] text-white">
                {movie.title}
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/65">
                <span>{movie.year}</span>

                <span className="size-1 rounded-full bg-white/35" />

                <span>{movie.genre}</span>

                <span className="size-1 rounded-full bg-white/35" />

                <span className="font-medium text-white">
                  {movie.rating}/10
                </span>
              </div>

              <p className="mt-4 line-clamp-3 max-w-md text-sm leading-6 text-white/60">
                {movie.overview}
              </p>
            </div>

              </div>
            </div>
      </section>

      <Features />
      
      <section className="bg-black px-6 pb-24 lg:px-10">
        <div className="mx-auto max-w-300 rounded-3xl border border-white/10 bg-[#090909] px-8 py-14 text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-white/40">
            Your film history starts here
          </p>

          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
            Build a profile around the films that stayed with you.
          </h2>

          <Button
            asChild
            className="mt-8 h-12 rounded-xl bg-[#6D001A] px-6 text-white hover:bg-[#850522]"
          >
            <Link href="/signup">
              Create your profile
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
