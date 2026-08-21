from sqlalchemy.orm import Session
from datetime import datetime

import models
import schemas

from auth import hash_password, verify_password


# ============================================================
# USER CRUD
# ============================================================

def get_user_by_email(
    db: Session,
    email: str
):
    return (
        db.query(models.User)
        .filter(
            models.User.email == email
        )
        .first()
    )


def create_user(
    db: Session,
    user: schemas.UserCreate
):

    hashed_password = hash_password(
        user.password
    )

    db_user = models.User(
        full_name=user.full_name,
        email=user.email,
        password=hashed_password,
        phone=user.phone
    )

    db.add(db_user)

    db.commit()

    db.refresh(db_user)

    return db_user


def authenticate_user(
    db: Session,
    email: str,
    password: str
):

    user = get_user_by_email(
        db,
        email
    )

    if not user:
        return None

    if not verify_password(
        password,
        user.password
    ):
        return None

    return user


# ============================================================
# LOAN CRUD
# ============================================================

def create_loan(
    db: Session,
    user_id: int,
    loan: schemas.LoanCreate
):

    db_loan = models.Loan(

        user_id=user_id,

        title=loan.title,

        loan_type=loan.loan_type,

        amount=loan.amount,

        remaining_amount=loan.remaining_amount,

        emi=loan.emi,

        interest_rate=loan.interest_rate,

        tenure_months=loan.tenure_months,

        progress_percentage=
            loan.progress_percentage,

        status=loan.status,

        created_at=
            loan.created_at
            or datetime.now().isoformat()

    )

    db.add(db_loan)

    db.commit()

    db.refresh(db_loan)

    return db_loan


def get_user_loans(
    db: Session,
    user_id: int
):

    return (
        db.query(models.Loan)
        .filter(
            models.Loan.user_id == user_id
        )
        .order_by(
            models.Loan.id.desc()
        )
        .all()
    )


def get_loan_by_id(
    db: Session,
    loan_id: int,
    user_id: int
):

    return (
        db.query(models.Loan)
        .filter(
            models.Loan.id == loan_id,
            models.Loan.user_id == user_id
        )
        .first()
    )


# ============================================================
# PAYMENT CRUD
# ============================================================

def create_payment(
    db: Session,
    loan: models.Loan,
    amount: float
):

    # --------------------------------------------------------
    # Don't allow payment larger than remaining balance
    # --------------------------------------------------------

    payment_amount = min(
        amount,
        loan.remaining_amount
    )

    if payment_amount <= 0:
        return None


    # --------------------------------------------------------
    # Create payment record
    # --------------------------------------------------------

    payment = models.Payment(

        loan_id=loan.id,

        amount=payment_amount,

        payment_date=
            datetime.now().strftime(
                "%Y-%m-%d"
            ),

        status="paid"

    )

    db.add(payment)


    # --------------------------------------------------------
    # Update remaining loan amount
    # --------------------------------------------------------

    loan.remaining_amount = max(
        0,
        loan.remaining_amount -
        payment_amount
    )


    # --------------------------------------------------------
    # Update repayment progress
    # --------------------------------------------------------

    if loan.amount > 0:

        loan.progress_percentage = min(
            100,
            (
                (
                    loan.amount -
                    loan.remaining_amount
                )
                /
                loan.amount
            )
            * 100
        )


    # --------------------------------------------------------
    # Automatically complete loan
    # --------------------------------------------------------

    if loan.remaining_amount <= 0:

        loan.remaining_amount = 0

        loan.progress_percentage = 100

        loan.status = "completed"


    db.commit()

    db.refresh(loan)

    db.refresh(payment)

    return payment


def get_loan_payments(
    db: Session,
    loan_id: int
):

    return (
        db.query(models.Payment)
        .filter(
            models.Payment.loan_id ==
            loan_id
        )
        .order_by(
            models.Payment.id.desc()
        )
        .all()
    )