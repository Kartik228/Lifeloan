import models
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
        "access_token": token,
        "token_type": "bearer"
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
    db: Session = Depends(
        database.get_db
    )
):

    # --------------------------------------------------------
    # Check user exists
    # --------------------------------------------------------

    user = (
    db.query(models.User)
    .filter(
        models.User.id == user_id
    )
    .first()
)
    

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )


    # --------------------------------------------------------
    # Create loan
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
    # Check if already completed
    # --------------------------------------------------------

    if (
        loan.status == "completed"
        or loan.remaining_amount <= 0
    ):

        raise HTTPException(
            status_code=400,
            detail="This loan has already been fully repaid."
        )


    # --------------------------------------------------------
    # Payment amount
    #
    # If frontend doesn't provide an amount,
    # use the normal EMI amount.
    # --------------------------------------------------------

    payment_amount = (
        payment.amount
        if payment.amount is not None
        else loan.emi
    )


    if payment_amount <= 0:

        raise HTTPException(
            status_code=400,
            detail="Payment amount must be greater than zero."
        )


    # --------------------------------------------------------
    # Create payment
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
    # Make sure loan belongs to user
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

    # --------------------------------------------------------
    # CHECK GEMINI
    # --------------------------------------------------------

    if gemini_client is None:

        raise HTTPException(
            status_code=500,
            detail="Gemini API is not configured."
        )


    # --------------------------------------------------------
    # GET REQUEST DATA
    # --------------------------------------------------------

    prompt = data.get(
        "prompt",
        ""
    )

    context = data.get(
        "context",
        {}
    )


    if (
        not prompt
        or not prompt.strip()
    ):

        raise HTTPException(
            status_code=400,
            detail="Prompt is required."
        )


    # --------------------------------------------------------
    # LIFELOAN AI INSTRUCTIONS
    # --------------------------------------------------------

    system_context = f"""

You are LifeLoan AI, an intelligent
financial loan advisor.

Your job is to explain loan eligibility,
loan risk, borrowing capacity, EMI,
credit profile, and financial decisions
in clear language that an ordinary user
can understand.

IMPORTANT RULES:

1. Never claim that you are a bank.

2. Never guarantee loan approval.

3. Never guarantee a specific interest rate.

4. Treat ML predictions as predictions,
   not facts or guarantees.

5. Do not expose technical ML terminology
   unless the user specifically asks.

6. Do not invent financial information.

7. Only use the financial information provided
   in the LifeLoan context.

8. Give practical and understandable advice.

9. If the user asks why they were rejected,
   explain the model's strongest influences.

10. Keep responses concise and useful.


CURRENT LIFELOAN USER CONTEXT:

{context}


USER QUESTION:

{prompt}

"""


    # --------------------------------------------------------
    # GEMINI REQUEST
    # --------------------------------------------------------

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
            detail=f"Gemini error: {str(error)}"
        )