import os
import joblib
import numpy as np
import pandas as pd
import shap


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "..", "models")


# ============================================================
# LOAD TRAINED MODELS
# ============================================================

loan_default_pipeline = joblib.load(
    os.path.join(
        MODELS_DIR,
        "loan_default_model.pkl"
    )
)

loan_amount_pipeline = joblib.load(
    os.path.join(
        MODELS_DIR,
        "loan_amount_model.pkl"
    )
)


# ============================================================
# PIPELINE INFORMATION
# ============================================================

DEFAULT_COLS = (
    loan_default_pipeline
    .named_steps["preprocessor"]
    .feature_names_in_
    .tolist()
)

AMOUNT_COLS = (
    loan_amount_pipeline
    .named_steps["preprocessor"]
    .feature_names_in_
    .tolist()
)


# ============================================================
# SHAP SETUP
# ============================================================

default_preprocessor = (
    loan_default_pipeline
    .named_steps["preprocessor"]
)

default_model = (
    loan_default_pipeline
    .named_steps["model"]
)

shap_explainer = shap.TreeExplainer(
    default_model
)


# ============================================================
# CONSTANTS
# ============================================================

GRADE_MAP = {
    "A": 0,
    "B": 1,
    "C": 2,
    "D": 3,
    "E": 4,
    "F": 5,
    "G": 6
}

EPS = 1e-6

# Your trained/custom decision threshold
APPROVAL_THRESHOLD = 0.4871842861175537


# ============================================================
# EMPLOYMENT LENGTH
# ============================================================

def parse_emp_length(val):

    if val is None:
        return 0

    val = str(val).lower()

    if "10+" in val:
        return 10

    if "< 1" in val:
        return 0

    digits = "".join(
        ch for ch in val
        if ch.isdigit()
    )

    return int(digits) if digits else 0


# ============================================================
# BUILD FEATURE ROW
# ============================================================

def build_feature_row(user_input: dict) -> dict:

    row = {}

    # --------------------------------------------------------
    # Direct user inputs
    # --------------------------------------------------------

    row["term"] = user_input.get(
        "term",
        36
    )

    row["int_rate"] = user_input.get(
        "int_rate",
        12.0
    )

    row["annual_inc"] = user_input.get(
        "annual_inc",
        50000
    )

    row["dti"] = user_input.get(
        "dti",
        15.0
    )

    row["fico_range_low"] = user_input.get(
        "fico_range_low",
        680
    )

    row["fico_range_high"] = user_input.get(
        "fico_range_high",
        700
    )

    row["revol_bal"] = user_input.get(
        "revol_bal",
        5000
    )

    row["revol_util"] = user_input.get(
        "revol_util",
        30.0
    )

    row["open_acc"] = user_input.get(
        "open_acc",
        8
    )

    row["total_acc"] = user_input.get(
        "total_acc",
        15
    )

    row["pub_rec"] = user_input.get(
        "pub_rec",
        0
    )

    row["delinq_2yrs"] = user_input.get(
        "delinq_2yrs",
        0
    )

    row["inq_last_6mths"] = user_input.get(
        "inq_last_6mths",
        0
    )

    row["loan_amnt"] = user_input.get(
        "loan_amnt",
        10000
    )

    row["installment"] = user_input.get(
        "installment",
        row["loan_amnt"] / row["term"]
    )


    # --------------------------------------------------------
    # Encoded fields
    # --------------------------------------------------------

    row["grade"] = GRADE_MAP.get(
        user_input.get(
            "grade",
            "C"
        ),
        2
    )

    row["sub_grade"] = user_input.get(
        "sub_grade_code",
        row["grade"] * 5 + 2
    )

    row["emp_length"] = parse_emp_length(
        user_input.get(
            "emp_length"
        )
    )

    row["initial_list_status"] = user_input.get(
        "initial_list_status",
        0
    )

    row["application_type"] = user_input.get(
        "application_type",
        0
    )


    # --------------------------------------------------------
    # Dates / credit history
    # --------------------------------------------------------

    row["credit_history_length"] = user_input.get(
        "credit_history_length",
        10 * 12
    )

    row["issue_month"] = user_input.get(
        "issue_month",
        8
    )

    row["issue_year"] = user_input.get(
        "issue_year",
        2026
    )


    # --------------------------------------------------------
    # One-hot fields
    # --------------------------------------------------------

    for col in set(DEFAULT_COLS) | set(AMOUNT_COLS):

        if col.startswith(
            (
                "home_ownership_",
                "verification_status_",
                "purpose_"
            )
        ):
            row[col] = 0


    # Home ownership

    home_col = (
        f"home_ownership_"
        f"{user_input.get('home_ownership', 'RENT')}"
    )

    if home_col in row:
        row[home_col] = 1


    # Verification status

    verif_col = (
        f"verification_status_"
        f"{user_input.get('verification_status', 'Not Verified')}"
    )

    if verif_col in row:
        row[verif_col] = 1


    # Purpose

    purpose_col = (
        f"purpose_"
        f"{user_input.get('purpose', 'debt_consolidation')}"
    )

    if purpose_col in row:
        row[purpose_col] = 1


    # --------------------------------------------------------
    # Engineered features
    # --------------------------------------------------------

    row["loan_to_income"] = (
        row["loan_amnt"]
        / (row["annual_inc"] + EPS)
    )

    row["installment_to_income"] = (
        row["installment"]
        / (row["annual_inc"] + EPS)
    )

    row["revol_bal_to_income"] = (
        row["revol_bal"]
        / (row["annual_inc"] + EPS)
    )

    row["credit_per_year"] = (
        row["total_acc"]
        / (row["credit_history_length"] + EPS)
    )

    row["inq_per_year"] = (
        row["inq_last_6mths"]
        / (
            (row["credit_history_length"] / 12)
            + EPS
        )
    )

    row["delinq_per_year"] = (
        row["delinq_2yrs"]
        / (
            (row["credit_history_length"] / 12)
            + EPS
        )
    )

    row["pub_rec_per_year"] = (
        row["pub_rec"]
        / (
            (row["credit_history_length"] / 12)
            + EPS
        )
    )

    row["loan_per_open_acc"] = (
        row["loan_amnt"]
        / (row["open_acc"] + EPS)
    )

    row["revol_per_open_acc"] = (
        row["revol_bal"]
        / (row["open_acc"] + EPS)
    )

    return row


# ============================================================
# BUILD DATAFRAME
# ============================================================

def build_dataframe(
    user_input: dict,
    expected_cols: list
) -> pd.DataFrame:

    row = build_feature_row(
        user_input
    )

    df = pd.DataFrame(
        [row]
    )

    # Fill missing model features with 0
    df = df.reindex(
        columns=expected_cols,
        fill_value=0
    )

    return df


# ============================================================
# GET ORIGINAL FEATURE VALUE
# ============================================================

def get_feature_value(
    default_df: pd.DataFrame,
    clean_name: str
):
    """
    Get the actual value used by the model
    from the original model input dataframe.

    This is important because SHAP feature names
    may contain preprocessing prefixes such as:

        num__dti
        cat__purpose_medical

    Those prefixes are removed before looking
    for the original feature.
    """

    # Direct match
    if clean_name in default_df.columns:

        value = default_df.iloc[0][clean_name]

        # Convert numpy values to normal Python values
        if isinstance(
            value,
            np.generic
        ):
            value = value.item()

        # Handle NaN
        if pd.isna(value):
            return None

        return value


    # Sometimes transformed feature names can
    # still contain additional prefixes.
    possible_name = clean_name.split("__")[-1]

    if possible_name in default_df.columns:

        value = default_df.iloc[0][possible_name]

        if isinstance(
            value,
            np.generic
        ):
            value = value.item()

        if pd.isna(value):
            return None

        return value


    # Feature was not present in the dataframe.
    return None


# ============================================================
# SHAP EXPLANATION
# ============================================================

def explain_default_prediction(
    default_df: pd.DataFrame
) -> list:

    """
    Generate real SHAP explanations
    for the trained XGBoost default model.

    Positive SHAP value:
        pushes the model toward higher
        default risk.

    Negative SHAP value:
        pushes the model toward lower
        default risk.

    The response also contains the actual
    feature value used by the model.
    """

    # --------------------------------------------------------
    # Apply the SAME preprocessing used during training
    # --------------------------------------------------------

    transformed_data = (
        default_preprocessor.transform(
            default_df
        )
    )


    # --------------------------------------------------------
    # Calculate SHAP values
    # --------------------------------------------------------

    shap_values = (
        shap_explainer.shap_values(
            transformed_data
        )
    )


    # --------------------------------------------------------
    # Convert to numpy array
    # --------------------------------------------------------

    shap_values = np.asarray(
        shap_values
    )


    # --------------------------------------------------------
    # Handle possible SHAP output shapes
    # --------------------------------------------------------

    if shap_values.ndim == 3:

        # Binary classification can sometimes
        # produce an extra output dimension.

        shap_values = shap_values[:, :, -1]


    if shap_values.ndim == 2:

        # We only have one prediction

        shap_values = shap_values[0]


    # --------------------------------------------------------
    # Get transformed feature names
    # --------------------------------------------------------

    feature_names = (
        default_preprocessor
        .get_feature_names_out()
    )


    # --------------------------------------------------------
    # Build explanation list
    # --------------------------------------------------------

    explanations = []

    for feature_name, shap_value in zip(
        feature_names,
        shap_values
    ):

        value = float(
            shap_value
        )


        # Ignore extremely tiny contributions

        if abs(value) < 0.001:
            continue


        # ----------------------------------------------------
        # Remove sklearn transformer prefix
        # ----------------------------------------------------

        clean_name = feature_name

        if "__" in clean_name:

            clean_name = clean_name.split(
                "__",
                1
            )[1]


        # ----------------------------------------------------
        # Get ACTUAL feature value
        # ----------------------------------------------------

        feature_value = get_feature_value(
            default_df,
            clean_name
        )


        # ----------------------------------------------------
        # Make value JSON-safe
        # ----------------------------------------------------

        if isinstance(
            feature_value,
            np.generic
        ):
            feature_value = feature_value.item()

        if pd.isna(feature_value):
            feature_value = None


        # ----------------------------------------------------
        # Determine direction
        # ----------------------------------------------------

        if value > 0:

            impact = (
                "increases_default_risk"
            )

        else:

            impact = (
                "decreases_default_risk"
            )


        # ----------------------------------------------------
        # Add explanation
        # ----------------------------------------------------

        explanations.append({

            "feature":
                clean_name,

            "value":
                feature_value,

            "shap_value":
                round(
                    value,
                    6
                ),

            "impact":
                impact
        })


    # --------------------------------------------------------
    # Sort by strongest contribution
    # --------------------------------------------------------

    explanations.sort(
        key=lambda x:
            abs(
                x["shap_value"]
            ),
        reverse=True
    )


    # --------------------------------------------------------
    # Return strongest 7 features
    # --------------------------------------------------------

    return explanations[:7]


# ============================================================
# MAIN PREDICTION FUNCTION
# ============================================================

def predict(
    user_input: dict
) -> dict:

    # --------------------------------------------------------
    # Build model inputs
    # --------------------------------------------------------

    default_df = build_dataframe(
        user_input,
        DEFAULT_COLS
    )

    amount_df = build_dataframe(
        user_input,
        AMOUNT_COLS
    )


    # --------------------------------------------------------
    # DEFAULT MODEL
    # --------------------------------------------------------

    default_proba = (
        loan_default_pipeline
        .predict_proba(
            default_df
        )[0][1]
    )


    # --------------------------------------------------------
    # YOUR CUSTOM APPROVAL THRESHOLD
    # --------------------------------------------------------

    default_pred = int(
        default_proba
        >= APPROVAL_THRESHOLD
    )


    decision = (
        "Rejected"
        if default_pred == 1
        else "Approved"
    )


    # --------------------------------------------------------
    # LOAN AMOUNT MODEL
    # --------------------------------------------------------

    amount_pred_log = (
        loan_amount_pipeline
        .predict(
            amount_df
        )[0]
    )


    amount_pred = np.expm1(
        amount_pred_log
    )


    # --------------------------------------------------------
    # REAL SHAP EXPLANATION
    # --------------------------------------------------------

    xai_factors = (
        explain_default_prediction(
            default_df
        )
    )


    # --------------------------------------------------------
    # FINAL RESPONSE
    # --------------------------------------------------------

    return {

        "default_risk":
            bool(default_pred),

        "default_probability":
            float(default_proba),

        "decision":
            decision,

        "predicted_loan_amount":
            float(amount_pred),

        "xai_factors":
            xai_factors
    }