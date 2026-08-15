import hmac
import json
import os
import threading

import joblib
import pandas as pd
from dotenv import load_dotenv

from flask import (
    Flask,
    jsonify,
    request,
)

from features import prepare_features
from train import train_model


load_dotenv()

app = Flask(__name__)

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "model.joblib",
)

DATA_DIR = os.path.join(
    BASE_DIR,
    "data",
)

DATA_PATH = os.path.join(
    DATA_DIR,
    "recommendation_dataset.json",
)

TEMP_DATA_PATH = os.path.join(
    DATA_DIR,
    "recommendation_dataset.next.json",
)

model = None
model_feature_columns = None
uses_sample_weights = False
trained_dataset_rows = None
previous_dataset_rows = None
last_trained_at = None
last_training_trigger = None
model_metrics = None
model_load_error = None

retrain_lock = threading.Lock()

AUTO_RETRAIN_MIN_NEW_ROWS = int(
    os.environ.get(
        "ML_RETRAIN_MIN_NEW_ROWS",
        "50",
    )
)


def load_model():
    global model
    global model_feature_columns
    global uses_sample_weights
    global trained_dataset_rows
    global previous_dataset_rows
    global last_trained_at
    global last_training_trigger
    global model_metrics
    global model_load_error

    model = None
    model_feature_columns = None
    uses_sample_weights = False
    trained_dataset_rows = None
    previous_dataset_rows = None
    last_trained_at = None
    last_training_trigger = None
    model_metrics = None
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

            stored_dataset_rows = artifact.get(
                "dataset_rows"
            )

            if isinstance(
                stored_dataset_rows,
                int,
            ):
                trained_dataset_rows = (
                    stored_dataset_rows
                )

            stored_previous_rows = (
                artifact.get(
                    "previous_dataset_rows"
                )
            )

            if isinstance(
                stored_previous_rows,
                int,
            ):
                previous_dataset_rows = (
                    stored_previous_rows
                )

            stored_trained_at = artifact.get(
                "trained_at"
            )

            if isinstance(
                stored_trained_at,
                str,
            ):
                last_trained_at = (
                    stored_trained_at
                )

            stored_trigger = artifact.get(
                "training_trigger"
            )

            if isinstance(
                stored_trigger,
                str,
            ):
                last_training_trigger = (
                    stored_trigger
                )

            stored_metrics = artifact.get(
                "metrics"
            )

            if isinstance(
                stored_metrics,
                dict,
            ):
                model_metrics = (
                    stored_metrics
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
        trained_dataset_rows = None
        previous_dataset_rows = None
        last_trained_at = None
        last_training_trigger = None
        model_metrics = None

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

        "trainedDatasetRows":
            trained_dataset_rows,

        "previousDatasetRows":
            previous_dataset_rows,

        "lastTrainedAt":
            last_trained_at,

        "lastTrainingTrigger":
            last_training_trigger,

        "metrics":
            model_metrics,

        "autoRetrainMinNewRows":
            AUTO_RETRAIN_MIN_NEW_ROWS,

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


def validate_dataset_payload(
    payload,
):
    if not isinstance(
        payload,
        dict,
    ):
        raise ValueError(
            "Dataset payload must be "
            "a JSON object."
        )

    rows = payload.get(
        "rows",
    )

    if not isinstance(
        rows,
        list,
    ) or not rows:
        raise ValueError(
            "Dataset payload must contain "
            "a non-empty rows array."
        )

    if len(rows) < 10:
        raise ValueError(
            "At least 10 training rows "
            "are required."
        )

    for row in rows:
        if not isinstance(
            row,
            dict,
        ):
            raise ValueError(
                "Every dataset row must "
                "be a JSON object."
            )

        if "label" not in row:
            raise ValueError(
                "Every dataset row must "
                "contain a label."
            )

    return rows


def replace_training_dataset(
    payload,
):
    os.makedirs(
        DATA_DIR,
        exist_ok=True,
    )

    validate_dataset_payload(
        payload
    )

    with open(
        TEMP_DATA_PATH,
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            payload,
            file,
            ensure_ascii=False,
            indent=2,
        )

    # Re-read the exact file that would be
    # promoted so malformed/truncated JSON
    # never replaces the working dataset.
    with open(
        TEMP_DATA_PATH,
        "r",
        encoding="utf-8",
    ) as file:
        validation_payload = json.load(
            file
        )

    validate_dataset_payload(
        validation_payload
    )

    os.replace(
        TEMP_DATA_PATH,
        DATA_PATH,
    )


def is_authorized_retrain_request():
    expected_secret = os.environ.get(
        "ML_RETRAIN_SECRET"
    )

    if not expected_secret:
        return False

    supplied_secret = request.headers.get(
        "X-ML-Retrain-Secret",
        "",
    )

    return hmac.compare_digest(
        supplied_secret,
        expected_secret,
    )


@app.post("/retrain")
def retrain():
    if not is_authorized_retrain_request():
        return jsonify({
            "success": False,
            "message": "Unauthorized.",
        }), 401

    # Prevent two retraining jobs from writing
    # model artifacts at the same time.
    if not retrain_lock.acquire(
        blocking=False
    ):
        return jsonify({
            "success": False,
            "message":
                "A retraining job is "
                "already running.",
        }), 409

    try:
        dataset_payload = (
            request.get_json(
                silent=True
            ) or {}
        )

        rows = validate_dataset_payload(
            dataset_payload
        )

        auto_mode = (
            request.args.get(
                "auto",
                "",
            )
            in {
                "1",
                "true",
                "yes",
            }
        )

        current_dataset_rows = len(
            rows
        )

        new_rows_since_training = (
            current_dataset_rows -
            trained_dataset_rows
            if trained_dataset_rows
            is not None
            else None
        )

        if (
            auto_mode
            and trained_dataset_rows
            is not None
            and new_rows_since_training
            < AUTO_RETRAIN_MIN_NEW_ROWS
        ):
            return jsonify({
                "success": True,
                "skipped": True,

                "message":
                    "Automatic retraining "
                    "threshold has not been "
                    "reached yet.",

                "currentDatasetRows":
                    current_dataset_rows,

                "trainedDatasetRows":
                    trained_dataset_rows,

                "newRowsSinceTraining":
                    new_rows_since_training,

                "requiredNewRows":
                    AUTO_RETRAIN_MIN_NEW_ROWS,
            })

        replace_training_dataset(
            dataset_payload
        )

        training_trigger = (
            "automatic"
            if auto_mode
            else "manual"
        )

        result = train_model(
            trigger=
                training_trigger,

            previous_dataset_rows=
                trained_dataset_rows,
        )

        # train_model() promotes the new artifact
        # only after validating it. Reload only
        # after that succeeds.
        load_model()

        if model is None:
            raise RuntimeError(
                model_load_error
                or "New model could not be loaded."
            )

        return jsonify({
            "success": True,
            "skipped": False,
            "message":
                "Model retrained and reloaded.",

            "newRowsSinceTraining":
                new_rows_since_training,

            "requiredNewRows":
                AUTO_RETRAIN_MIN_NEW_ROWS,

            "training":
                result,

            "dataset": {
                "rows":
                    len(
                        dataset_payload.get(
                            "rows",
                            [],
                        )
                    ),

                "rawCount":
                    dataset_payload.get(
                        "rawCount"
                    ),

                "legacyRemoved":
                    dataset_payload.get(
                        "legacyRemoved"
                    ),

                "removedDuplicates":
                    dataset_payload.get(
                        "removedDuplicates"
                    ),
            },

            "featureCount":
                (
                    len(
                        model_feature_columns
                    )
                    if model_feature_columns
                    is not None
                    else None
                ),

            "lastTrainedAt":
                last_trained_at,

            "lastTrainingTrigger":
                last_training_trigger,

            "trainedDatasetRows":
                trained_dataset_rows,
        })

    except Exception as error:
        print(
            "Retraining failed:",
            error,
        )

        # The previous model.joblib is preserved
        # unless the new artifact fully validated.
        return jsonify({
            "success": False,
            "message":
                "Retraining failed. "
                "The previous model was kept.",

            "error":
                str(error),
        }), 500

    finally:
        retrain_lock.release()


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