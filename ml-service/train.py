import json
import os

import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import train_test_split

from features import prepare_features


BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "recommendation_dataset.json",
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "model.joblib",
)


def load_dataset():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(
            f"Dataset not found: {DATA_PATH}"
        )

    if os.path.getsize(DATA_PATH) == 0:
        raise ValueError(
            "recommendation_dataset.json is empty."
        )

    with open(
        DATA_PATH,
        "r",
        encoding="utf-8",
    ) as file:
        payload = json.load(file)

    rows = payload.get(
        "rows",
        [],
    )

    if not rows:
        raise ValueError(
            "Dataset contains no rows."
        )

    return pd.DataFrame(rows)


def main():
    df = load_dataset()

    if "label" not in df.columns:
        raise ValueError(
            "Dataset does not contain a label column."
        )

    print(
        f"Dataset rows: {len(df)}"
    )

    print(
        "\nLabel distribution:"
    )

    print(
        df["label"]
        .value_counts()
        .sort_index()
    )

    X = prepare_features(df)

    y = (
        df["label"]
        .astype(float)
        .clip(0, 1)
    )

    if "sampleWeight" in df.columns:
        sample_weights = (
            df["sampleWeight"]
            .fillna(0.2)
            .astype(float)
            .clip(0.01, 1.0)
        )
    else:
        print(
            "\nWARNING: sampleWeight is missing."
        )

        print(
            "Falling back to equal training weights."
        )

        sample_weights = pd.Series(
            np.ones(len(df)),
            index=df.index,
            dtype=float,
        )

    print(
        "\nSample-weight distribution:"
    )

    print(
        sample_weights
        .value_counts()
        .sort_index()
    )

    print(
        "\nFeatures:"
    )

    for feature in X.columns:
        print(
            f"  - {feature}"
        )

    if len(df) < 20:
        print(
            "\nWARNING: Very small dataset."
        )

        print(
            "The model can be tested, "
            "but its recommendations should "
            "not yet be treated as reliable."
        )

    if len(df) < 10:
        raise ValueError(
            "Collect at least 10 "
            "recommendation impressions."
        )

    (
        X_train,
        X_test,
        y_train,
        y_test,
        weights_train,
        weights_test,
    ) = train_test_split(
        X,
        y,
        sample_weights,
        test_size=0.25,
        random_state=42,
    )

    model = RandomForestRegressor(
        n_estimators=300,
        max_depth=6,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )

    model.fit(
        X_train,
        y_train,
        sample_weight=weights_train,
    )

    predictions = model.predict(
        X_test
    )

    # Report both ordinary metrics and
    # confidence-weighted metrics.
    #
    # The weighted values are more useful here
    # because untouched impressions deliberately
    # carry much less confidence than explicit
    # feedback.
    mae = mean_absolute_error(
        y_test,
        predictions,
    )

    weighted_mae = mean_absolute_error(
        y_test,
        predictions,
        sample_weight=weights_test,
    )

    rmse = np.sqrt(
        mean_squared_error(
            y_test,
            predictions,
        )
    )

    weighted_rmse = np.sqrt(
        mean_squared_error(
            y_test,
            predictions,
            sample_weight=weights_test,
        )
    )

    print(
        "\nEvaluation"
    )

    print(
        "----------"
    )

    print(
        f"MAE:           {mae:.4f}"
    )

    print(
        f"Weighted MAE:  {weighted_mae:.4f}"
    )

    print(
        f"RMSE:          {rmse:.4f}"
    )

    print(
        f"Weighted RMSE: {weighted_rmse:.4f}"
    )

    if len(y_test) >= 2:
        r2 = r2_score(
            y_test,
            predictions,
        )

        weighted_r2 = r2_score(
            y_test,
            predictions,
            sample_weight=weights_test,
        )

        print(
            f"R²:            {r2:.4f}"
        )

        print(
            f"Weighted R²:   {weighted_r2:.4f}"
        )

    print(
        "\nFeature importance"
    )

    print(
        "------------------"
    )

    importances = sorted(
        zip(
            X.columns,
            model.feature_importances_,
        ),
        key=lambda item:
            item[1],
        reverse=True,
    )

    for feature, importance in importances:
        print(
            f"{feature:25s} "
            f"{importance:.4f}"
        )

    model_artifact = {
        "model": model,
        "feature_columns": list(
            X.columns
        ),
        "uses_sample_weights": True,
    }

    joblib.dump(
        model_artifact,
        MODEL_PATH,
    )

    print(
        f"\nModel saved to:"
        f"\n{MODEL_PATH}"
    )


if __name__ == "__main__":
    main()