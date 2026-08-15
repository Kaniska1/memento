"use client";

import {
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-red-500/15 bg-[radial-gradient(circle_at_top,rgba(127,29,29,0.12),transparent_38%),#070707] p-8 text-center sm:p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 text-red-300">
          <AlertTriangle className="size-6" />
        </div>

        <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.22em] text-red-300/70">
          Something went wrong
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-white">
          Memento lost the reel.
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/40">
          This part of the app could not load. Your library and account data
          have not been changed.
        </p>

        {process.env.NODE_ENV ===
          "development" && (
          <p className="mx-auto mt-4 max-w-md break-words rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-left text-xs text-white/30">
            {error.message}
          </p>
        )}

        <Button
          type="button"
          onClick={reset}
          className="mt-7 bg-[#6D001A] text-white hover:bg-[#850522]"
        >
          <RotateCcw className="mr-2 size-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}