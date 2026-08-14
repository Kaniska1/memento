FEATURE_COLUMNS = [
    "matchScore",
    "tmdbRating",
    "mementoRating",
    "mementoRatingCount",

    "international",

    "watchedCount",
    "experienceScore",

    "genreAffinity",
    "seededSimilarity",

    "qualityScore",
    "popularityScore",
    "voteStrength",

    "sourceFavourite",
    "sourceGenre",
    "sourceInternational",
    "sourceObscure",
]

STYLE_MAP = {
    "familiar": 0,
    "balanced": 1,
    "adventurous": 2,
}


def prepare_features(df):
    """
    Build the exact feature matrix used by
    both training and inference.

    obscurityScore is intentionally excluded
    from the ML model.

    Why:
    - the original obscurity formula was too
      dependent on current TMDB popularity;
    - it dominated the Random Forest;
    - changing the formula would otherwise
      create training/inference distribution
      drift for historical impressions.

    Memento still uses the corrected obscurity
    score for deterministic exploration and
    diversity. The ML model learns from the
    more stable voteStrength/popularityScore
    features separately.

    Post-recommendation outcome fields such as
    liked, watchlisted, opened, markedSeen,
    notInterested, favourite, userRating,
    label, and sampleWeight are also excluded
    to prevent target leakage.
    """
    df = df.copy()

    if "recommendationStyle" in df.columns:
        df["recommendationStyle"] = (
            df["recommendationStyle"]
            .map(STYLE_MAP)
            .fillna(1)
        )
    else:
        df["recommendationStyle"] = 1

    columns = FEATURE_COLUMNS + [
        "recommendationStyle",
    ]

    for column in columns:
        if column not in df.columns:
            df[column] = 0

    for column in columns:
        df[column] = (
            df[column]
            .fillna(0)
            .astype(float)
        )

    return df[columns]