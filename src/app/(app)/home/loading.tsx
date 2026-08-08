import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="px-5 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto max-w-[1500px] space-y-10">
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-8 w-72 max-w-full" />
        </div>

        <Skeleton className="h-[420px] rounded-3xl" />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-28 rounded-2xl"
            />
          ))}
        </div>

        <MovieRowSkeleton />
        <MovieRowSkeleton />
      </div>
    </div>
  );
}

function MovieRowSkeleton() {
  return (
    <section>
      <div className="mb-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-7 w-52" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index}>
            <Skeleton className="aspect-[2/3] rounded-2xl" />
            <Skeleton className="mt-3 h-4 w-4/5" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
        ))}
      </div>
    </section>
  );
}