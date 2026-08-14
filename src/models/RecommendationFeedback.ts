import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const recommendationFeedbackSchema =
  new Schema(
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

      action: {
        type: String,
        enum: [
          "seen",
          "not_interested",
          "opened",
        ],
        required: true,
      },

      matchScore: {
        type: Number,
        default: null,
      },

      watchedCount: {
        type: Number,
        default: null,
      },

      recommendationStyle: {
        type: String,
        enum: [
          "familiar",
          "balanced",
          "adventurous",
        ],
        default: null,
      },

      international: {
        type: Boolean,
        default: false,
      },

      obscurityScore: {
        type: Number,
        default: 0,
      },

      tmdbRating: {
        type: Number,
        default: 0,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    },
  );

recommendationFeedbackSchema.index(
  {
    userId: 1,
    movieId: 1,
    action: 1,
  },
  {
    unique: true,
  },
);

export type RecommendationFeedbackDocument =
  InferSchemaType<
    typeof recommendationFeedbackSchema
  >;

const RecommendationFeedback =
  (models.RecommendationFeedback as Model<RecommendationFeedbackDocument>) ||
  model<RecommendationFeedbackDocument>(
    "RecommendationFeedback",
    recommendationFeedbackSchema,
  );

export default RecommendationFeedback;