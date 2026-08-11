import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const diaryEntrySchema = new Schema(
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

    watchedDate: {
      type: String,
      required: true,
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

    review: {
      type: String,
      default: "",
      maxlength: 5000,
    },

    containsSpoilers: {
      type: Boolean,
      default: false,
    },

    liked: {
      type: Boolean,
      default: false,
    },

    isRewatch: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

diaryEntrySchema.index({
  userId: 1,
  watchedDate: -1,
});

diaryEntrySchema.index({
  userId: 1,
  movieId: 1,
});

export type DiaryEntryDocument =
  InferSchemaType<typeof diaryEntrySchema>;

const DiaryEntry =
  (models.DiaryEntry as Model<DiaryEntryDocument>) ||
  model<DiaryEntryDocument>(
    "DiaryEntry",
    diaryEntrySchema,
  );

export default DiaryEntry;