import {
  ArrowRight,
  BookOpen,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function DashboardHero() {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_82%_15%,rgba(142,18,49,0.22),transparent_30%),linear-gradient(135deg,#0b0b0b,#060606_65%)] px-6 py-10 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:px-10 sm:py-12 lg:px-12 lg:py-14">
      <div className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full border border-[#6D001A]/20" />
      <div className="pointer-events-none absolute -right-6 -top-14 size-52 rounded-full border border-white/[0.04]" />

      <div className="relative z-10 max-w-3xl">
        <div className="flex items-center gap-2 text-[#B21E44]">
          <Sparkles className="size-4" />

          <p className="text-[10px] font-medium uppercase tracking-[0.22em]">
            Personal cinema discovery
          </p>
        </div>

        <h2 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
          Your own little
          <br />
          <span className="bg-gradient-to-r from-[#C54162] via-[#9B1738] to-[#5B071B] bg-clip-text text-transparent">
            Criterion Closet.
          </span>
        </h2>

        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/45 sm:text-base">
          Recommendations that learn from what you watch, rate, like, save, and
          bring over from Letterboxd — then get sharper as your taste evolves.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            asChild
            className="h-11 bg-[#6D001A] px-5 text-white shadow-[0_8px_28px_rgba(109,0,26,0.22)] hover:bg-[#850522]"
          >
            <Link href="/recommendations">
              See your recommendations
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-11 border-white/10 bg-black/25 px-5 text-white/75 hover:bg-white hover:text-black"
          >
            <Link href="/diary">
              <BookOpen className="mr-2 size-4" />
              Open diary
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}