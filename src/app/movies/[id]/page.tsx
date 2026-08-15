import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  ExternalLink,
  Play,
  Star,
} from "lucide-react";

import { MovieActions } from "@/components/movies/movie-actions";
import { MovieCard } from "@/components/movies/movie-card";
import { Button } from "@/components/ui/button";
import { getMovieDetails } from "@/lib/tmdb";

function formatRuntime(runtime: number) {
  if (!runtime) {
    return "Runtime unavailable";
  }

  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;

  return hours > 0
    ? `${hours}h ${minutes}m`
    : `${minutes}m`;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

type MoviePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: MoviePageProps): Promise<Metadata> {
  const { id } = await params;
  const movieId = Number(id);

  if (!Number.isInteger(movieId)) {
    return {
      title: "Movie not found",
    };
  }

  const movie = await getMovieDetails(movieId);

  if (!movie) {
    return {
      title: "Movie not found",
    };
  }

  return {
    title: movie.title,
    description: movie.overview,
  };
}

export default async function MoviePage({
  params,
}: MoviePageProps) {
  const { id } = await params;
  const movieId = Number(id);

  if (!Number.isInteger(movieId) || movieId <= 0) {
    notFound();
  }

  const movie = await getMovieDetails(movieId);

  if (!movie) {
    notFound();
  }

  const providers = [
    ...movie.providers.free,
    ...movie.providers.ads,
    ...movie.providers.subscription,
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Backdrop */}
      <section className="relative min-h-[720px] overflow-hidden">
        {movie.backdrop && (
          <Image
            src={movie.backdrop}
            alt={`${movie.title} backdrop`}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        )}

        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 bg-[#6D001A]/10 mix-blend-color" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/45" />

        <div className="relative z-10 mx-auto max-w-[1500px] px-5 pb-16 pt-10 sm:px-8 lg:px-12 lg:pt-14">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>

          <div className="mt-16 grid items-end gap-10 lg:mt-24 lg:grid-cols-[260px_minmax(0,1fr)_360px] xl:gap-12">
            {/* Poster */}
            <div className="relative mx-auto aspect-[2/3] w-full max-w-[260px] overflow-hidden rounded-3xl border border-white/10 bg-[#090909] shadow-2xl shadow-black/70 lg:mx-0">
              {movie.poster ? (
                <Image
                  src={movie.poster}
                  alt={`${movie.title} poster`}
                  fill
                  className="object-cover"
                  sizes="260px"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-white/30">
                  No poster available
                </div>
              )}
            </div>

            {/* Details */}
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs text-white/65 backdrop-blur-md"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              <h1 className="mt-5 text-5xl font-semibold leading-[0.92] tracking-[-0.055em] text-white md:text-7xl">
                {movie.title}
              </h1>

              {movie.tagline && (
                <p className="mt-4 text-lg italic text-white/50">
                  “{movie.tagline}”
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-white/55">
                <span className="flex items-center gap-2">
                  <CalendarDays className="size-4" />
                  {movie.year}
                </span>

                <span className="flex items-center gap-2">
                  <Clock3 className="size-4" />
                  {formatRuntime(movie.runtime)}
                </span>

                <span className="flex items-center gap-2 text-white">
                  <Star className="size-4 fill-[#8E1231] text-[#8E1231]" />
                  {movie.rating.toFixed(1)}
                </span>

                <span>
                  {formatCount(movie.voteCount)} ratings
                </span>
              </div>

              {movie.overview ? (
                <p className="mt-7 max-w-3xl text-base leading-8 text-white/65">
                  {movie.overview}
                </p>
              ) : (
                <p className="mt-7 max-w-3xl text-base italic leading-8 text-white/35">
                  No synopsis is available for this film yet.
                </p>
              )}

              {movie.director && (
                <div className="mt-7 text-sm">
                  <span className="text-white/35">
                    Directed by
                  </span>{" "}
                  <span className="font-medium text-white">
                    {movie.director}
                  </span>
                </div>
              )}

              {movie.trailerKey && (
                <Button
                  asChild
                  variant="outline"
                  className="mt-7 border-white/15 bg-black/35 text-white backdrop-blur-md hover:bg-white hover:text-black"
                >
                  <a
                    href={`https://www.youtube.com/watch?v=${movie.trailerKey}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Play className="mr-2 size-4 fill-current" />
                    Watch trailer
                  </a>
                </Button>
              )}
            </div>

            <MovieActions
              movieId={movie.id}
              movieTitle={movie.title}
              movieYear={movie.year}
              moviePoster={movie.poster}
              movieGenre={movie.genres[0] || "Film"}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1500px] space-y-20 px-5 pb-24 sm:px-8 lg:px-12">
        {/* Cast */}
        {movie.cast.length > 0 && (
          <section>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B1738]">
              Credits
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              Top cast
            </h2>

            <div className="mt-8 flex snap-x gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {movie.cast.map((member) => (
                <article
                  key={member.id}
                  className="w-[120px] shrink-0 snap-start sm:w-[135px]"
                >
                  <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-[#090909] shadow-[0_12px_30px_rgba(0,0,0,0.16)]">
                    {member.profile ? (
                      <Image
                        src={member.profile}
                        alt={member.name}
                        fill
                        className="object-cover transition duration-300 hover:scale-[1.035]"
                        sizes="140px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-white/25">
                        No photo
                      </div>
                    )}
                  </div>

                  <h3 className="mt-3 truncate text-sm font-medium">
                    {member.name}
                  </h3>

                  <p className="mt-1 truncate text-xs text-white/35">
                    {member.character}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Watch providers */}
        {providers.length > 0 && (
          <section className="rounded-3xl border border-white/10 bg-[#080808] p-7 sm:p-9">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B1738]">
              Availability
            </p>

            <div className="mt-3 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-3xl font-semibold tracking-[-0.04em]">
                  Where to watch
                </h2>

                <p className="mt-3 text-sm text-white/40">
                  Availability shown for India where available.
                </p>
              </div>

              {movie.providers.link && (
                <Button
                  asChild
                  variant="outline"
                  className="border-white/15 bg-white/5 text-white hover:bg-white hover:text-black"
                >
                  <a
                    href={movie.providers.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View providers
                    <ExternalLink className="ml-2 size-4" />
                  </a>
                </Button>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black px-4 py-3 transition hover:border-white/20 hover:bg-white/[0.025]"
                >
                  <Image
                    src={provider.logo}
                    alt={provider.name}
                    width={36}
                    height={36}
                    className="rounded-lg"
                  />

                  <span className="text-sm text-white/70">
                    {provider.name}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs text-white/25">
              Streaming availability data provided by JustWatch.
            </p>
          </section>
        )}

        {/* Recommendations */}
        {movie.recommendations.length > 0 && (
          <section>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B1738]">
              Keep watching
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              You may also like
            </h2>

            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {movie.recommendations.map((recommendation) => (
                <MovieCard
                  key={recommendation.id}
                  id={recommendation.id}
                  title={recommendation.title}
                  year={recommendation.year}
                  rating={recommendation.rating}
                  genre={recommendation.genre}
                  poster={recommendation.poster}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}