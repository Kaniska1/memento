import { Skeleton } from "@/components/ui/skeleton";

export default function MovieLoading() {
  return (
    <div className="min-h-screen bg-black">
      <section className="relative min-h-[720px] overflow-hidden">
        <Skeleton className="absolute inset-0 rounded-none opacity-30" />

        <div className="relative mx-auto max-w-[1500px] px-5 pb-16 pt-14 sm:px-8 lg:px-12">
          <Skeleton className="h-5 w-20" />

          <div className="mt-20 grid items-end gap-10 lg:grid-cols-[260px_minmax(0,1fr)_380px]">
            <Skeleton className="mx-auto aspect-[2/3] w-full max-w-[260px] rounded-3xl lg:mx-0" />

            <div>
              <div className="flex gap-2">
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-16 rounded-full" />
              </div>

              <Skeleton className="mt-6 h-16 w-4/5" />
              <Skeleton className="mt-4 h-6 w-2/5" />

              <div className="mt-6 flex gap-4">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>

              <Skeleton className="mt-8 h-4 w-full" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-3 h-4 w-4/5" />
            </div>

            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1500px] space-y-20 px-5 pb-24 sm:px-8 lg:px-12">
        <section>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-9 w-40" />

          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index}>
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="mt-3 h-4 w-4/5" />
                <Skeleton className="mt-2 h-3 w-3/5" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}