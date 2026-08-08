import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function DashboardHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#090909] px-7 py-10 sm:px-10">
      <div className="pointer-events-none absolute right-[-8%] top-[-70%] size-[420px] rounded-full bg-[#6D001A]/25 blur-[120px]" />

      <div className="relative z-10 max-w-2xl">
        <div className="flex items-center gap-2 text-[#9B1738]">
          <Sparkles className="size-4" />

          <p className="text-xs font-medium uppercase tracking-[0.2em]">
            Your taste profile is ready
          </p>
        </div>

        <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.05em] text-white md:text-6xl">
          Welcome to your
          <br />
          <span className="bg-gradient-to-b from-[#A92A49] to-[#43000F] bg-clip-text text-transparent">
            personal cinema.
          </span>
        </h1>

        <p className="mt-5 max-w-xl text-sm leading-7 text-white/45 sm:text-base">
          Your recommendations will become more accurate as you log,
          rate, and save films.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Button
            asChild
            className="h-11 bg-[#6D001A] px-5 text-white hover:bg-[#850522]"
          >
            <Link href="/recommendations">
              See your recommendations
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-11 border-white/15 bg-black/25 px-5 text-white hover:bg-white hover:text-black"
          >
            <Link href="/diary">
              Log a film
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}