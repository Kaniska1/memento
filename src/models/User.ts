import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const initialRatingSchema = new Schema(
  {
    movieId: {
      type: Number,
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 0.5,
      max: 5,
      validate: {
        validator(value: number) {
          return Number.isInteger(value * 2);
        },
        message:
          "Rating must be between 0.5 and 5 in increments of 0.5.",
      },
    },
  },
  {
    _id: false,
  },
);

const favouriteMovieSchema = new Schema(
  {
    movieId: {
      type: Number,
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    year: {
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
  },
  {
    _id: false,
  },
);

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_]+$/,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    bio: {
      type: String,
      default: "",
      maxlength: 240,
    },

    avatarUrl: {
      type: String,
      default: null,
    },


    favouriteMovies: {
  type: [favouriteMovieSchema],
  default: [],

  validate: {
    validator(
      movies: Array<{
        movieId: number;
      }>,
    ) {
      return movies.length <= 5;
    },

    message:
      "You may select up to five favourite films.",
  },
},
    
    preferredGenreIds: {
      type: [Number],
      default: [],
    },

    initialRatings: {
      type: [initialRatingSchema],
      default: [],
    },

    onboardingCompleted: {
      type: Boolean,
      default: false,
    },

    settings: {
      streamingProviders: {
        type: [String],
        default: [],
      },

      recommendationStyle: {
        type: String,
        enum: [
          "familiar",
          "balanced",
          "adventurous",
        ],
        default: "balanced",
      },

      hideWatchedFromRecommendations: {
        type: Boolean,
        default: true,
      },

      prioritizeAvailableMovies: {
        type: Boolean,
        default: true,
      },

      includePopularMovies: {
        type: Boolean,
        default: true,
      },

      allowOlderMovies: {
        type: Boolean,
        default: true,
      },

      blurSpoilersByDefault: {
        type: Boolean,
        default: true,
      },

      diaryPrivacy: {
        type: String,
        enum: ["private", "public"],
        default: "private",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.index(
  {
    email: 1,
  },
  {
    unique: true,
  },
);

userSchema.index(
  {
    username: 1,
  },
  {
    unique: true,
  },
);

export type UserDocument = InferSchemaType<
  typeof userSchema
>;

const User =
  (models.User as Model<UserDocument>) ||
  model<UserDocument>("User", userSchema);

export default User;