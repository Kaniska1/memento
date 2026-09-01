"use client";

import {
  ArrowRight,
  Film,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { Features } from "@/components/landing/features";
import GridMotion from "@/components/GridMotion";
import { Button } from "@/components/ui/button";
import type { LandingMoviePoster } from "@/lib/landing-movies";

type HeroProps = {
  posters: LandingMoviePoster[];
};

const fallbackItems = [
  "Cinema",
  "Drama",
  "Thriller",
  "Comedy",
  "Sci-Fi",
  "Romance",
  "Fantasy",
  "Mystery",
  "Action",
  "Animation",
  "Horror",
  "Adventure",
  "Crime",
  "Documentary",
];

export function Hero({
  posters,
}: HeroProps) {
  const gridItems =
    posters.length > 0
      ? posters.map((movie) => movie.poster)
      : fallbackItems;

  return (
    <>
      <section className="relative isolate min-h-[calc(100svh-72px)] overflow-hidden bg-black">
        {/* Moving poster wall */}
        <div
          className="
            pointer-events-none
            absolute inset-0
            -z-30
            overflow-hidden
          "
          aria-hidden="true"
        >
          <div
            className="
              absolute
              left-1/2 top-1/2
              h-[118%] w-[118%]
              -translate-x-1/2
              -translate-y-1/2
              rotate-[-3deg]
              scale-110
              opacity-95
            "
          >
            <GridMotion
              items={gridItems}
              gradientColor="#690101"
            />
          </div>
        </div>

        {/* Global vignette */}
        <div
          className="
            pointer-events-none
            absolute inset-0
            -z-20
            bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.15)_52%,rgba(0,0,0,0.82)_100%)]
          "
          aria-hidden="true"
        />

        {/* Strong dark shadow behind the left-side copy */}
        <div
          className="
            pointer-events-none
            absolute inset-y-0 left-0
            -z-10
            w-[70%]
            bg-[linear-gradient(90deg,rgba(0,0,0,0.98)_0%,rgba(0,0,0,0.94)_16%,rgba(0,0,0,0.78)_36%,rgba(0,0,0,0.48)_54%,rgba(0,0,0,0.16)_70%,transparent_100%)]
          "
          aria-hidden="true"
        />

        {/* Localized soft shadow directly beneath the text block */}
        <div
          className="
            pointer-events-none
            absolute
            left-[3%] top-1/2
            -z-10
            h-[560px] w-[760px]
            -translate-y-1/2
            rounded-full
            bg-black/70
            blur-[110px]
          "
          aria-hidden="true"
        />

        {/* Top fade */}
        <div
          className="
            pointer-events-none
            absolute inset-x-0 top-0
            -z-10 h-32
            bg-gradient-to-b
            from-black/70
            to-transparent
          "
          aria-hidden="true"
        />

        {/* Bottom fade */}
        <div
          className="
            pointer-events-none
            absolute inset-x-0 bottom-0
            -z-10 h-[38%]
            bg-gradient-to-t
            from-black
            via-black/50
            to-transparent
          "
          aria-hidden="true"
        />

        {/* Hero copy */}
        <div
          className="
            mx-auto flex
            min-h-[calc(100svh-72px)]
            max-w-[1440px]
            items-start
            px-6
            pb-20
            pt-14
            sm:px-10
            sm:pb-24
            sm:pt-16
            lg:px-16
            lg:pb-24
            lg:pt-20
            xl:px-24
            xl:pt-24
          "
        >
          <div className="relative z-20 max-w-2xl pl-0 lg:pl-2">
            <div
              className="
                mb-7
                inline-flex
                items-center gap-2
                rounded-full
                border border-white/10
                bg-black/45
                px-4 py-2
                text-[10px]
                font-medium
                uppercase
                tracking-[0.24em]
                text-white/65
                backdrop-blur-xl
              "
            >
              <Sparkles className="size-3.5 text-white/70" />
              Your personal film archive
            </div>

            <h1
              className="
                text-[64px]
                font-semibold
                leading-[0.92]
                tracking-[-0.055em]
                text-white
                drop-shadow-[0_8px_34px_rgba(0,0,0,1)]
                sm:text-[64px]
                lg:text-[64px]
              "
            >
              Your cinema,
              <br />
              remembered.
            </h1>

            <p
              className="
                mt-7
                max-w-xl
                text-base
                leading-7
                text-white/72
                drop-shadow-[0_4px_18px_rgba(0,0,0,1)]
                sm:text-lg
                sm:leading-8
              "
            >
              Discover films worth watching, keep a diary of everything you see,
              and get recommendations that actually understand your taste.
            </p>

            <div
              className="
                mt-8 flex
                flex-col
                items-start
                gap-3
                sm:flex-row
                sm:items-center
              "
            >
              <Button
                asChild
                size="lg"
                className="
                  h-12 min-w-44
                  rounded-xl
                  bg-[#6D001A]
                  px-6
                  text-white
                  shadow-[0_14px_45px_rgba(109,0,26,0.35)]
                  hover:bg-[#850522]
                "
              >
                <Link href="/signup">
                  Start your diary
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="
                  h-12 min-w-36
                  rounded-xl
                  border-white/15
                  bg-black/40
                  px-6
                  text-white
                  backdrop-blur-xl
                  hover:bg-white
                  hover:text-black
                "
              >
                <Link href="/login">
                  Sign in
                </Link>
              </Button>
            </div>

            <div
              className="
                mt-7
                flex w-fit
                items-center gap-2
                rounded-full
                border border-white/[0.08]
                bg-black/40
                px-3 py-2
                text-[11px]
                text-white/45
                backdrop-blur-md
              "
            >
              <Film className="size-3.5" />
              Popular films from TMDB, remixed on every visit
            </div>
          </div>
        </div>
      </section>

      <Features />

      <section className="bg-black px-6 pb-24 lg:px-10">
        <div
          className="
            mx-auto max-w-[1200px]
            rounded-3xl
            border border-white/10
            bg-[radial-gradient(circle_at_top,rgba(109,0,26,0.13),transparent_42%),#090909]
            px-8 py-14
            text-center
          "
        >
          <p className="text-xs uppercase tracking-[0.22em] text-white/40">
            Your film history starts here
          </p>

          <h2
            className="
              mx-auto mt-4
              max-w-2xl
              text-3xl
              font-semibold
              tracking-[-0.04em]
              text-white
              md:text-5xl
            "
          >
            Build a profile around the films that stayed with you.
          </h2>

          <Button
            asChild
            className="
              mt-8 h-12
              rounded-xl
              bg-[#6D001A]
              px-6
              text-white
              hover:bg-[#850522]
            "
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
