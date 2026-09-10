from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    Text,
    Boolean,
)
from sqlalchemy.orm import (
    declarative_base,
    relationship,
)

Base = declarative_base()


# ============================================================
# USER
# ============================================================

class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    full_name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(100),
        unique=True,
        nullable=False
    )

    password = Column(
        String(255),
        nullable=False
    )

    phone = Column(
        String(20)
    )


    # --------------------------------------------------------
    # RELATIONSHIPS
    # --------------------------------------------------------

    predictions = relationship(
        "Prediction",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    loans = relationship(
        "Loan",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    applications = relationship(
        "Application",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    financial_profile = relationship(
        "FinancialProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    recovery_progress = relationship(
        "RecoveryProgress",
        back_populates="user",
        cascade="all, delete-orphan"
    )


# ============================================================
# FINANCIAL PROFILE (SINGLE SOURCE OF TRUTH)
# ============================================================

class FinancialProfile(Base):

    __tablename__ = "financial_profiles"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    annual_income = Column(
        Float,
        default=1200000.0
    )

    monthly_expenses = Column(
        Float,
        default=45000.0
    )

    existing_debt = Column(
        Float,
        default=150000.0
    )

    savings = Column(
        Float,
        default=300000.0
    )

    credit_score = Column(
        Integer,
        default=740
    )

    employment_status = Column(
        String(50),
        default="Salaried"
    )

    updated_at = Column(
        String(50),
        nullable=True
    )

    user = relationship(
        "User",
        back_populates="financial_profile"
    )


# ============================================================
# APPLICATION
# ============================================================

class Application(Base):

    __tablename__ = "applications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    age = Column(Integer, nullable=True)
    employment = Column(String(50), nullable=True)
    education = Column(String(50), nullable=True)
    dependents = Column(Integer, nullable=True)

    annual_income = Column(Float, nullable=False, default=0.0)
    monthly_expenses = Column(Float, nullable=False, default=0.0)
    existing_debt = Column(Float, nullable=False, default=0.0)
    savings = Column(Float, nullable=False, default=0.0)

    loan_amount = Column(Float, nullable=False, default=0.0)
    loan_purpose = Column(String(100), nullable=True)
    loan_term = Column(Integer, nullable=True, default=36)

    credit_score = Column(Integer, nullable=True, default=650)
    credit_history = Column(String(50), nullable=True)
    previous_default = Column(String(10), nullable=True)

    status = Column(String(30), default="evaluated")
    created_at = Column(String(50), nullable=True)

    user = relationship(
        "User",
        back_populates="applications"
    )

    predictions = relationship(
        "Prediction",
        back_populates="application",
        cascade="all, delete-orphan"
    )


# ============================================================
# PREDICTION
# ============================================================

class Prediction(Base):

    __tablename__ = "predictions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    application_id = Column(
        Integer,
        ForeignKey("applications.id"),
        nullable=True
    )

    predicted_status = Column(
        String(50)
    )

    decision = Column(
        String(50),
        nullable=True
    )

    default_probability = Column(
        Float
    )

    recommended_amount = Column(
        Float
    )

    predicted_loan_amount = Column(
        Float,
        nullable=True
    )

    xai_factors_json = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        String(50)
    )


    # --------------------------------------------------------
    # RELATIONSHIPS
    # --------------------------------------------------------

    user = relationship(
        "User",
        back_populates="predictions"
    )

    application = relationship(
        "Application",
        back_populates="predictions"
    )


# ============================================================
# RECOVERY PROGRESS
# ============================================================

class RecoveryProgress(Base):

    __tablename__ = "recovery_progress"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    task_id = Column(
        String(100),
        nullable=False
    )

    plan_tier = Column(
        String(20),
        nullable=False
    )

    status = Column(
        String(30),
        default="Not Started"
    )

    updated_at = Column(
        String(50),
        nullable=True
    )

    user = relationship(
        "User",
        back_populates="recovery_progress"
    )


# ============================================================
# LOAN
# ============================================================

class Loan(Base):

    __tablename__ = "loans"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    title = Column(
        String(150),
        nullable=False
    )

    loan_type = Column(
        String(100),
        nullable=False
    )

    amount = Column(
        Float,
        nullable=False
    )

    remaining_amount = Column(
        Float,
        nullable=False
    )

    emi = Column(
        Float,
        nullable=False
    )

    interest_rate = Column(
        Float,
        nullable=True
    )

    tenure_months = Column(
        Integer,
        nullable=True
    )

    progress_percentage = Column(
        Float,
        default=0
    )

    status = Column(
        String(30),
        default="active"
    )

    created_at = Column(
        String(50),
        nullable=True
    )

    next_due_date = Column(
        String(50),
        nullable=True
    )


    # --------------------------------------------------------
    # RELATIONSHIPS
    # --------------------------------------------------------

    user = relationship(
        "User",
        back_populates="loans"
    )

    payments = relationship(
        "Payment",
        back_populates="loan",
        cascade="all, delete-orphan"
    )


# ============================================================
# PAYMENT
# ============================================================

class Payment(Base):

    __tablename__ = "payments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    loan_id = Column(
        Integer,
        ForeignKey("loans.id"),
        nullable=False
    )

    amount = Column(
        Float,
        nullable=False
    )

    payment_date = Column(
        String(50),
        nullable=False
    )

    due_date = Column(
        String(50),
        nullable=True
    )

    status = Column(
        String(30),
        default="paid"
    )


    # --------------------------------------------------------
    # RELATIONSHIP
    # --------------------------------------------------------

    loan = relationship(
        "Loan",
        back_populates="payments"
    )