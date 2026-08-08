const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/original";
const TMDB_POSTER_URL = "https://image.tmdb.org/t/p/w500";

export type TrendingMovie = {
  id: number;
  title: string;
  year: string;
  genre: string;
  rating: string;
  voteCount: number;
  popularity: number;
  overview: string;
  backdrop: string;
};

export type TrendingMovieCard = {
  id: number;
  title: string;
  year: string;
  rating: number;
  genre: string;
  poster: string;
};

type TmdbMovie = {
  id: number;
  title: string;
  release_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  overview: string;
  backdrop_path: string | null;
  poster_path: string | null;
  genre_ids: number[];
};

type TrendingResponse = {
  results: TmdbMovie[];
};

const genreMap: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

export async function getTopTrendingMovie(): Promise<TrendingMovie | null> {
  const accessToken = process.env.TMDB_ACCESS_TOKEN;

  if (!accessToken) {
    console.error("TMDB_ACCESS_TOKEN is missing.");
    return null;
  }

  try {
    const response = await fetch(
      `${TMDB_API_URL}/trending/movie/day?language=en-US`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          accept: "application/json",
        },

        // Refresh the result every hour.
        next: {
          revalidate: 3600,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`TMDB request failed with status ${response.status}`);
    }

    const data = (await response.json()) as TrendingResponse;

    const candidates = data.results
      .filter(
        (movie) =>
          movie.backdrop_path &&
          movie.title &&
          movie.vote_count >= 1000,
      )
      .slice(0, 10);

    const movie =
      candidates.sort(
        (a, b) =>
          b.popularity - a.popularity ||
          b.vote_count - a.vote_count,
      )[0] ??
      data.results.find(
        (result) => result.backdrop_path && result.title,
      );

    if (!movie || !movie.backdrop_path) {
      return null;
    }

    return {
      id: movie.id,
      title: movie.title,
      year: movie.release_date?.slice(0, 4) || "Upcoming",
      genre: genreMap[movie.genre_ids[0]] || "Film",
      rating:
        movie.vote_average > 0 ? movie.vote_average.toFixed(1) : "Not rated",
      voteCount: movie.vote_count,
      popularity: movie.popularity,
      overview:
        movie.overview ||
        "Discover one of the films currently trending around the world.",
      backdrop: `${TMDB_IMAGE_URL}${movie.backdrop_path}`,
    };
  } catch (error) {
    console.error("Could not load the trending movie:", error);
    return null;
  }
}

export async function getTrendingMovies(): Promise<TrendingMovieCard[]> {
  const accessToken = process.env.TMDB_ACCESS_TOKEN;

  if (!accessToken) {
    console.error("TMDB_ACCESS_TOKEN is missing.");
    return [];
  }

  try {
    const response = await fetch(
      `${TMDB_API_URL}/trending/movie/week?language=en-US`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          accept: "application/json",
        },
        next: {
          revalidate: 3600,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`TMDB request failed with status ${response.status}`);
    }

    const data = (await response.json()) as TrendingResponse;

    return data.results
      .filter((movie) => movie.poster_path && movie.title)
      .slice(0, 12)
      .map((movie) => ({
        id: movie.id,
        title: movie.title,
        year: movie.release_date?.slice(0, 4) || "Upcoming",
        rating: movie.vote_average || 0,
        genre: genreMap[movie.genre_ids[0]] || "Film",
        poster: `${TMDB_POSTER_URL}${movie.poster_path}`,
      }));
  } catch (error) {
    console.error("Could not load trending movies:", error);
    return [];
  }
}

export async function getTopRatedMovies(): Promise<TrendingMovieCard[]> {
  const accessToken = process.env.TMDB_ACCESS_TOKEN;

  if (!accessToken) {
    console.error("TMDB_ACCESS_TOKEN is missing.");
    return [];
  }

  try {
    const response = await fetch(
      `${TMDB_API_URL}/movie/top_rated?language=en-US&page=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          accept: "application/json",
        },
        next: {
          revalidate: 86400,
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `TMDB request failed with status ${response.status}`,
      );
    }

    const data = (await response.json()) as TrendingResponse;

    return data.results
      .filter(
        (movie) =>
          movie.poster_path &&
          movie.title &&
          movie.vote_count >= 1000,
      )
      .slice(0, 12)
      .map((movie) => ({
        id: movie.id,
        title: movie.title,
        year: movie.release_date?.slice(0, 4) || "Unknown",
        rating: movie.vote_average || 0,
        genre: genreMap[movie.genre_ids[0]] || "Film",
        poster: `${TMDB_POSTER_URL}${movie.poster_path}`,
      }));
  } catch (error) {
    console.error("Could not load top rated movies:", error);
    return [];
  }
}

export type MovieCastMember = {
  id: number;
  name: string;
  character: string;
  profile: string | null;
};

export type MovieRecommendation = {
  id: number;
  title: string;
  year: string;
  rating: number;
  genre: string;
  poster: string;
};

export type MovieProvider = {
  id: number;
  name: string;
  logo: string;
};

export type MovieDetails = {
  id: number;
  title: string;
  tagline: string;
  overview: string;
  year: string;
  releaseDate: string;
  runtime: number;
  rating: number;
  voteCount: number;
  genres: string[];
  poster: string | null;
  backdrop: string | null;
  trailerKey: string | null;
  director: string;
  cast: MovieCastMember[];
  recommendations: MovieRecommendation[];
  providers: {
    link: string | null;
    free: MovieProvider[];
    ads: MovieProvider[];
    subscription: MovieProvider[];
    rent: MovieProvider[];
    buy: MovieProvider[];
  };
};

type TmdbGenre = {
  id: number;
  name: string;
};

type TmdbCastMember = {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
  order?: number;
};

type TmdbCrewMember = {
  id: number;
  name: string;
  job: string;
};

type TmdbVideo = {
  key: string;
  site: string;
  type: string;
  official: boolean;
};

type TmdbProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string;
};

type TmdbProviderRegion = {
  link?: string;
  flatrate?: TmdbProvider[];
  free?: TmdbProvider[];
  ads?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
};

type TmdbMovieDetailsResponse = {
  id: number;
  title: string;
  tagline?: string;
  overview?: string;
  release_date?: string;
  runtime?: number;
  vote_average: number;
  vote_count: number;
  genres: TmdbGenre[];
  poster_path: string | null;
  backdrop_path: string | null;

  credits?: {
    cast: TmdbCastMember[];
    crew: TmdbCrewMember[];
  };

  videos?: {
    results: TmdbVideo[];
  };

  recommendations?: {
    results: TmdbMovie[];
  };

  "watch/providers"?: {
    results: Record<string, TmdbProviderRegion>;
  };
};

const TMDB_PROFILE_URL = "https://image.tmdb.org/t/p/w300";
const TMDB_PROVIDER_URL = "https://image.tmdb.org/t/p/w92";

function mapProviders(
  providers: TmdbProvider[] | undefined,
): MovieProvider[] {
  if (!providers) {
    return [];
  }

  return providers.map((provider) => ({
    id: provider.provider_id,
    name: provider.provider_name,
    logo: `${TMDB_PROVIDER_URL}${provider.logo_path}`,
  }));
}

export async function getMovieDetails(
  movieId: number,
): Promise<MovieDetails | null> {
  const accessToken = process.env.TMDB_ACCESS_TOKEN;

  if (!accessToken || !Number.isInteger(movieId) || movieId <= 0) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      language: "en-US",
      append_to_response:
        "credits,videos,recommendations,watch/providers",
    });

    const response = await fetch(
      `${TMDB_API_URL}/movie/${movieId}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          accept: "application/json",
        },
        next: {
          revalidate: 21600,
        },
      },
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(
        `TMDB request failed with status ${response.status}`,
      );
    }

    const movie =
      (await response.json()) as TmdbMovieDetailsResponse;

    const director =
      movie.credits?.crew.find(
        (member) => member.job === "Director",
      )?.name || "Unknown";

    const trailer =
      movie.videos?.results.find(
        (video) =>
          video.site === "YouTube" &&
          video.type === "Trailer" &&
          video.official,
      ) ??
      movie.videos?.results.find(
        (video) =>
          video.site === "YouTube" &&
          video.type === "Trailer",
      );

    const cast =
      movie.credits?.cast
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
        .slice(0, 10)
        .map((member) => ({
          id: member.id,
          name: member.name,
          character: member.character || "Unknown role",
          profile: member.profile_path
            ? `${TMDB_PROFILE_URL}${member.profile_path}`
            : null,
        })) ?? [];

    const recommendations =
      movie.recommendations?.results
        .filter(
          (item) =>
            item.poster_path &&
            item.title &&
            item.id !== movie.id,
        )
        .slice(0, 6)
        .map((item) => ({
          id: item.id,
          title: item.title,
          year: item.release_date?.slice(0, 4) || "Upcoming",
          rating: item.vote_average || 0,
          genre: genreMap[item.genre_ids[0]] || "Film",
          poster: `${TMDB_POSTER_URL}${item.poster_path}`,
        })) ?? [];

    const providerResults =
      movie["watch/providers"]?.results ?? {};

    // Change IN if you later add a region setting to the user profile.
    const regionalProviders =
      providerResults.IN ?? providerResults.US;

    return {
      id: movie.id,
      title: movie.title,
      tagline: movie.tagline || "",
      overview:
        movie.overview || "No overview is currently available.",
      year: movie.release_date?.slice(0, 4) || "Upcoming",
      releaseDate: movie.release_date || "",
      runtime: movie.runtime || 0,
      rating: movie.vote_average || 0,
      voteCount: movie.vote_count || 0,
      genres: movie.genres.map((genre) => genre.name),
      poster: movie.poster_path
        ? `${TMDB_POSTER_URL}${movie.poster_path}`
        : null,
      backdrop: movie.backdrop_path
        ? `${TMDB_IMAGE_URL}${movie.backdrop_path}`
        : null,
      trailerKey: trailer?.key || null,
      director,
      cast,
      recommendations,
      providers: {
        link: regionalProviders?.link || null,
        free: mapProviders(regionalProviders?.free),
        ads: mapProviders(regionalProviders?.ads),
        subscription: mapProviders(regionalProviders?.flatrate),
        rent: mapProviders(regionalProviders?.rent),
        buy: mapProviders(regionalProviders?.buy),
      },
    };
  } catch (error) {
    console.error("Could not load movie details:", error);
    return null;
  }
}