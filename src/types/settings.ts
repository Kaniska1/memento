export type StreamingProvider =
  | "netflix"
  | "prime-video"
  | "jiohotstar"
  | "sonyliv"
  | "zee5"
  | "mubi"
  | "apple-tv"
  | "youtube";

export type MementoSettings = {
  displayName: string;
  username: string;
  bio: string;

  streamingProviders: StreamingProvider[];

  hideWatchedFromRecommendations: boolean;
  prioritizeAvailableMovies: boolean;
  includePopularMovies: boolean;
  allowOlderMovies: boolean;

  blurSpoilersByDefault: boolean;
  defaultRewatchState: boolean;
  diaryPrivacy: "private" | "public";

  recommendationStyle:
    | "balanced"
    | "familiar"
    | "adventurous";
};

export const defaultSettings: MementoSettings = {
  displayName: "Kaniska Mitra",
  username: "kaniska",
  bio: "Watching films, overthinking endings, and keeping receipts.",

  streamingProviders: [],

  hideWatchedFromRecommendations: true,
  prioritizeAvailableMovies: true,
  includePopularMovies: true,
  allowOlderMovies: true,

  blurSpoilersByDefault: true,
  defaultRewatchState: false,
  diaryPrivacy: "private",

  recommendationStyle: "balanced",
};