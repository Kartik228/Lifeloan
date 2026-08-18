from fastapi import FastAPI, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from google import genai
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

    if not prompt or not prompt.strip():

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

        response = gemini_client.models.generate_content(
            model="gemini-3.5-flash",
            contents=system_context
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

        print("====================================")
        print("GEMINI ERROR:")
        print(repr(error))
        print("====================================")

        raise HTTPException(
            status_code=500,
            detail=f"Gemini error: {str(error)}"
        )