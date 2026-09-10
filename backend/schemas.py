from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any


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
    phone: Optional[str] = None

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    user: Optional[UserResponse] = None


# ============================================================
# FINANCIAL PROFILE SCHEMAS (SINGLE SOURCE OF TRUTH)
# ============================================================

class FinancialProfileResponse(BaseModel):
    id: int
    user_id: int
    annual_income: float
    monthly_expenses: float
    existing_debt: float
    savings: float
    credit_score: int
    employment_status: str
    updated_at: Optional[str] = None

    # Computed fields for Dashboard
    monthly_income: float
    monthly_surplus: float
    debt_to_income: float
    active_loan_count: int = 0
    total_active_loan_amount: float = 0.0
    total_monthly_emi: float = 0.0
    health_score: int = 75

    class Config:
        from_attributes = True


class FinancialProfileUpdate(BaseModel):
    annual_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    existing_debt: Optional[float] = None
    savings: Optional[float] = None
    credit_score: Optional[int] = None
    employment_status: Optional[str] = None


# ============================================================
# APPLICATION SCHEMAS
# ============================================================

class ApplicationCreate(BaseModel):
    age: Optional[int] = None
    employment: Optional[str] = None
    education: Optional[str] = None
    dependents: Optional[int] = 0
    annual_income: float = Field(..., ge=0)
    monthly_expenses: float = Field(..., ge=0)
    existing_debt: float = Field(..., ge=0)
    savings: float = Field(..., ge=0)
    loan_amount: float = Field(..., gt=0)
    loan_purpose: Optional[str] = "Personal"
    loan_term: Optional[int] = 36
    credit_score: Optional[int] = 650
    credit_history: Optional[str] = None
    previous_default: Optional[str] = "no"


class ApplicationResponse(BaseModel):
    id: int
    user_id: int
    age: Optional[int] = None
    employment: Optional[str] = None
    education: Optional[str] = None
    dependents: Optional[int] = None
    annual_income: float
    monthly_expenses: float
    existing_debt: float
    savings: float
    loan_amount: float
    loan_purpose: Optional[str] = None
    loan_term: Optional[int] = None
    credit_score: Optional[int] = None
    credit_history: Optional[str] = None
    previous_default: Optional[str] = None
    status: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================
# PREDICTION & XAI SCHEMAS
# ============================================================

class XAIFactor(BaseModel):
    feature: str
    value: Any = None
    shap_value: float
    impact: str


class PredictionResponse(BaseModel):
    id: Optional[int] = None
    user_id: Optional[int] = None
    application_id: Optional[int] = None
    decision: str
    default_risk: bool
    default_probability: float
    predicted_loan_amount: float
    xai_factors: List[XAIFactor] = []
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================
# DIGITAL TWIN SIMULATION SCHEMAS
# ============================================================

class DigitalTwinSimulateRequest(BaseModel):
    scenario_loan_amount: Optional[float] = Field(default=None, ge=0)
    loan_amount: Optional[float] = Field(default=None, ge=0)
    scenario_interest_rate: Optional[float] = Field(default=None, ge=0, le=50)
    interest_rate: Optional[float] = Field(default=None, ge=0, le=50)
    scenario_tenure_years: Optional[int] = Field(default=None, gt=0, le=40)
    loan_term_months: Optional[int] = Field(default=None, gt=0, le=480)
    tenure_years: Optional[int] = Field(default=None, gt=0, le=40)
    income_change_percent: Optional[float] = Field(default=0.0)
    income_adjustment: Optional[float] = Field(default=0.0)
    expense_change_percent: Optional[float] = Field(default=0.0)

    @property
    def effective_loan_amount(self) -> float:
        if self.scenario_loan_amount is not None:
            return float(self.scenario_loan_amount)
        if self.loan_amount is not None:
            return float(self.loan_amount)
        return 500000.0

    @property
    def effective_interest_rate(self) -> float:
        if self.scenario_interest_rate is not None:
            return float(self.scenario_interest_rate)
        if self.interest_rate is not None:
            return float(self.interest_rate)
        return 10.5

    @property
    def effective_tenure_years(self) -> int:
        if self.scenario_tenure_years is not None:
            return int(self.scenario_tenure_years)
        if self.tenure_years is not None:
            return int(self.tenure_years)
        if self.loan_term_months is not None:
            return max(1, round(self.loan_term_months / 12))
        return 5

    @property
    def effective_income_change(self) -> float:
        if self.income_change_percent is not None and self.income_change_percent != 0:
            return float(self.income_change_percent)
        if self.income_adjustment is not None:
            return float(self.income_adjustment)
        return 0.0


class DigitalTwinMetricComparison(BaseModel):
    current: float
    simulated: float
    delta: float
    unit: str


class DigitalTwinSimulateResponse(BaseModel):
    current_default_probability: float
    simulated_default_probability: float
    current_risk_level: str
    simulated_risk_level: str
    current_decision: str
    simulated_decision: str
    simulated_emi: float
    simulated_dti: float
    simulated_monthly_surplus: float
    risk_change: float
    risk_change_percentage_points: float
    is_favorable: bool
    summary: str
    current_financial_metrics: dict
    simulated_financial_metrics: dict
    current_metrics: dict
    simulated_metrics: dict
    monthly_emi: DigitalTwinMetricComparison
    monthly_surplus: DigitalTwinMetricComparison
    debt_to_income: DigitalTwinMetricComparison
    total_debt: DigitalTwinMetricComparison
    credit_score: DigitalTwinMetricComparison
    default_probability: DigitalTwinMetricComparison
    ml_decision: str
    xai_factors: List[dict] = Field(default_factory=list)
    scenario_parameters: Optional[dict] = None


# ============================================================
# RECOVERY PROGRESS SCHEMAS
# ============================================================

class RecoveryProgressItem(BaseModel):
    task_id: str
    plan_tier: str  # 30_days, 60_days, 90_days
    status: str  # Not Started, In Progress, Completed


class RecoveryProgressUpdate(BaseModel):
    task_id: str
    plan_tier: str
    status: str


# ============================================================
# PAYMENT SCHEMAS
# ============================================================

class PaymentResponse(BaseModel):
    id: int
    loan_id: int
    amount: float
    payment_date: str
    due_date: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


# ============================================================
# LOAN SCHEMAS
# ============================================================

class LoanCreate(BaseModel):
    title: str
    loan_type: str
    amount: float = Field(..., gt=0)
    remaining_amount: float = Field(..., ge=0)
    emi: float = Field(..., gt=0)
    interest_rate: Optional[float] = None
    tenure_months: Optional[int] = None
    progress_percentage: float = 0
    status: str = "active"
    created_at: Optional[str] = None
    next_due_date: Optional[str] = None


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
    next_due_date: Optional[str] = None
    payments: List[PaymentResponse] = []

    class Config:
        from_attributes = True


# ============================================================
# PAYMENT SCHEDULE SCHEMA
# ============================================================

class ScheduleItem(BaseModel):
    installment_number: int
    due_date: str
    amount: float
    status: str  # "paid" | "upcoming"
    payment_date: Optional[str] = None


# ============================================================
# EMI PAYMENT REQUEST
# ============================================================

class PaymentCreate(BaseModel):
    amount: Optional[float] = None