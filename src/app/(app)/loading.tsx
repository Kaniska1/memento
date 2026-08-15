import {
  LoaderCircle,
} from "lucide-react";

export default function Loading() {
  return (
    <div className="px-5 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="h-4 w-28 animate-pulse rounded bg-white/[0.05]" />
        <div className="mt-4 h-14 w-72 max-w-full animate-pulse rounded-xl bg-white/[0.05]" />
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({
            length: 10,
          }).map(
            (_, index) => (
              <div
                key={index}
                className="animate-pulse"
              >
                <div className="aspect-[2/3] rounded-2xl border border-white/10 bg-white/[0.04]" />
                <div className="mt-3 h-3 w-3/4 rounded bg-white/[0.06]" />
                <div className="mt-2 h-2.5 w-1/2 rounded bg-white/[0.04]" />
              </div>
            ),
          )}
        </div>

        <div className="sr-only">
          <LoaderCircle className="animate-spin" />
          Loading Memento...
        </div>
      </div>
    </div>
  );
}