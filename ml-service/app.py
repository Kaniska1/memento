import os

import joblib
import pandas as pd

from flask import (
    Flask,
    jsonify,
    request,
)

from features import prepare_features


app = Flask(__name__)

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "model.joblib",
)

model = None
model_feature_columns = None
uses_sample_weights = False
model_load_error = None


def load_model():
    global model
    global model_feature_columns
    global uses_sample_weights
    global model_load_error

    model = None
    model_feature_columns = None
    uses_sample_weights = False
    model_load_error = None

    if not os.path.exists(
        MODEL_PATH
    ):
        model_load_error = (
            "model.joblib does not exist."
        )
        return

    try:
        artifact = joblib.load(
            MODEL_PATH
        )

        # New model format:
        #
        # {
        #   "model": RandomForestRegressor,
        #   "feature_columns": [...],
        #   "uses_sample_weights": True,
        # }
        #
        # Keep backwards compatibility with
        # the older model.joblib that stored
        # the estimator directly.
        if isinstance(
            artifact,
            dict,
        ):
            loaded_model = artifact.get(
                "model"
            )

            if loaded_model is None:
                raise ValueError(
                    "Model artifact does not "
                    "contain a 'model' entry."
                )

            model = loaded_model

            stored_columns = artifact.get(
                "feature_columns"
            )

            if isinstance(
                stored_columns,
                list,
            ):
                model_feature_columns = [
                    str(column)
                    for column
                    in stored_columns
                ]

            uses_sample_weights = bool(
                artifact.get(
                    "uses_sample_weights",
                    False,
                )
            )
        else:
            # Legacy artifact support.
            model = artifact

        if not hasattr(
            model,
            "predict",
        ):
            raise ValueError(
                "Loaded model does not "
                "support predict()."
            )

    except Exception as error:
        model = None
        model_feature_columns = None
        uses_sample_weights = False

        model_load_error = str(
            error
        )

        print(
            "Could not load ML model:",
            error,
        )


def validate_feature_columns(
    X: pd.DataFrame,
):
    if model_feature_columns is None:
        return X

    actual_columns = list(
        X.columns
    )

    missing_columns = [
        column
        for column
        in model_feature_columns
        if column
        not in actual_columns
    ]

    unexpected_columns = [
        column
        for column
        in actual_columns
        if column
        not in model_feature_columns
    ]

    if missing_columns:
        raise ValueError(
            "Prepared features are missing "
            "columns required by the model: "
            + ", ".join(
                missing_columns
            )
        )

    if unexpected_columns:
        raise ValueError(
            "Prepared features contain "
            "unexpected columns: "
            + ", ".join(
                unexpected_columns
            )
        )

    # Even if the same columns exist, enforce
    # the exact training order before predict.
    return X[
        model_feature_columns
    ]


load_model()


@app.get("/health")
def health():
    return jsonify({
        "success": True,

        "modelLoaded":
            model is not None,

        "usesSampleWeights":
            uses_sample_weights,

        "featureCount":
            (
                len(
                    model_feature_columns
                )
                if model_feature_columns
                is not None
                else None
            ),

        "modelLoadError":
            model_load_error,
    })


@app.post("/rank")
def rank():
    if model is None:
        return jsonify({
            "success": False,

            "message":
                "ML model is not trained "
                "or could not be loaded.",

            "modelLoadError":
                model_load_error,
        }), 503

    payload = (
        request.get_json(
            silent=True
        ) or {}
    )

    candidates = payload.get(
        "candidates",
        [],
    )

    if not isinstance(
        candidates,
        list,
    ) or not candidates:
        return jsonify({
            "success": False,
            "message":
                "Candidates are required.",
        }), 400

    # Reject malformed candidate items early.
    # The ranker expects JSON objects because
    # prepare_features() works with named
    # recommendation features.
    if not all(
        isinstance(
            candidate,
            dict,
        )
        for candidate
        in candidates
    ):
        return jsonify({
            "success": False,
            "message":
                "Every candidate must be "
                "a JSON object.",
        }), 400

    try:
        df = pd.DataFrame(
            candidates
        )

        X = prepare_features(
            df
        )

        X = validate_feature_columns(
            X
        )

        predictions = model.predict(
            X
        )

        ranked = []

        for candidate, score in zip(
            candidates,
            predictions,
        ):
            ranked.append({
                **candidate,

                # Clamp the regressor output
                # to the same 0-1 range used
                # by the training labels.
                "mlScore":
                    float(
                        max(
                            0.0,
                            min(
                                1.0,
                                score,
                            ),
                        )
                    ),
            })

        ranked.sort(
            key=lambda item:
                item["mlScore"],
            reverse=True,
        )

        return jsonify({
            "success": True,

            "count":
                len(ranked),

            "results":
                ranked,
        })

    except Exception as error:
        print(
            "Could not rank candidates:",
            error,
        )

        return jsonify({
            "success": False,

            "message":
                "Could not rank "
                "recommendation candidates.",

            "error":
                str(error),
        }), 500


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8001,
        debug=True,
    )