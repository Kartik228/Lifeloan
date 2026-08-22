import models
import json

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    Body
)

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

GEMINI_API_KEY = os.getenv(
    "GEMINI_API_KEY"
)

if not GEMINI_API_KEY:

    print(
        "WARNING: GEMINI_API_KEY is not configured."
    )


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

        "gemini_configured":
            gemini_client is not None

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

    db: Session = Depends(
        database.get_db
    )

):

    existing_user = (
        crud.get_user_by_email(
            db,
            user.email
        )
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

    db: Session = Depends(
        database.get_db
    )

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

        "access_token":
            token,

        "token_type":
            "bearer",

        "user_id":
            db_user.id

    }


# ============================================================
# LOAN PREDICTION
# ============================================================

@app.post("/predict")
def predict_loan(

    data: dict = Body(...)

):

    try:

        result = predict(
            data
        )

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

    db: Session = Depends(
        database.get_db
    )

):

    # --------------------------------------------------------
    # CHECK USER EXISTS
    # --------------------------------------------------------

    user = (

        db.query(
            models.User
        )

        .filter(
            models.User.id ==
            user_id
        )

        .first()

    )


    if not user:

        raise HTTPException(

            status_code=404,

            detail="User not found"

        )


    # --------------------------------------------------------
    # CREATE LOAN
    # --------------------------------------------------------

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

    db: Session = Depends(
        database.get_db
    )

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

    db: Session = Depends(
        database.get_db
    )

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

    db: Session = Depends(
        database.get_db
    )

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


    # --------------------------------------------------------
    # CHECK IF ALREADY COMPLETED
    # --------------------------------------------------------

    if (

        loan.status == "completed"

        or

        loan.remaining_amount <= 0

    ):

        raise HTTPException(

            status_code=400,

            detail=(
                "This loan has already "
                "been fully repaid."
            )

        )


    # --------------------------------------------------------
    # PAYMENT AMOUNT
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # CREATE PAYMENT
    # --------------------------------------------------------

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

    db: Session = Depends(
        database.get_db
    )

):

    # --------------------------------------------------------
    # MAKE SURE LOAN BELONGS TO USER
    # --------------------------------------------------------

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

            "reply":
                reply

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