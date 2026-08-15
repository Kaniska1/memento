import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const movieInteractionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    movieId: {
      type: Number,
      required: true,
      index: true,
    },

    movieTitle: {
      type: String,
      required: true,
      trim: true,
    },

    movieYear: {
      type: String,
      default: "",
    },

    poster: {
      type: String,
      default: null,
    },

    genre: {
      type: String,
      default: "Film",
    },

    /*
     * Optional discovery metadata.
     *
     * Letterboxd imports resolve through TMDB,
     * so we can preserve a small amount of
     * stable movie metadata that helps build
     * a richer taste profile without turning
     * imported history into fake recommendation
     * impressions.
     */
    originalLanguage: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    tmdbVoteCount: {
      type: Number,
      default: null,
      min: 0,
    },

    tmdbRating: {
      type: Number,
      default: null,
      min: 0,
      max: 10,
    },

    watched: {
      type: Boolean,
      default: false,
    },

    liked: {
      type: Boolean,
      default: false,
    },

    watchlisted: {
      type: Boolean,
      default: false,
    },

    rating: {
      type: Number,
      default: null,
      min: 0.5,
      max: 5,

      validate: {
        validator(value: number | null) {
          if (value === null) {
            return true;
          }

          return Number.isInteger(value * 2);
        },

        message:
          "Rating must use increments of 0.5.",
      },
    },

    lastWatchedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

movieInteractionSchema.index(
  {
    userId: 1,
    movieId: 1,
  },
  {
    unique: true,
  },
);

export type MovieInteractionDocument =
  InferSchemaType<typeof movieInteractionSchema>;

const MovieInteraction =
  (models.MovieInteraction as Model<MovieInteractionDocument>) ||
  model<MovieInteractionDocument>(
    "MovieInteraction",
    movieInteractionSchema,
  );

export default MovieInteraction;