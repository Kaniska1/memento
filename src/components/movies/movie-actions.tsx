"use client";

import { useEffect, useState } from "react";

import { Bookmark, Heart } from "lucide-react";

import { LogFilmDialog } from "@/components/movies/log-film-dialog";
import { addNotification } from "@/lib/notification-storage";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/movies/star-rating";
import {
  isMovieWatchlisted,
  toggleWatchlist,
} from "@/lib/watchlist-storage";

import {
  isMovieFavourite,
  toggleFavouriteMovie,
} from "@/lib/favourite-storage";

type MovieActionsProps = {
  movieId: number;
  movieTitle: string;
  movieYear: string;
  moviePoster?: string | null;
  movieRating: number;
  movieGenre: string;
};

export function MovieActions({
  movieId,
  movieTitle,
  movieYear,
  moviePoster,
  movieRating,
  movieGenre,
}: MovieActionsProps) {
  const [watchlisted, setWatchlisted] = useState(false);
  const [favourite, setFavourite] = useState(false);
  const [rating, setRating] = useState(0);
  

  useEffect(() => {
  setWatchlisted(isMovieWatchlisted(movieId));
  setFavourite(isMovieFavourite(movieId));
}, [movieId]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/55 p-5 backdrop-blur-xl">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        <LogFilmDialog
          movieId={movieId}
          movieTitle={movieTitle}
          trigger={
            <Button className="bg-[#6D001A] text-white hover:bg-[#850522]">
              Log film
            </Button>
          }
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const nextState = toggleWatchlist({
              id: movieId,
              title: movieTitle,
              year: movieYear,
              poster: moviePoster ?? null,
              rating: movieRating,
              genre: movieGenre,
              addedAt: new Date().toISOString(),
            });

            setWatchlisted(nextState);

            addNotification({
  type: "watchlist",
  title: nextState
    ? "Added to watchlist"
    : "Removed from watchlist",
  message: `${movieTitle} was ${
    nextState ? "added to" : "removed from"
  } your watchlist.`,
  href: "/watchlist",
});
          }}
          className={`border-white/15 text-white ${
            watchlisted
              ? "bg-[#6D001A] hover:bg-[#850522]"
              : "bg-white/5 hover:bg-white hover:text-black"
          }`}
        >
          <Bookmark
            className={`mr-2 size-4 ${
              watchlisted ? "fill-current" : ""
            }`}
          />

          {watchlisted ? "Watchlisted" : "Watchlist"}
        </Button>

        <Button
  type="button"
  variant="outline"
  onClick={() => {
    const nextState = toggleFavouriteMovie({
      id: movieId,
      title: movieTitle,
      year: movieYear,
      poster: moviePoster ?? null,
      rating: movieRating,
      genre: movieGenre,
      addedAt: new Date().toISOString(),
    });

    setFavourite(nextState);
  }}
  className={`border-white/15 text-white ${
    favourite
      ? "bg-[#6D001A] hover:bg-[#850522]"
      : "bg-white/5 hover:bg-white hover:text-black"
  }`}
>
  <Heart
    className={`mr-2 size-4 ${
      favourite
        ? "fill-current"
        : ""
    }`}
  />

  {favourite ? "Favourite" : "Favourite"}
</Button>
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/35">
          Your rating
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <StarRating
            value={rating}
            onChange={setRating}
          />

          <span className="text-sm text-white/40">
            {rating > 0
              ? `${rating} / 5`
              : "Not rated"}
          </span>
        </div>
      </div>

      <p className="mt-4 text-[10px] text-white/20">
        Temporary frontend state for movie #{movieId}. We’ll persist this
        after adding authentication and MongoDB.
      </p>
    </div>
  );
}