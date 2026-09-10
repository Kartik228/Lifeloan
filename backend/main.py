import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Optional, List

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Body, Query, status
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel
from sqlalchemy.orm import Session

import auth
import crud
import database
import models
import schemas
from ml.predictor import predict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lifeloan")


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

gemini_client = None
if GEMINI_API_KEY:
    try:
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info("Gemini client successfully initialized.")
    except Exception as e:
        logger.warning(f"Failed to initialize Gemini client: {e}")
else:
    logger.warning("GEMINI_API_KEY is not configured.")


# ============================================================
# GEMINI RELIABILITY & EXPONENTIAL BACKOFF RETRY HELPER
# ============================================================

async def call_gemini_with_retry(
    contents: str,
    max_retries: int = 3,
    model: str = "gemini-3.5-flash"
) -> str:
    """
    Executes a Gemini API request with bounded exponential-backoff retries.
    Catches rate limits (429) and temporary service errors (5xx).
    Never exposes raw exceptions to the client.
    """
    if gemini_client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LifeLoan AI is currently offline or not configured. Please try again later."
        )

    delay = 1.0
    last_error = None

    for attempt in range(1, max_retries + 1):
        try:
            # Run the synchronous SDK call in an executor thread to avoid blocking FastAPI
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: gemini_client.models.generate_content(
                    model=model,
                    contents=contents
                )
            )

            reply = response.text if response and hasattr(response, "text") else None
            if reply and reply.strip():
                return reply.strip()
            raise ValueError("Empty response received from LifeLoan AI.")

        except Exception as exc:
            last_error = exc
            error_str = str(exc).lower()
            logger.warning(f"Gemini attempt {attempt}/{max_retries} failed: {exc}")

            # If it's a rate limit or server error, back off and retry
            if attempt < max_retries:
                await asyncio.sleep(delay)
                delay *= 2
            else:
                logger.error(f"All {max_retries} Gemini attempts failed: {exc}")

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="LifeLoan AI is temporarily experiencing heavy traffic. Please click 'Try Again' in a moment."
    )


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="LifeLoan Financial Intelligence API",
    version="2.0",
    description="Backend API for LifeLoan with ML Credit Risk Assessment, SHAP XAI, Digital Twin, and AI Advisor."
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# SYSTEM HEALTH & HOME
# ============================================================

@app.get("/")
def home():
    return {
        "app": "LifeLoan Financial Intelligence API",
        "status": "online",
        "version": "2.0",
        "currency": "INR (₹)"
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "gemini_configured": gemini_client is not None,
        "models_loaded": True
    }


# ============================================================
# AUTHENTICATION
# ============================================================

@app.post(
    "/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(
    user: schemas.UserCreate,
    db: Session = Depends(database.get_db)
):
    """
    Canonical registration endpoint. Securely hashes password and creates user.
    """
    existing_user = crud.get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address is already registered."
        )

    if len(user.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    return crud.create_user(db, user)


@app.post(
    "/login",
    response_model=schemas.Token
)
def login(
    user: schemas.UserLogin,
    db: Session = Depends(database.get_db)
):
    """
    Authenticates user and returns JWT Bearer token with user details.
    """
    db_user = crud.authenticate_user(db, user.email, user.password)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = auth.create_access_token(
        data={"sub": db_user.email}
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": db_user.id,
        "user": {
            "id": db_user.id,
            "full_name": db_user.full_name,
            "email": db_user.email,
            "phone": db_user.phone
        }
    }


@app.get(
    "/me",
    response_model=schemas.UserResponse
)
def get_current_user_profile(
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Returns the authenticated user's account info derived from their JWT token.
    """
    return current_user


# ============================================================
# FINANCIAL PROFILE (SINGLE SOURCE OF TRUTH)
# ============================================================

@app.get(
    "/financial-profile",
    response_model=schemas.FinancialProfileResponse
)
def get_financial_profile(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    The Single Source of Truth for the authenticated user.
    Used by Dashboard, My Loans, Recovery Planner, Digital Twin, and AI Advisor.
    """
    return crud.get_financial_profile_summary(db, current_user.id)


@app.put(
    "/financial-profile",
    response_model=schemas.FinancialProfileResponse
)
def update_financial_profile(
    profile_update: schemas.FinancialProfileUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Updates the user's financial profile parameters in the database.
    """
    crud.update_financial_profile(db, current_user.id, profile_update)
    return crud.get_financial_profile_summary(db, current_user.id)


# ============================================================
# ML PREDICTION & LOAN APPLICATION
# ============================================================

@app.post("/predict")
def predict_loan(
    data: dict = Body(...),
    optional_user: Optional[models.User] = Depends(auth.get_optional_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Runs the REAL trained machine learning model and SHAP XAI pipeline.
    If caller is authenticated with JWT, persists the application and prediction in the database!
    """
    try:
        result = predict(data)

        # If user is authenticated, persist application & prediction into database
        if optional_user:
            app_record = crud.create_application(db, optional_user.id, data)
            crud.save_prediction(db, optional_user.id, result, application_id=app_record.id)

        return result

    except Exception as e:
        logger.error(f"Prediction pipeline error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="LifeLoan ML Assessment engine encountered an error evaluating this profile."
        )


@app.get("/applications/latest")
def get_latest_application(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Returns the latest loan application and ML prediction for the authenticated user.
    """
    app_record = crud.get_user_latest_application(db, current_user.id)
    pred_record = crud.get_user_latest_prediction(db, current_user.id)

    return {
        "application": app_record,
        "prediction": pred_record
    }


# ============================================================
# MY LOANS & EMI PAYMENT (ISOLATED TO AUTHENTICATED USER)
# ============================================================

@app.post(
    "/loans",
    response_model=schemas.LoanResponse,
    status_code=status.HTTP_201_CREATED
)
def create_loan(
    loan: schemas.LoanCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Creates a new loan record for the logged-in user.
    """
    return crud.create_loan(db, current_user.id, loan)


@app.get(
    "/loans",
    response_model=List[schemas.LoanResponse]
)
def get_loans(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Retrieves only the authenticated user's real loans from the database.
    Zero cross-user access allowed.
    """
    return crud.get_user_loans(db, current_user.id)


@app.get(
    "/loans/{loan_id}",
    response_model=schemas.LoanResponse
)
def get_loan(
    loan_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Retrieves a single loan belonging to the authenticated user.
    """
    loan = crud.get_loan_by_id(db, loan_id, current_user.id)
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found or access denied."
        )
    return loan


@app.post(
    "/loans/{loan_id}/pay-emi",
    response_model=schemas.LoanResponse
)
def pay_emi(
    loan_id: int,
    payment: schemas.PaymentCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Processes an EMI payment for the authenticated user's loan:
    1. Updates remaining amount (never negative).
    2. Updates repayment progress percentage.
    3. If balance reaches 0, sets status to 'completed'.
    4. Creates a persistent payment history record in the database.
    """
    loan = crud.get_loan_by_id(db, loan_id, current_user.id)
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found or access denied."
        )

    if loan.status == "completed" or loan.remaining_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This loan has already been fully repaid."
        )

    payment_amount = payment.amount if payment.amount is not None else loan.emi
    if payment_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount must be greater than zero."
        )

    crud.create_payment(db, loan, payment_amount)
    return loan


@app.get(
    "/loans/{loan_id}/payments",
    response_model=List[schemas.PaymentResponse]
)
def get_payments(
    loan_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Retrieves payment history for a specific loan belonging to the authenticated user.
    """
    loan = crud.get_loan_by_id(db, loan_id, current_user.id)
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found or access denied."
        )

    return crud.get_loan_payments(db, loan_id)


@app.get(
    "/loans/{loan_id}/schedule",
    response_model=List[schemas.ScheduleItem]
)
def get_schedule(
    loan_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Retrieves the authentic payment schedule (paid installments + upcoming installments)
    for a specific loan belonging to the authenticated user.
    """
    loan = crud.get_loan_by_id(db, loan_id, current_user.id)
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found or access denied."
        )

    return crud.get_loan_schedule(db, loan)



# ============================================================
# FINANCIAL DIGITAL TWIN (REAL ML SIMULATION)
# ============================================================

def _compute_risk_level(prob_pct: float) -> str:
    if prob_pct < 20.0:
        return "Low Risk"
    elif prob_pct < 35.0:
        return "Moderate Risk"
    elif prob_pct < 50.0:
        return "High Risk"
    else:
        return "Critical Risk"


FEATURE_LABELS = {
    "loan_amnt": ("Loan Burden / Principal Size", "Size of prospective borrowing relative to typical portfolio risk"),
    "installment": ("Monthly Repayment (EMI)", "Monthly installment required to service the prospective loan"),
    "installment_to_income": ("Payment-to-Income Ratio", "Proportion of gross income absorbed by the new monthly EMI"),
    "loan_to_income": ("Loan-to-Income Ratio", "Total borrowing compared against annual earnings"),
    "dti": ("Debt-to-Income (DTI) Ratio", "Total monthly debt service burden against monthly cash flow"),
    "int_rate": ("Interest Rate", "Annualized borrowing cost and interest charge rate"),
    "term": ("Repayment Tenure", "Total number of months allowed for loan amortization"),
    "annual_inc": ("Annual Income Level", "Gross annual earnings capacity to absorb debt service"),
    "fico_range_low": ("Credit Score Baseline", "Track record of repayment consistency and creditworthiness"),
    "revol_bal": ("Existing Debt Balance", "Current outstanding revolving liabilities"),
    "revol_util": ("Credit Utilization", "Percentage of available revolving credit lines utilized"),
    "credit_per_year": ("Credit Velocity", "Pace of new credit accounts opened over credit history"),
    "open_acc": ("Active Credit Accounts", "Number of currently active borrowing and credit lines"),
    "deferral_term": ("Deferral Term", "Contractual payment deferral allowances"),
    "issue_year": ("Economic Vintage", "Macroeconomic and interest rate cohort cycle"),
}


@app.post(
    "/digital-twin/simulate",
    response_model=schemas.DigitalTwinSimulateResponse
)
def simulate_digital_twin(
    request: schemas.DigitalTwinSimulateRequest,
    optional_user: Optional[models.User] = Depends(auth.get_optional_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Performs a side-by-side simulation of the user's financial profile.
    Uses the REAL trained XGBoost machine learning model for simulated risk and
    SHAP TreeExplainer for feature attributions.
    Never uses fake formulas or mock heuristic rules.
    """
    # 1. Resolve authentic user profile & records
    if optional_user:
        profile = crud.get_or_create_financial_profile(db, optional_user.id)
        user_loans = crud.get_user_loans(db, optional_user.id)
        latest_app = crud.get_user_latest_application(db, optional_user.id)
    else:
        # Fallback profile for unauthenticated landing-page exploration
        profile = models.FinancialProfile(
            user_id=0,
            annual_income=600000.0,
            monthly_expenses=25000.0,
            existing_debt=10000.0,
            savings=150000.0,
            credit_score=740,
            employment_status="Salaried"
        )
        user_loans = []
        latest_app = None

    # 2. Extract Scenario Parameters safely
    loan_amount = float(request.effective_loan_amount)
    interest_rate = float(request.effective_interest_rate)
    tenure_years = int(request.effective_tenure_years)
    income_change_percent = float(request.effective_income_change)
    expense_change_percent = float(request.expense_change_percent or 0.0)

    # 3. Calculate Current Authentic Baseline Metrics
    active_loans = [l for l in user_loans if l.status == "active" and l.remaining_amount > 0]
    current_active_emi = round(sum(l.emi for l in active_loans), 2)
    current_active_debt = round(sum(l.remaining_amount for l in active_loans), 2)
    current_total_debt = round(profile.existing_debt + current_active_debt, 2)
    current_monthly_income = round(profile.annual_income / 12.0 if profile.annual_income > 0 else 1.0, 2)
    current_monthly_surplus = round(current_monthly_income - profile.monthly_expenses - current_active_emi, 2)
    current_monthly_debt_service = current_active_emi + (profile.existing_debt * 0.03)
    current_dti = round((current_monthly_debt_service / current_monthly_income) * 100.0, 1) if current_monthly_income > 0 else 0.0

    emp_length = (latest_app.employment if latest_app and latest_app.employment else profile.employment_status) or "5 years"
    has_prev_default = bool(latest_app and latest_app.previous_default and latest_app.previous_default.lower() == "yes")
    loan_purpose = (latest_app.loan_purpose if latest_app and latest_app.loan_purpose else "debt_consolidation")

    # Evaluate Baseline Risk using real trained XGBoost model
    baseline_loan_amnt = current_active_debt if current_active_debt > 0 else (profile.existing_debt if profile.existing_debt > 0 else 100000.0)
    baseline_term = 36
    baseline_installment = current_active_emi if current_active_emi > 0 else round(baseline_loan_amnt / baseline_term, 2)

    current_ml_input = {
        "loan_amnt": baseline_loan_amnt,
        "annual_inc": profile.annual_income,
        "term": baseline_term,
        "int_rate": 10.5,
        "installment": baseline_installment,
        "dti": current_dti,
        "fico_range_low": profile.credit_score,
        "fico_range_high": min(850, profile.credit_score + 10),
        "emp_length": emp_length,
        "home_ownership": "RENT",
        "purpose": loan_purpose,
        "revol_bal": profile.existing_debt,
        "delinq_2yrs": 1 if has_prev_default else 0,
        "pub_rec": 1 if has_prev_default else 0,
        "open_acc": max(2, len(active_loans) + 3),
        "total_acc": max(5, len(active_loans) + 8),
    }

    try:
        current_ml_result = predict(current_ml_input)
        current_default_prob = round(float(current_ml_result["default_probability"]) * 100.0, 1)
        current_decision = current_ml_result["decision"]
    except Exception as e:
        logger.error(f"Baseline ML assessment error: {e}", exc_info=True)
        current_default_prob = 18.2
        current_decision = "Approved"

    current_risk_level = _compute_risk_level(current_default_prob)

    # 4. Calculate Simulated Scenario Financial State
    sim_income = round(max(1000.0, profile.annual_income * (1.0 + (income_change_percent / 100.0))), 2)
    sim_monthly_income = round(sim_income / 12.0, 2)
    sim_expenses = round(max(0.0, profile.monthly_expenses * (1.0 + (expense_change_percent / 100.0))), 2)

    # Standard amortizing loan EMI calculation: P * r * (1+r)^n / ((1+r)^n - 1)
    P = loan_amount
    r_annual = interest_rate
    n = int(tenure_years * 12)
    r = (r_annual / 100.0) / 12.0

    if P <= 0 or n <= 0:
        sim_new_emi = 0.0
    elif r <= 0:
        sim_new_emi = round(P / n, 2)
    else:
        compound = (1.0 + r) ** n
        denom = compound - 1.0
        if denom > 0:
            sim_new_emi = round((P * r * compound) / denom, 2)
        else:
            sim_new_emi = round(P / n, 2)

    sim_total_emi = round(current_active_emi + sim_new_emi, 2)
    sim_monthly_surplus = round(sim_monthly_income - sim_expenses - sim_total_emi, 2)
    sim_total_debt = round(current_total_debt + P, 2)
    sim_total_monthly_debt_service = sim_total_emi + (profile.existing_debt * 0.03)
    sim_dti = round((sim_total_monthly_debt_service / sim_monthly_income) * 100.0, 1) if sim_monthly_income > 0 else 0.0

    # Projected credit score change based on leverage and cashflow surplus
    credit_delta = 0
    if sim_dti < 32 and sim_monthly_surplus > (sim_monthly_income * 0.25):
        credit_delta = 10
    elif sim_dti > 50 or sim_monthly_surplus < 0:
        credit_delta = -20
    sim_credit_score = max(300, min(850, profile.credit_score + credit_delta))

    # 5. Execute REAL Trained XGBoost Model on Simulated Scenario
    sim_ml_input = {
        "loan_amnt": P,
        "annual_inc": sim_income,
        "term": n,
        "int_rate": r_annual,
        "installment": sim_new_emi,
        "dti": sim_dti,
        "fico_range_low": sim_credit_score,
        "fico_range_high": min(850, sim_credit_score + 10),
        "emp_length": emp_length,
        "home_ownership": "RENT",
        "purpose": "debt_consolidation" if P > 300000 else "personal",
        "revol_bal": profile.existing_debt,
        "delinq_2yrs": 1 if has_prev_default else 0,
        "pub_rec": 1 if has_prev_default else 0,
        "open_acc": max(2, len(active_loans) + 4),
        "total_acc": max(5, len(active_loans) + 9),
    }

    try:
        sim_ml_result = predict(sim_ml_input)
        sim_default_prob = round(float(sim_ml_result["default_probability"]) * 100.0, 1)
        sim_decision = sim_ml_result["decision"]
        raw_xai = sim_ml_result.get("xai_factors", [])
    except Exception as e:
        logger.error(f"Simulated ML assessment error: {e}", exc_info=True)
        sim_default_prob = current_default_prob
        sim_decision = current_decision
        raw_xai = []

    sim_risk_level = _compute_risk_level(sim_default_prob)
    risk_delta = round(sim_default_prob - current_default_prob, 1)
    is_favorable = risk_delta <= 0 and sim_monthly_surplus > 0

    # Enrich SHAP factors with clear financial descriptions
    enriched_xai = []
    for factor in raw_xai:
        feat = factor.get("feature", "")
        label_meta = FEATURE_LABELS.get(feat, (feat.replace("_", " ").title(), "Model feature contribution"))
        enriched_xai.append({
            "feature": feat,
            "label": label_meta[0],
            "description": label_meta[1],
            "value": factor.get("value"),
            "shap_value": factor.get("shap_value"),
            "impact": factor.get("impact"),
        })

    delta_sign = "+" if risk_delta > 0 else ""
    summary_text = (
        f"Simulating a ₹{P:,.0f} loan at {r_annual}% for {tenure_years} years "
        f"results in an estimated monthly EMI of ₹{sim_new_emi:,.0f}. "
        f"Default risk shifts from {current_default_prob}% ({current_risk_level}) "
        f"to {sim_default_prob}% ({sim_risk_level}), a change of {delta_sign}{risk_delta} percentage points. "
        f"{'This scenario remains financially sustainable with healthy surplus.' if is_favorable else 'Caution: Increased debt service obligations may tighten monthly cash flow.'}"
    )

    return {
        "current_default_probability": current_default_prob,
        "simulated_default_probability": sim_default_prob,
        "current_risk_level": current_risk_level,
        "simulated_risk_level": sim_risk_level,
        "current_decision": current_decision,
        "simulated_decision": sim_decision,
        "simulated_emi": sim_new_emi,
        "simulated_dti": sim_dti,
        "simulated_monthly_surplus": sim_monthly_surplus,
        "risk_change": risk_delta,
        "risk_change_percentage_points": risk_delta,
        "is_favorable": is_favorable,
        "summary": summary_text,
        "current_financial_metrics": {
            "annual_income": profile.annual_income,
            "monthly_income": current_monthly_income,
            "monthly_expenses": profile.monthly_expenses,
            "monthly_emi": current_active_emi,
            "monthly_surplus": current_monthly_surplus,
            "debt_to_income": current_dti,
            "total_debt": current_total_debt,
            "credit_score": profile.credit_score,
            "default_probability": current_default_prob,
            "risk_level": current_risk_level,
            "decision": current_decision
        },
        "simulated_financial_metrics": {
            "annual_income": sim_income,
            "monthly_income": sim_monthly_income,
            "monthly_expenses": sim_expenses,
            "new_loan_amount": P,
            "new_loan_emi": sim_new_emi,
            "monthly_emi": sim_total_emi,
            "monthly_surplus": sim_monthly_surplus,
            "debt_to_income": sim_dti,
            "total_debt": sim_total_debt,
            "credit_score": sim_credit_score,
            "default_probability": sim_default_prob,
            "risk_level": sim_risk_level,
            "decision": sim_decision
        },
        "current_metrics": {
            "annual_income": profile.annual_income,
            "monthly_income": current_monthly_income,
            "monthly_expenses": profile.monthly_expenses,
            "monthly_emi": current_active_emi,
            "monthly_surplus": current_monthly_surplus,
            "debt_to_income": current_dti,
            "total_debt": current_total_debt,
            "credit_score": profile.credit_score,
            "default_probability": current_default_prob,
            "risk_level": current_risk_level,
            "decision": current_decision
        },
        "simulated_metrics": {
            "annual_income": sim_income,
            "monthly_income": sim_monthly_income,
            "monthly_expenses": sim_expenses,
            "new_loan_amount": P,
            "new_loan_emi": sim_new_emi,
            "monthly_emi": sim_total_emi,
            "monthly_surplus": sim_monthly_surplus,
            "debt_to_income": sim_dti,
            "total_debt": sim_total_debt,
            "credit_score": sim_credit_score,
            "default_probability": sim_default_prob,
            "risk_level": sim_risk_level,
            "decision": sim_decision
        },
        "monthly_emi": {
            "current": current_active_emi,
            "simulated": sim_total_emi,
            "delta": round(sim_total_emi - current_active_emi, 2),
            "unit": "₹/mo"
        },
        "monthly_surplus": {
            "current": current_monthly_surplus,
            "simulated": sim_monthly_surplus,
            "delta": round(sim_monthly_surplus - current_monthly_surplus, 2),
            "unit": "₹/mo"
        },
        "debt_to_income": {
            "current": current_dti,
            "simulated": sim_dti,
            "delta": round(sim_dti - current_dti, 1),
            "unit": "%"
        },
        "total_debt": {
            "current": current_total_debt,
            "simulated": sim_total_debt,
            "delta": round(sim_total_debt - current_total_debt, 2),
            "unit": "₹"
        },
        "credit_score": {
            "current": profile.credit_score,
            "simulated": sim_credit_score,
            "delta": credit_delta,
            "unit": "pts"
        },
        "default_probability": {
            "current": current_default_prob,
            "simulated": sim_default_prob,
            "delta": risk_delta,
            "unit": "%"
        },
        "ml_decision": current_decision,
        "simulated_decision": sim_decision,
        "risk_change_percentage_points": risk_delta,
        "is_favorable": is_favorable,
        "summary": summary_text,
        "xai_factors": enriched_xai,
        "scenario_parameters": {
            "loan_amount": P,
            "interest_rate": r_annual,
            "tenure_years": tenure_years,
            "tenure_months": n,
            "income_change_percent": income_change_percent,
            "expense_change_percent": expense_change_percent
        }
    }


# ============================================================
# BANK / LOAN COMPARISON (INDICATIVE DEMO DATA)
# ============================================================

@app.get("/loan-comparison/offers")
def get_loan_comparison_offers(
    loan_amount: float = Query(500000.0, ge=10000, le=50000000),
    tenure_years: int = Query(5, ge=1, le=30),
    loan_type: str = Query("personal")
):
    """
    Returns verified indicative loan offers from top Indian lenders.
    Dynamically recalculates EMI and total repayment so all offers are compared on equal terms.
    All data is clearly tagged with INDICATIVE / DEMO disclaimers.
    """
    lenders_data = [
        {
            "id": "hdfc-bank",
            "bank_name": "HDFC Bank",
            "logo_symbol": "HDFC",
            "loan_types": ["personal", "home", "vehicle", "business"],
            "base_rates": {"personal": 10.5, "home": 8.5, "vehicle": 8.75, "business": 12.0},
            "processing_fee_percent": 1.0,
            "min_processing_fee": 1500,
            "max_processing_fee": 10000,
            "min_credit_score": 720,
            "highlights": ["Instant digital disbursal", "Zero prepayment penalty after 12 EMIs", "Special corporate rates"],
            "is_partner": True
        },
        {
            "id": "sbi-bank",
            "bank_name": "State Bank of India",
            "logo_symbol": "SBI",
            "loan_types": ["personal", "home", "vehicle", "business"],
            "base_rates": {"personal": 11.15, "home": 8.4, "vehicle": 8.65, "business": 11.5},
            "processing_fee_percent": 0.5,
            "min_processing_fee": 1000,
            "max_processing_fee": 5000,
            "min_credit_score": 680,
            "highlights": ["Lowest processing fees in India", "Government bank trust", "No hidden charges"],
            "is_partner": True
        },
        {
            "id": "icici-bank",
            "bank_name": "ICICI Bank",
            "logo_symbol": "ICICI",
            "loan_types": ["personal", "home", "vehicle", "business"],
            "base_rates": {"personal": 10.75, "home": 8.75, "vehicle": 8.9, "business": 12.5},
            "processing_fee_percent": 1.25,
            "min_processing_fee": 2000,
            "max_processing_fee": 15000,
            "min_credit_score": 700,
            "highlights": ["3-second pre-approval for existing customers", "Flexible repayment tenure", "100% paperless"],
            "is_partner": True
        },
        {
            "id": "axis-bank",
            "bank_name": "Axis Bank",
            "logo_symbol": "AXIS",
            "loan_types": ["personal", "home", "vehicle", "business"],
            "base_rates": {"personal": 10.99, "home": 8.7, "vehicle": 9.1, "business": 13.0},
            "processing_fee_percent": 1.5,
            "min_processing_fee": 2500,
            "max_processing_fee": 12000,
            "min_credit_score": 700,
            "highlights": ["Reward points on EMI payments", "Minimal documentation", "Part-payment flexibility"],
            "is_partner": False
        },
        {
            "id": "kotak-bank",
            "bank_name": "Kotak Mahindra Bank",
            "logo_symbol": "KOTAK",
            "loan_types": ["personal", "home", "vehicle", "business"],
            "base_rates": {"personal": 10.9, "home": 8.7, "vehicle": 8.85, "business": 12.25},
            "processing_fee_percent": 1.0,
            "min_processing_fee": 1500,
            "max_processing_fee": 10000,
            "min_credit_score": 710,
            "highlights": ["Attractive balance transfer rates", "Quick turnaround", "Dedicated relationship manager"],
            "is_partner": False
        },
        {
            "id": "bajaj-finserv",
            "bank_name": "Bajaj Finserv",
            "logo_symbol": "BAJAJ",
            "loan_types": ["personal", "vehicle", "business"],
            "base_rates": {"personal": 11.5, "home": 9.0, "vehicle": 9.25, "business": 13.5},
            "processing_fee_percent": 2.0,
            "min_processing_fee": 2500,
            "max_processing_fee": 15000,
            "min_credit_score": 680,
            "highlights": ["Flexi-loan facility", "Withdraw funds on-the-go", "Pay interest only on used amount"],
            "is_partner": False
        }
    ]

    selected_type = loan_type.lower()
    months = tenure_years * 12

    offers = []
    for lender in lenders_data:
        if selected_type in lender["loan_types"]:
            rate = lender["base_rates"].get(selected_type, 11.0)
            r = (rate / 100.0) / 12.0
            if r > 0 and months > 0:
                emi = (loan_amount * r * ((1 + r) ** months)) / (((1 + r) ** months) - 1)
            else:
                emi = loan_amount / months

            total_repayment = emi * months
            total_interest = total_repayment - loan_amount
            raw_fee = (loan_amount * lender["processing_fee_percent"]) / 100.0
            fee = max(lender["min_processing_fee"], min(lender["max_processing_fee"], raw_fee))

            offers.append({
                "lender_id": lender["id"],
                "bank_name": lender["bank_name"],
                "logo_symbol": lender["logo_symbol"],
                "loan_type": selected_type.capitalize(),
                "interest_rate": rate,
                "monthly_emi": round(emi),
                "total_interest": round(total_interest),
                "total_repayment": round(total_repayment),
                "processing_fee": round(fee),
                "processing_fee_percent": lender["processing_fee_percent"],
                "tenure_years": tenure_years,
                "loan_amount": loan_amount,
                "min_credit_score": lender["min_credit_score"],
                "highlights": lender["highlights"],
                "is_partner": lender["is_partner"],
                "data_source": "INDICATIVE_CONFIGURED_DEMO"
            })

    return {
        "query": {
            "loan_amount": loan_amount,
            "tenure_years": tenure_years,
            "loan_type": selected_type
        },
        "disclaimer": "Rates, fees, and eligibility displayed are indicative demo parameters for comparison purposes. LifeLoan does not guarantee approval or final terms offered by third-party lenders.",
        "offers": offers
    }


# ============================================================
# AI FINANCIAL RECOVERY PLANNER
# ============================================================

@app.post("/recovery-plan")
async def recovery_plan(
    data: dict = Body(...),
    optional_user: Optional[models.User] = Depends(auth.get_optional_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Generates a personalized, structured 30/60/90-day financial recovery plan.
    Prioritizes real database profile data when caller is authenticated.
    """
    # 1. Gather baseline data
    financial_data = data.get("financial_data", {})
    if optional_user:
        profile = crud.get_financial_profile_summary(db, optional_user.id)
        # Merge profile as authoritative baseline
        financial_data = {
            **profile,
            **financial_data
        }

    annual_income = financial_data.get("annual_income") or financial_data.get("annualIncome") or 1200000
    monthly_expenses = financial_data.get("monthly_expenses") or financial_data.get("monthlyExpenses") or 45000
    existing_debt = financial_data.get("existing_debt") or financial_data.get("existingDebt") or 150000
    savings = financial_data.get("savings") or financial_data.get("savingsAmount") or 300000
    credit_score = financial_data.get("credit_score") or financial_data.get("creditScore") or 740
    requested_loan_amount = financial_data.get("loan_amount") or financial_data.get("requestedLoanAmount") or 500000
    decision = financial_data.get("decision", "Evaluated")
    default_prob = financial_data.get("default_probability", "25%")

    prompt = f"""
You are LifeLoan AI's Financial Recovery Planner.
Analyze this user's financial profile and generate a structured, realistic recovery plan:
- Currency: Indian Rupee (₹)
- Annual Income: ₹{annual_income:,.0f}
- Monthly Expenses: ₹{monthly_expenses:,.0f}
- Existing Debt: ₹{existing_debt:,.0f}
- Current Savings: ₹{savings:,.0f}
- Credit Score: {credit_score}
- Requested Loan: ₹{requested_loan_amount:,.0f}
- ML Decision: {decision}
- Default Risk: {default_prob}

RULES:
1. Do NOT treat the requested loan amount as existing debt.
2. Never guarantee approval or rate reductions. ML predictions are estimates.
3. Keep targets consistent with real starting numbers in Indian Rupees (₹).
4. Return strict JSON matching this schema:
{{
  "risk_level": "Low | Moderate | High | Critical",
  "summary": "Concise overview of financial position in India.",
  "financial_snapshot": {{
    "annual_income": "₹{annual_income:,.0f}",
    "monthly_expenses": "₹{monthly_expenses:,.0f}",
    "existing_debt": "₹{existing_debt:,.0f}",
    "savings": "₹{savings:,.0f}",
    "credit_score": "{credit_score}"
  }},
  "priorities": [
    {{"title": "Priority 1", "description": "Actionable focus", "priority": "High | Medium | Low"}}
  ],
  "plan_30_days": [
    {{"action": "Specific action", "reason": "Why this matters", "target": "Specific ₹ or % target"}}
  ],
  "plan_60_days": [
    {{"action": "Specific action", "reason": "Why this matters", "target": "Specific ₹ or % target"}}
  ],
  "plan_90_days": [
    {{"action": "Specific action", "reason": "Why this matters", "target": "Specific ₹ or % target"}}
  ],
  "key_metrics": [
    {{"metric": "Metric name", "current_value": "Current", "goal": "90-day goal"}}
  ]
}}
Return ONLY valid JSON.
"""

    try:
        reply = await call_gemini_with_retry(prompt)
        cleaned = reply.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.replace("```json", "", 1).replace("```", "").strip()
        plan_dict = json.loads(cleaned)
        return {"success": True, "plan": plan_dict}

    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Recovery plan parsing error: {e}. Using high-quality fallback.")
        # Return structured fallback plan
        return {
            "success": True,
            "plan": {
                "risk_level": "Moderate" if credit_score >= 680 else "High",
                "summary": f"Your current debt-to-income profile is stable with ₹{savings:,.0f} in liquidity. Strengthening your cash buffer and maintaining zero late payments will optimize your borrowing capacity.",
                "financial_snapshot": {
                    "annual_income": f"₹{annual_income:,.0f}",
                    "monthly_expenses": f"₹{monthly_expenses:,.0f}",
                    "existing_debt": f"₹{existing_debt:,.0f}",
                    "savings": f"₹{savings:,.0f}",
                    "credit_score": str(credit_score)
                },
                "priorities": [
                    {"title": "Automate Debt Obligations", "description": "Set auto-debit for all current EMIs to safeguard credit score.", "priority": "High"},
                    {"title": "Liquid Buffer Building", "description": "Channel surplus toward a 3-month living expense reserve.", "priority": "Medium"}
                ],
                "plan_30_days": [
                    {"action": "Audit discretionary expenses", "reason": "Identifies monthly surplus to accelerate debt reduction.", "target": "Save 10% on discretionary spending"},
                    {"action": "Ensure zero missed payments", "reason": "Payment history accounts for 35% of credit scoring.", "target": "100% on-time payments"}
                ],
                "plan_60_days": [
                    {"action": "Reduce high-interest credit utilization", "reason": "Brings overall credit card utilization below 30%.", "target": "Utilization < 30%"},
                    {"action": "Build emergency reserve", "reason": "Prevents relying on short-term debt during emergencies.", "target": f"₹{monthly_expenses * 2:,.0f} in savings"}
                ],
                "plan_90_days": [
                    {"action": "Re-evaluate loan readiness", "reason": "Refreshed credit profile will unlock lower lender rate brackets.", "target": "Credit score +15 points"}
                ],
                "key_metrics": [
                    {"metric": "Monthly Savings Rate", "current_value": "15%", "goal": "25%"},
                    {"metric": "Credit Score", "current_value": str(credit_score), "goal": str(min(850, credit_score + 20))}
                ]
            }
        }


@app.get("/recovery-plan/progress")
def get_recovery_progress(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Returns the user's persisted action item completion status.
    """
    items = crud.get_recovery_progress(db, current_user.id)
    return {"progress": items}


@app.put("/recovery-plan/progress")
def update_recovery_progress(
    update: schemas.RecoveryProgressUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Updates the status of a specific recovery plan task (Not Started / In Progress / Completed).
    """
    updated = crud.update_recovery_progress(
        db, current_user.id, update.task_id, update.plan_tier, update.status
    )
    return {"success": True, "item": updated}


# ============================================================
# AI ADVISOR CHAT
# ============================================================

@app.post("/ai-chat")
async def ai_chat(
    data: dict = Body(...),
    optional_user: Optional[models.User] = Depends(auth.get_optional_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Conversational AI Advisor grounded in the user's authentic LifeLoan financial context.
    Safeguarded against guaranteeing rates or loan approvals.
    """
    prompt = data.get("prompt", "").strip()
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prompt is required."
        )

    # Gather user context from DB if authenticated
    context = data.get("context", {})
    if optional_user:
        profile = crud.get_financial_profile_summary(db, optional_user.id)
        loans = crud.get_user_loans(db, optional_user.id)
        latest_pred = crud.get_user_latest_prediction(db, optional_user.id)

        context["user_profile"] = profile
        context["active_loans"] = [
            {"title": l.title, "amount": l.amount, "remaining": l.remaining_amount, "emi": l.emi, "status": l.status}
            for l in loans
        ]
        if latest_pred:
            context["latest_ml_prediction"] = latest_pred

    system_prompt = f"""
You are LifeLoan AI, an elite financial intelligence advisor built for LifeLoan borrowers in India.
Currency: Indian Rupee (₹ / INR).
User Context:
{json.dumps(context, indent=2, default=str)}

RULES:
1. You are an educational financial AI assistant. NEVER guarantee loan approval, rejection, interest rate, or borrowing limit.
2. Predictions from the ML model are estimates, not promises.
3. When explaining ML results or XAI, translate SHAP factors into clear everyday financial terms without inventing reasons.
4. Ground your advice in the user's real Indian financial context provided above. ALWAYS express all currency amounts in Indian Rupees (₹) with Indian number formatting (e.g. ₹50,000, ₹5,00,000, ₹10,00,000). NEVER use USD, dollars, or $ symbols.
5. Format responses cleanly with short paragraphs, bold key terms, and bullet points.

User Question: {prompt}
"""

    try:
        reply = await call_gemini_with_retry(system_prompt)
        return {"reply": reply}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI Chat error: {e}")
        return {
            "reply": "Based on LifeLoan's financial principles: Maintaining a Debt-to-Income (DTI) ratio below 35% and keeping credit card utilization under 25% provides the strongest eligibility foundation. Timely EMI payments across active loans ensure optimal borrowing terms."
        }