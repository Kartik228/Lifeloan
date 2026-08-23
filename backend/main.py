import models
import json

from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel
from datetime import datetime
import os
import database
import crud
import schemas
import auth
from ml.predictor import predict


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not configured.")

gemini_client = None

if GEMINI_API_KEY:
    gemini_client = genai.Client(
        api_key=GEMINI_API_KEY
    )


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="LifeLoan API",
    version="1.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():
    return {
        "message": "Welcome to LifeLoan API!"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "ok",
        "gemini_configured": gemini_client is not None
    }


# ============================================================
# REGISTER
# ============================================================

@app.post(
    "/register",
    response_model=schemas.UserResponse
)
def register_user(
    user: schemas.UserCreate,
    db: Session = Depends(database.get_db)
):
    existing_user = crud.get_user_by_email(
        db,
        user.email
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    return crud.create_user(
        db,
        user
    )


# ============================================================
# LOGIN
# ============================================================

@app.post(
    "/login",
    response_model=schemas.Token
)
def login(
    user: schemas.UserLogin,
    db: Session = Depends(database.get_db)
):
    db_user = crud.authenticate_user(
        db,
        user.email,
        user.password
    )

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = auth.create_access_token(
        data={
            "sub": db_user.email
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": db_user.id
    }


# ============================================================
# LOAN PREDICTION
# ============================================================

@app.post("/predict")
def predict_loan(
    data: dict = Body(...)
):
    try:
        result = predict(data)
        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# CREATE LOAN
# ============================================================

@app.post(
    "/loans",
    response_model=schemas.LoanResponse
)
def create_loan(
    loan: schemas.LoanCreate,
    user_id: int,
    db: Session = Depends(database.get_db)
):
    user = (
        db.query(models.User)
        .filter(models.User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return crud.create_loan(
        db,
        user_id,
        loan
    )


# ============================================================
# GET USER LOANS
# ============================================================

@app.get(
    "/loans",
    response_model=list[schemas.LoanResponse]
)
def get_loans(
    user_id: int,
    db: Session = Depends(database.get_db)
):
    return crud.get_user_loans(
        db,
        user_id
    )


# ============================================================
# GET SINGLE LOAN
# ============================================================

@app.get(
    "/loans/{loan_id}",
    response_model=schemas.LoanResponse
)
def get_loan(
    loan_id: int,
    user_id: int,
    db: Session = Depends(database.get_db)
):
    loan = crud.get_loan_by_id(
        db,
        loan_id,
        user_id
    )

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )

    return loan


# ============================================================
# PAY EMI
# ============================================================

@app.post(
    "/loans/{loan_id}/pay-emi",
    response_model=schemas.LoanResponse
)
def pay_emi(
    loan_id: int,
    user_id: int,
    payment: schemas.PaymentCreate,
    db: Session = Depends(database.get_db)
):
    loan = crud.get_loan_by_id(
        db,
        loan_id,
        user_id
    )

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )

    if (
        loan.status == "completed"
        or loan.remaining_amount <= 0
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "This loan has already "
                "been fully repaid."
            )
        )

    payment_amount = (
        payment.amount
        if payment.amount is not None
        else loan.emi
    )

    if payment_amount <= 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Payment amount must "
                "be greater than zero."
            )
        )

    crud.create_payment(
        db,
        loan,
        payment_amount
    )

    return loan


# ============================================================
# GET PAYMENT HISTORY
# ============================================================

@app.get(
    "/loans/{loan_id}/payments",
    response_model=list[schemas.PaymentResponse]
)
def get_payments(
    loan_id: int,
    user_id: int,
    db: Session = Depends(database.get_db)
):
    loan = crud.get_loan_by_id(
        db,
        loan_id,
        user_id
    )

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )

    return crud.get_loan_payments(
        db,
        loan_id
    )


# ============================================================
# AI FINANCIAL RECOVERY PLANNER
# ============================================================

@app.post("/recovery-plan")
async def recovery_plan(
    data: dict = Body(...)
):

    # --------------------------------------------------------
    # CHECK GEMINI
    # --------------------------------------------------------

    if gemini_client is None:
        raise HTTPException(
            status_code=500,
            detail="Gemini API is not configured."
        )

    # --------------------------------------------------------
    # GET FINANCIAL DATA
    # --------------------------------------------------------

    financial_data = data.get(
        "financial_data",
        {}
    )

    if not isinstance(
        financial_data,
        dict
    ):
        raise HTTPException(
            status_code=400,
            detail="financial_data must be an object."
        )

    # --------------------------------------------------------
    # SUPPORT BOTH FRONTEND NAMING STYLES
    # --------------------------------------------------------

    def get_value(*keys, default=None):

        for key in keys:

            if key in financial_data:

                value = financial_data[key]

                if value is not None:
                    return value

        return default

    annual_income = get_value(
        "annualIncome",
        "annual_income",
        "annual_inc",
        default=0
    )

    monthly_income = get_value(
        "monthlyIncome",
        "monthly_income",
        default=None
    )

    monthly_expenses = get_value(
        "monthlyExpenses",
        "monthly_expenses",
        default=0
    )

    existing_debt = get_value(
        "existingDebt",
        "existing_debt",
        default=0
    )

    savings = get_value(
        "savings",
        "savingsAmount",
        default=0
    )

    credit_score = get_value(
        "creditScore",
        "credit_score",
        "fico_range_low",
        default=0
    )

    requested_loan_amount = get_value(
        "loanAmount",
        "loan_amnt",
        "requestedLoanAmount",
        "requested_loan_amount",
        default=0
    )

    loan_term = get_value(
        "loanTerm",
        "loan_term",
        "term",
        default=None
    )

    decision = get_value(
        "decision",
        default="Not available"
    )

    default_probability = get_value(
        "default_probability",
        "defaultProbability",
        default="Not available"
    )

    predicted_loan_amount = get_value(
        "predicted_loan_amount",
        "predictedLoanAmount",
        default="Not available"
    )

    # --------------------------------------------------------
    # DERIVE MONTHLY INCOME
    # --------------------------------------------------------

    if (
        monthly_income is None
        and isinstance(
            annual_income,
            (int, float)
        )
    ):
        monthly_income = annual_income / 12

    # --------------------------------------------------------
    # FINANCIAL SNAPSHOT
    # --------------------------------------------------------

    financial_snapshot = {
        "annual_income": annual_income,
        "monthly_income": monthly_income,
        "monthly_expenses": monthly_expenses,

        # IMPORTANT:
        # This is EXISTING debt only.
        "existing_debt": existing_debt,

        "savings": savings,
        "credit_score": credit_score,

        # This is the CURRENT requested loan.
        "requested_loan_amount": requested_loan_amount,

        "loan_term": loan_term,
        "decision": decision,
        "default_probability": default_probability,
        "predicted_loan_amount": predicted_loan_amount
    }

    # --------------------------------------------------------
    # GEMINI PROMPT
    # --------------------------------------------------------

    recovery_prompt = f"""
You are LifeLoan AI's Financial Recovery Planner.

Create a personalized financial recovery plan using ONLY
the financial information explicitly provided below.

============================================================
IMPORTANT DATA DEFINITIONS
============================================================

These fields have DIFFERENT meanings:

EXISTING DEBT:
{existing_debt}

This is the user's existing outstanding debt BEFORE the
new loan application.

REQUESTED LOAN AMOUNT:
{requested_loan_amount}

This is the amount the user is CURRENTLY APPLYING FOR.

IMPORTANT:

The requested loan amount MUST NOT be treated as existing
debt.

Do NOT say that the requested loan is an existing loan.

Do NOT say the user currently owes the requested loan amount.

Do NOT say the requested loan is an active business loan
unless the financial data explicitly contains an existing
loan with that information.

SAVINGS:
{savings}

ANNUAL INCOME:
{annual_income}

MONTHLY INCOME:
{monthly_income}

MONTHLY EXPENSES:
{monthly_expenses}

CREDIT SCORE:
{credit_score}

LOAN TERM:
{loan_term}

MODEL DECISION:
{decision}

DEFAULT PROBABILITY:
{default_probability}

MODEL-PREDICTED LOAN AMOUNT:
{predicted_loan_amount}


============================================================
COMPLETE FINANCIAL SNAPSHOT
============================================================

{financial_snapshot}


============================================================
YOUR TASK
============================================================

Analyze the user's CURRENT financial position.

Create a practical 30-day, 60-day and 90-day recovery plan.

Focus on:

- improving financial stability
- improving cash flow
- maintaining timely repayments
- improving credit behavior
- managing existing debt
- building savings
- reducing financial risk
- preparing for future borrowing


============================================================
VERY IMPORTANT
============================================================

1. EXISTING DEBT is ONLY the value provided in
   "existing_debt".

2. REQUESTED LOAN is ONLY the value provided in
   "requested_loan_amount".

3. Never combine these two values.

4. Never describe the requested loan as an existing loan.

5. Never invent an EMI for the requested loan.

6. Never invent an interest rate.

7. Never invent an existing loan.

8. If existing debt is 0 or very small, do NOT recommend
   aggressively paying down a large debt.

9. If savings are available, use the actual savings value.

10. If the user has no existing debt, say so.

11. If the user has an existing debt, use that actual value.

12. Treat ML predictions as predictions, not guarantees.

13. Do not promise loan approval.

14. Do not describe the predicted loan amount as a guaranteed
    borrowing limit.

15. Do not invent missing financial information.

16. If information is unavailable, write:
    "Not available".

17. Do not expose raw SHAP values.

18. Keep the recommendations practical.


============================================================
RETURN VALID JSON ONLY
============================================================

Return exactly this structure:

{{
  "risk_level": "Low | Moderate | High | Critical",

  "summary":
    "Short personalized summary of the user's actual financial situation.",

  "financial_snapshot": {{
    "annual_income": "Actual value",
    "monthly_income": "Actual value",
    "monthly_expenses": "Actual value",
    "existing_debt": "Actual existing debt only",
    "savings": "Actual savings",
    "credit_score": "Actual credit score",
    "requested_loan_amount": "Actual requested loan amount",
    "default_probability": "Actual value"
  }},

  "priorities": [
    {{
      "title": "Priority",
      "description": "Personalized explanation",
      "priority": "High | Medium | Low"
    }}
  ],

  "plan_30_days": [
    {{
      "action": "Specific action",
      "reason": "Why this matters",
      "target": "Measurable target"
    }}
  ],

  "plan_60_days": [
    {{
      "action": "Specific action",
      "reason": "Why this matters",
      "target": "Measurable target"
    }}
  ],

  "plan_90_days": [
    {{
      "action": "Specific action",
      "reason": "Why this matters",
      "target": "Measurable target"
    }}
  ],

  "key_metrics": [
    {{
      "metric": "Metric name",
      "current_value": "Actual value",
      "goal": "Reasonable goal"
    }}
  ]
}}

Return JSON only.
No markdown.
No explanation outside the JSON.
"""

    # --------------------------------------------------------
    # GEMINI REQUEST
    # --------------------------------------------------------

    try:

        response = gemini_client.models.generate_content(
            model="gemini-3.5-flash",
            contents=recovery_prompt
        )

        reply = response.text

        if not reply:
            raise ValueError(
                "Gemini returned an empty response."
            )

        # ----------------------------------------------------
        # CLEAN RESPONSE
        # ----------------------------------------------------

        cleaned_reply = reply.strip()

        if cleaned_reply.startswith("```"):

            cleaned_reply = (
                cleaned_reply
                .replace(
                    "```json",
                    "",
                    1
                )
                .replace(
                    "```",
                    ""
                )
                .strip()
            )

        # ----------------------------------------------------
        # PARSE JSON
        # ----------------------------------------------------

        try:

            plan = json.loads(
                cleaned_reply
            )

        except json.JSONDecodeError:

            print(
                "INVALID GEMINI JSON:"
            )

            print(
                cleaned_reply
            )

            raise HTTPException(
                status_code=500,
                detail=(
                    "LifeLoan AI returned "
                    "an invalid recovery plan."
                )
            )

        # ----------------------------------------------------
        # RETURN RESULT
        # ----------------------------------------------------

        return {
            "success": True,
            "plan": plan
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "===================================="
        )

        print(
            "RECOVERY PLANNER GEMINI ERROR:"
        )

        print(
            repr(error)
        )

        print(
            "===================================="
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"Recovery planner error: {str(error)}"
            )
        )


# ============================================================
# AI CHAT
# ============================================================

@app.post("/ai-chat")
async def ai_chat(
    data: dict = Body(...)
):

    # ========================================================
    # CHECK GEMINI
    # ========================================================

    if gemini_client is None:

        raise HTTPException(
            status_code=500,
            detail=(
                "Gemini API is not configured."
            )
        )

    # ========================================================
    # GET REQUEST DATA
    # ========================================================

    prompt = data.get(
        "prompt",
        ""
    )

    context = data.get(
        "context",
        {}
    )

    if not prompt or not prompt.strip():

        raise HTTPException(
            status_code=400,
            detail="Prompt is required."
        )

    # ========================================================
    # EXTRACT LIFELOAN CONTEXT
    # ========================================================

    prediction = context.get(
        "latest_ml_prediction"
    )

    application = context.get(
        "latest_application"
    )

    active_loans = context.get(
        "active_loans",
        []
    )

    # ========================================================
    # CONVERT CONTEXT TO JSON
    # ========================================================

    try:

        prediction_json = json.dumps(
            prediction,
            indent=2,
            default=str
        )

        application_json = json.dumps(
            application,
            indent=2,
            default=str
        )

        loans_json = json.dumps(
            active_loans,
            indent=2,
            default=str
        )

    except Exception:

        prediction_json = str(
            prediction
        )

        application_json = str(
            application
        )

        loans_json = str(
            active_loans
        )

    # ========================================================
    # LIFELOAN AI SYSTEM CONTEXT
    # ========================================================

    system_context = f"""
You are LifeLoan AI, the intelligent financial
advisor inside the LifeLoan application.

Your job is to help users understand:

- loan eligibility
- loan risk
- default probability
- borrowing capacity
- EMI
- credit profile
- loan repayment
- financial decisions


========================================================
IMPORTANT ROLE
========================================================

You are an AI financial assistant.

You are NOT a bank.

You are NOT a lender.

You are NOT a credit bureau.

You must NEVER guarantee:

- loan approval
- loan rejection
- interest rates
- borrowing limits
- financial returns

ML predictions are estimates and must be described
as predictions rather than guaranteed outcomes.


========================================================
USER'S ACTUAL LIFELOAN DATA
========================================================

The following information comes directly from the
user's LifeLoan application and ML assessment.

Use this information whenever it is relevant.

Do NOT invent information that is not present.


--------------------------------------------------------
LATEST ML PREDICTION
--------------------------------------------------------

{prediction_json}


--------------------------------------------------------
LATEST LOAN APPLICATION
--------------------------------------------------------

{application_json}


--------------------------------------------------------
EXISTING LOANS
--------------------------------------------------------

{loans_json}


========================================================
ML PREDICTION INTERPRETATION
========================================================

The field:

default_probability

is a decimal probability between 0 and 1.

Examples:

0.27 means approximately 27%.

0.50 means approximately 50%.

0.80 means approximately 80%.

Always convert it into a percentage when explaining
it to the user.

If the prediction contains:

predicted_loan_amount

explain that this is the amount predicted by the
LifeLoan loan amount prediction model.

It is NOT a guaranteed loan offer.


========================================================
DECISION
========================================================

If the prediction contains:

decision

use the actual decision when discussing the user's
assessment.

For example:

Approved

or

Rejected

Do not change or invent the decision.


========================================================
XAI / SHAP FACTORS
========================================================

The prediction may contain:

xai_factors

Each XAI factor may contain:

- feature
- value
- shap_value
- impact

These factors represent the strongest model influences
on the prediction.

If the user asks:

"Why was I approved?"

"Why was I rejected?"

"Why is my risk high?"

"What affected my prediction?"

"Why is my default risk high?"

you MUST use the XAI factors provided above.


========================================================
HOW TO EXPLAIN XAI
========================================================

Explain XAI information in simple language.

Do NOT expose raw SHAP values unless the user
specifically asks for technical ML details.

For example, do NOT normally say:

"loan_amnt has a SHAP value of 0.195001."

Instead say:

"The requested loan amount increased the model's
predicted default risk."


If:

impact = increases_default_risk

explain:

"This factor increased the predicted default risk."


If:

impact = decreases_default_risk

explain:

"This factor reduced the predicted default risk."


If multiple factors exist, mention the most important
ones first.


========================================================
LATEST APPLICATION
========================================================

Use the user's actual application information.

Possible fields include:

- age
- employment
- education
- dependents
- annualIncome
- monthlyExpenses
- existingDebt
- savings
- loanAmount
- loanPurpose
- loanTerm
- creditScore
- creditHistory
- previousDefault

Do not invent missing values.

If a required value is missing, say that the information
is not available.


========================================================
EXISTING LOANS
========================================================

If existing loans are available, use their actual:

- original amount
- remaining amount
- monthly EMI
- interest rate
- tenure
- repayment progress
- status

when relevant.

Do not assume the user has a loan if the provided
loan list is empty.


========================================================
PERSONALIZED ADVICE
========================================================

When the user asks how to improve their eligibility,
give practical suggestions based on their actual data.

For example, consider:

- credit score
- existing debt
- monthly expenses
- income
- savings
- requested loan amount
- existing repayment obligations

Do not invent financial information.


========================================================
ANSWER STYLE
========================================================

Keep answers:

- concise
- clear
- practical
- personalized
- easy to understand

Use short paragraphs and bullet points when helpful.

Avoid unnecessary technical terminology.


========================================================
FINANCIAL SAFETY
========================================================

Never say:

"You will definitely get the loan."

Instead say:

"Your LifeLoan model predicts approval."


Never say:

"You will definitely be rejected."

Instead say:

"Your LifeLoan model predicts a higher risk."


Never claim that an ML prediction is a guaranteed
financial outcome.


========================================================
CURRENT USER QUESTION
========================================================

{prompt}


========================================================
FINAL INSTRUCTION
========================================================

Answer the user's question using the actual LifeLoan
data provided above.

If the user asks about their assessment:

Use the actual ML prediction.

If the user asks why the prediction happened:

Use the XAI factors.

If the user asks about their risk:

Use the actual default probability.

If the user asks about improving eligibility:

Use their actual application and financial data.

If the user asks about existing loans:

Use their actual loan information.

Do NOT invent information.

Do NOT give generic advice when the user's actual
LifeLoan data can be used instead.

"""

    # ========================================================
    # GEMINI REQUEST
    # ========================================================

    try:

        response = (
            gemini_client
            .models
            .generate_content(
                model="gemini-3.5-flash",
                contents=system_context
            )
        )

        reply = response.text

        if not reply:

            reply = (
                "I couldn't generate a response "
                "right now. Please try again."
            )

        return {
            "reply": reply
        }

    except Exception as error:

        print(
            "===================================="
        )

        print(
            "GEMINI ERROR:"
        )

        print(
            repr(error)
        )

        print(
            "===================================="
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"Gemini error: {str(error)}"
            )
        )