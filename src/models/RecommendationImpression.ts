import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const recommendationImpressionSchema =
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

      /*
       * Position in the recommendation
       * feed when shown.
       *
       * 0 = first recommendation.
       */
      position: {
        type: Number,
        required: true,
        min: 0,
      },

      matchScore: {
        type: Number,
        required: true,
      },

      tmdbRating: {
        type: Number,
        required: true,
      },

      mementoRating: {
        type: Number,
        default: null,
      },

      mementoRatingCount: {
        type: Number,
        default: 0,
      },

      international: {
        type: Boolean,
        default: false,
      },

      obscurityScore: {
        type: Number,
        default: 0,
      },

      /*
       * --------------------------------
       * ML FEATURES
       * --------------------------------
       */

      genreAffinity: {
        type: Number,
        default: 0,
      },

      seededSimilarity: {
        type: Number,
        default: 0,
      },

      qualityScore: {
        type: Number,
        default: 0,
      },

      popularityScore: {
        type: Number,
        default: 0,
      },

      voteStrength: {
        type: Number,
        default: 0,
      },

      sourceFavourite: {
        type: Boolean,
        default: false,
      },

      sourceGenre: {
        type: Boolean,
        default: false,
      },

      sourceInternational: {
        type: Boolean,
        default: false,
      },

      sourceObscure: {
        type: Boolean,
        default: false,
      },

      /*
       * --------------------------------
       * USER CONTEXT
       * --------------------------------
       */

      watchedCount: {
        type: Number,
        default: 0,
      },

      experienceScore: {
        type: Number,
        default: 0,
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
    },
    {
      timestamps: true,
      versionKey: false,
    },
  );

/*
 * The same movie may legitimately
 * appear again during a future
 * recommendation session.
 */
recommendationImpressionSchema.index({
  userId: 1,
  createdAt: -1,
});

recommendationImpressionSchema.index({
  userId: 1,
  movieId: 1,
  createdAt: -1,
});

export type RecommendationImpressionDocument =
  InferSchemaType<
    typeof recommendationImpressionSchema
  >;

const RecommendationImpression =
  (models.RecommendationImpression as Model<RecommendationImpressionDocument>) ||
  model<RecommendationImpressionDocument>(
    "RecommendationImpression",
    recommendationImpressionSchema,
  );

export default RecommendationImpression;