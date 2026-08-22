from pydantic import BaseModel, EmailStr
from typing import Optional, List


# ============================================================
# USER SCHEMAS
# ============================================================

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: str

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int


# ============================================================
# PAYMENT SCHEMAS
# ============================================================

class PaymentResponse(BaseModel):

    id: int
    loan_id: int
    amount: float
    payment_date: str
    status: str

    class Config:
        from_attributes = True


# ============================================================
# LOAN SCHEMAS
# ============================================================

class LoanCreate(BaseModel):

    title: str
    loan_type: str

    amount: float
    remaining_amount: float

    emi: float

    interest_rate: Optional[float] = None

    tenure_months: Optional[int] = None

    progress_percentage: float = 0

    status: str = "active"

    created_at: Optional[str] = None


class LoanResponse(BaseModel):

    id: int
    user_id: int

    title: str
    loan_type: str

    amount: float
    remaining_amount: float

    emi: float

    interest_rate: Optional[float] = None

    tenure_months: Optional[int] = None

    progress_percentage: float

    status: str

    created_at: Optional[str] = None

    payments: List[PaymentResponse] = []

    class Config:
        from_attributes = True


# ============================================================
# EMI PAYMENT REQUEST
# ============================================================

class PaymentCreate(BaseModel):

    amount: Optional[float] = None