from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
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
        back_populates="user"
    )

    loans = relationship(
        "Loan",
        back_populates="user",
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

    predicted_status = Column(
        String(50)
    )

    default_probability = Column(
        Float
    )

    recommended_amount = Column(
        Float
    )

    created_at = Column(
        String(50)
    )


    # --------------------------------------------------------
    # RELATIONSHIP
    # --------------------------------------------------------

    user = relationship(
        "User",
        back_populates="predictions"
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