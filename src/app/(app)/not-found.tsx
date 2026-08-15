import {
  ArrowLeft,
  Film,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(109,0,26,0.12),transparent_38%),#070707] p-8 text-center sm:p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-[#9B1738]">
          <Film className="size-6" />
        </div>

        <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.22em] text-[#9B1738]">
          404 · Missing frame
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-white">
          This scene isn&apos;t in the cut.
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/40">
          The page may have moved, been removed, or never existed in the first
          place.
        </p>

        <Button
          asChild
          className="mt-7 bg-[#6D001A] text-white hover:bg-[#850522]"
        >
          <Link href="/home">
            <ArrowLeft className="mr-2 size-4" />
            Back to Memento
          </Link>
        </Button>
      </div>
    </div>
  );
}