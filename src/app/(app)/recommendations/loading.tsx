import { Skeleton } from "@/components/ui/skeleton";

export default function RecommendationsLoading() {
  return (
    <div className="px-5 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto max-w-[1500px]">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="mt-4 h-12 w-80 max-w-full" />
        <Skeleton className="mt-4 h-5 w-[560px] max-w-full" />

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <article
              key={index}
              className="overflow-hidden rounded-3xl border border-white/10 bg-[#080808]"
            >
              <Skeleton className="aspect-[16/10] rounded-none" />

              <div className="p-5">
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="mt-4 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-5/6" />

                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-5">
                  {Array.from({ length: 3 }).map(
                    (_, buttonIndex) => (
                      <Skeleton
                        key={buttonIndex}
                        className="h-16 rounded-xl"
                      />
                    ),
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}