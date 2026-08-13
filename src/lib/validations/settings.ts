import { z } from "zod";

const streamingProviderSchema =
  z.enum([
    "netflix",
    "prime-video",
    "jiohotstar",
    "sonyliv",
    "zee5",
    "mubi",
    "apple-tv",
    "youtube",
  ]);

export const updateSettingsSchema =
  z.object({
    streamingProviders:
      z.array(
        streamingProviderSchema,
      ),

    hideWatchedFromRecommendations:
      z.boolean(),

    prioritizeAvailableMovies:
      z.boolean(),

    includePopularMovies:
      z.boolean(),

    allowOlderMovies:
      z.boolean(),

    blurSpoilersByDefault:
      z.boolean(),

    defaultRewatchState:
      z.boolean(),

    diaryPrivacy:
      z.enum([
        "private",
        "public",
      ]),

    recommendationStyle:
      z.enum([
        "balanced",
        "familiar",
        "adventurous",
      ]),
  });