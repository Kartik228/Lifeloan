from sqlalchemy.orm import Session
from datetime import datetime, date
import calendar
from typing import Optional, List
import json

import models
import schemas

from auth import hash_password, verify_password


# ============================================================
# USER CRUD
# ============================================================

def get_user_by_email(
    db: Session,
    email: str
) -> Optional[models.User]:
    return (
        db.query(models.User)
        .filter(
            models.User.email == email
        )
        .first()
    )


def get_user_by_id(
    db: Session,
    user_id: int
) -> Optional[models.User]:
    return (
        db.query(models.User)
        .filter(
            models.User.id == user_id
        )
        .first()
    )


def create_user(
    db: Session,
    user: schemas.UserCreate
) -> models.User:

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

    # Initialize default financial profile for the user
    get_or_create_financial_profile(db, db_user.id)

    return db_user


def authenticate_user(
    db: Session,
    email: str,
    password: str
) -> Optional[models.User]:

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
# FINANCIAL PROFILE CRUD (SINGLE SOURCE OF TRUTH)
# ============================================================

def get_or_create_financial_profile(
    db: Session,
    user_id: int
) -> models.FinancialProfile:
    profile = (
        db.query(models.FinancialProfile)
        .filter(models.FinancialProfile.user_id == user_id)
        .first()
    )

    if not profile:
        profile = models.FinancialProfile(
            user_id=user_id,
            annual_income=1200000.0,
            monthly_expenses=45000.0,
            existing_debt=150000.0,
            savings=300000.0,
            credit_score=740,
            employment_status="Salaried",
            updated_at=datetime.now().isoformat()
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return profile


def update_financial_profile(
    db: Session,
    user_id: int,
    update_data: schemas.FinancialProfileUpdate
) -> models.FinancialProfile:
    profile = get_or_create_financial_profile(db, user_id)

    data = update_data.model_dump(exclude_unset=True)
    for key, val in data.items():
        if val is not None:
            setattr(profile, key, val)

    profile.updated_at = datetime.now().isoformat()
    db.commit()
    db.refresh(profile)
    return profile


def get_financial_profile_summary(
    db: Session,
    user_id: int
) -> dict:
    profile = get_or_create_financial_profile(db, user_id)
    loans = get_user_loans(db, user_id)

    # Active loans only (remaining balance > 0 and status is active)
    active_loans = [l for l in loans if l.status == "active" and l.remaining_amount > 0]
    active_loan_count = len(active_loans)
    total_active_loan_amount = sum(l.remaining_amount for l in active_loans)
    total_monthly_emi = sum(l.emi for l in active_loans)

    monthly_income = profile.annual_income / 12.0 if profile.annual_income > 0 else 0.0
    # Monthly Net Surplus = Monthly Income - Monthly Expenses - Total Active Monthly EMIs (can be negative)
    monthly_surplus = monthly_income - profile.monthly_expenses - total_monthly_emi

    # DTI Ratio = (Total Monthly Debt Service / Gross Monthly Income) * 100
    if monthly_income > 0:
        dti = round((total_monthly_emi / monthly_income) * 100.0, 1)
    else:
        dti = 0.0

    # Calculate financial health score (0 - 100)
    # Factors: credit score (40%), DTI (30%), savings buffer (20%), debt burden (10%)
    score = 50
    if profile.credit_score >= 750:
        score += 25
    elif profile.credit_score >= 700:
        score += 15
    elif profile.credit_score < 650:
        score -= 15

    if monthly_income > 0:
        if dti <= 30:
            score += 15
        elif dti <= 45:
            score += 5
        elif dti > 60:
            score -= 15

    if profile.monthly_expenses > 0:
        if profile.savings >= (profile.monthly_expenses * 6):
            score += 10
        elif profile.savings >= (profile.monthly_expenses * 3):
            score += 5

    health_score = max(20, min(98, score))

    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "annual_income": profile.annual_income,
        "monthly_expenses": profile.monthly_expenses,
        "existing_debt": profile.existing_debt,
        "savings": profile.savings,
        "credit_score": profile.credit_score,
        "employment_status": profile.employment_status,
        "updated_at": profile.updated_at,
        "monthly_income": round(monthly_income, 2),
        "monthly_surplus": round(monthly_surplus, 2),
        "debt_to_income": dti,
        "active_loan_count": active_loan_count,
        "total_active_loan_amount": round(total_active_loan_amount, 2),
        "total_monthly_emi": round(total_monthly_emi, 2),
        "health_score": health_score
    }


# ============================================================
# APPLICATION CRUD
# ============================================================

def create_application(
    db: Session,
    user_id: int,
    app_data: dict
) -> models.Application:
    # Update user's financial profile with fresh application data
    profile = get_or_create_financial_profile(db, user_id)
    if "annual_income" in app_data and app_data["annual_income"] > 0:
        profile.annual_income = app_data["annual_income"]
    if "monthly_expenses" in app_data and app_data["monthly_expenses"] > 0:
        profile.monthly_expenses = app_data["monthly_expenses"]
    if "existing_debt" in app_data:
        profile.existing_debt = app_data["existing_debt"]
    if "savings" in app_data:
        profile.savings = app_data["savings"]
    if "credit_score" in app_data and app_data["credit_score"] > 0:
        profile.credit_score = app_data["credit_score"]
    if "employment" in app_data and app_data["employment"]:
        profile.employment_status = app_data["employment"]
    profile.updated_at = datetime.now().isoformat()

    application = models.Application(
        user_id=user_id,
        age=app_data.get("age"),
        employment=app_data.get("employment"),
        education=app_data.get("education"),
        dependents=app_data.get("dependents", 0),
        annual_income=app_data.get("annual_income", 0.0),
        monthly_expenses=app_data.get("monthly_expenses", 0.0),
        existing_debt=app_data.get("existing_debt", 0.0),
        savings=app_data.get("savings", 0.0),
        loan_amount=app_data.get("loan_amount", 0.0),
        loan_purpose=app_data.get("loan_purpose", "Personal"),
        loan_term=app_data.get("loan_term", 36),
        credit_score=app_data.get("credit_score", 650),
        credit_history=app_data.get("credit_history"),
        previous_default=app_data.get("previous_default", "no"),
        status="evaluated",
        created_at=datetime.now().isoformat()
    )

    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def get_user_latest_application(
    db: Session,
    user_id: int
) -> Optional[models.Application]:
    return (
        db.query(models.Application)
        .filter(models.Application.user_id == user_id)
        .order_by(models.Application.id.desc())
        .first()
    )


# ============================================================
# PREDICTION CRUD
# ============================================================

def save_prediction(
    db: Session,
    user_id: int,
    prediction_data: dict,
    application_id: Optional[int] = None
) -> models.Prediction:
    xai_json = None
    if "xai_factors" in prediction_data and prediction_data["xai_factors"]:
        try:
            xai_json = json.dumps(prediction_data["xai_factors"])
        except Exception:
            xai_json = None

    prediction = models.Prediction(
        user_id=user_id,
        application_id=application_id,
        predicted_status=prediction_data.get("decision", "Evaluated"),
        decision=prediction_data.get("decision", "Evaluated"),
        default_probability=float(prediction_data.get("default_probability", 0.0)),
        recommended_amount=float(prediction_data.get("predicted_loan_amount", 0.0)),
        predicted_loan_amount=float(prediction_data.get("predicted_loan_amount", 0.0)),
        xai_factors_json=xai_json,
        created_at=datetime.now().isoformat()
    )

    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction


def get_user_latest_prediction(
    db: Session,
    user_id: int
) -> Optional[dict]:
    prediction = (
        db.query(models.Prediction)
        .filter(models.Prediction.user_id == user_id)
        .order_by(models.Prediction.id.desc())
        .first()
    )

    if not prediction:
        return None

    xai_factors = []
    if prediction.xai_factors_json:
        try:
            xai_factors = json.loads(prediction.xai_factors_json)
        except Exception:
            xai_factors = []

    return {
        "id": prediction.id,
        "user_id": prediction.user_id,
        "application_id": prediction.application_id,
        "decision": prediction.decision or prediction.predicted_status,
        "default_risk": (prediction.default_probability or 0) >= 0.487,
        "default_probability": prediction.default_probability or 0.0,
        "predicted_loan_amount": prediction.predicted_loan_amount or prediction.recommended_amount or 0.0,
        "xai_factors": xai_factors,
        "created_at": prediction.created_at
    }


# ============================================================
# RECOVERY PROGRESS CRUD
# ============================================================

def get_recovery_progress(
    db: Session,
    user_id: int
) -> List[models.RecoveryProgress]:
    return (
        db.query(models.RecoveryProgress)
        .filter(models.RecoveryProgress.user_id == user_id)
        .all()
    )


def update_recovery_progress(
    db: Session,
    user_id: int,
    task_id: str,
    plan_tier: str,
    status: str
) -> models.RecoveryProgress:
    progress = (
        db.query(models.RecoveryProgress)
        .filter(
            models.RecoveryProgress.user_id == user_id,
            models.RecoveryProgress.task_id == task_id
        )
        .first()
    )

    if not progress:
        progress = models.RecoveryProgress(
            user_id=user_id,
            task_id=task_id,
            plan_tier=plan_tier,
            status=status,
            updated_at=datetime.now().isoformat()
        )
        db.add(progress)
    else:
        progress.status = status
        progress.plan_tier = plan_tier
        progress.updated_at = datetime.now().isoformat()

    db.commit()
    db.refresh(progress)
    return progress


# ============================================================
# DATE & EMI CALCULATION UTILITIES
# ============================================================

def add_months(sourcedate: date, months: int) -> date:
    """
    Safely adds or subtracts months to/from a date object,
    clamping the day to valid month range (e.g. leap years, 28/30/31 days).
    """
    month = sourcedate.month - 1 + months
    year = sourcedate.year + month // 12
    month = month % 12 + 1
    day = min(sourcedate.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def parse_date_safe(d: Optional[str]) -> Optional[date]:
    """
    Safely parses ISO or common date string representations into a Python date.
    """
    if not d:
        return None
    d_clean = str(d).strip()
    if "T" in d_clean:
        d_clean = d_clean.split("T")[0]
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(d_clean, fmt).date()
        except ValueError:
            pass
    return None


def derive_loan_next_due_date(loan: models.Loan, db: Session) -> Optional[str]:
    """
    Derives next EMI due date from loan start date, tenure, payment history, and cycle day (15th).
    Returns None if loan is fully repaid or cancelled.
    """
    if loan.status == "completed" or (loan.remaining_amount is not None and loan.remaining_amount <= 0):
        return None

    paid_payments = (
        db.query(models.Payment)
        .filter(models.Payment.loan_id == loan.id, models.Payment.status == "paid")
        .order_by(models.Payment.id.asc())
        .all()
    )
    paid_count = len(paid_payments)

    # Check if the last payment has a due_date recorded
    if paid_payments and paid_payments[-1].due_date:
        last_due = parse_date_safe(paid_payments[-1].due_date)
        if last_due:
            return add_months(last_due, 1).strftime("%Y-%m-%d")

    # Otherwise derive from created_at
    created_dt = parse_date_safe(loan.created_at)
    if not created_dt:
        return None

    base_due = date(created_dt.year, created_dt.month, 15)
    # The next installment due is offset by paid_count
    next_due = add_months(base_due, paid_count)
    return next_due.strftime("%Y-%m-%d")


# ============================================================
# LOAN CRUD
# ============================================================

def create_loan(
    db: Session,
    user_id: int,
    loan: schemas.LoanCreate
) -> models.Loan:

    initial_next_due = loan.next_due_date
    created_str = loan.created_at or datetime.now().isoformat()

    if not initial_next_due:
        created_dt = parse_date_safe(created_str)
        if created_dt:
            # First EMI due on 15th of next month (or cycle month)
            base_due = date(created_dt.year, created_dt.month, 15)
            next_due_dt = add_months(base_due, 1)
            initial_next_due = next_due_dt.strftime("%Y-%m-%d")

    db_loan = models.Loan(
        user_id=user_id,
        title=loan.title,
        loan_type=loan.loan_type,
        amount=loan.amount,
        remaining_amount=loan.remaining_amount,
        emi=loan.emi,
        interest_rate=loan.interest_rate,
        tenure_months=loan.tenure_months,
        progress_percentage=loan.progress_percentage,
        status=loan.status,
        created_at=created_str,
        next_due_date=initial_next_due
    )

    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)
    return db_loan


def get_user_loans(
    db: Session,
    user_id: int
) -> List[models.Loan]:

    loans = (
        db.query(models.Loan)
        .filter(models.Loan.user_id == user_id)
        .order_by(models.Loan.id.desc())
        .all()
    )

    updated = False
    for l in loans:
        if l.status != "completed" and l.remaining_amount > 0 and not l.next_due_date:
            l.next_due_date = derive_loan_next_due_date(l, db)
            updated = True
    if updated:
        db.commit()

    return loans


def get_loan_by_id(
    db: Session,
    loan_id: int,
    user_id: int
) -> Optional[models.Loan]:

    loan = (
        db.query(models.Loan)
        .filter(
            models.Loan.id == loan_id,
            models.Loan.user_id == user_id
        )
        .first()
    )

    if loan and loan.status != "completed" and loan.remaining_amount > 0 and not loan.next_due_date:
        loan.next_due_date = derive_loan_next_due_date(loan, db)
        db.commit()
        db.refresh(loan)

    return loan


# ============================================================
# PAYMENT CRUD
# ============================================================

def create_payment(
    db: Session,
    loan: models.Loan,
    amount: float
) -> Optional[models.Payment]:

    # Don't allow payment larger than remaining balance
    payment_amount = min(amount, loan.remaining_amount)

    if payment_amount <= 0:
        return None

    # Determine current due date for this payment
    current_due_date = loan.next_due_date
    if not current_due_date:
        current_due_date = derive_loan_next_due_date(loan, db)

    payment = models.Payment(
        loan_id=loan.id,
        amount=payment_amount,
        payment_date=datetime.now().strftime("%Y-%m-%d"),
        due_date=current_due_date,
        status="paid"
    )

    db.add(payment)

    # Update remaining loan amount
    loan.remaining_amount = max(0.0, loan.remaining_amount - payment_amount)

    # Update repayment progress
    if loan.amount > 0:
        loan.progress_percentage = min(
            100.0,
            round(((loan.amount - loan.remaining_amount) / loan.amount) * 100, 1)
        )

    # Automatically complete loan when fully repaid
    if loan.remaining_amount <= 0:
        loan.remaining_amount = 0.0
        loan.progress_percentage = 100.0
        loan.status = "completed"
        loan.next_due_date = None
    else:
        # Advance next_due_date to next scheduled installment (e.g. 15 Sep 2026 -> 15 Oct 2026)
        if current_due_date:
            parsed_due = parse_date_safe(current_due_date)
            if parsed_due:
                next_d = add_months(parsed_due, 1)
                loan.next_due_date = next_d.strftime("%Y-%m-%d")
            else:
                loan.next_due_date = derive_loan_next_due_date(loan, db)
        else:
            loan.next_due_date = derive_loan_next_due_date(loan, db)

    db.commit()
    db.refresh(loan)
    db.refresh(payment)
    return payment


def get_loan_payments(
    db: Session,
    loan_id: int
) -> List[models.Payment]:

    return (
        db.query(models.Payment)
        .filter(models.Payment.loan_id == loan_id)
        .order_by(models.Payment.id.desc())
        .all()
    )


# ============================================================
# PAYMENT SCHEDULE GENERATION
# ============================================================

def get_loan_schedule(
    db: Session,
    loan: models.Loan
) -> List[dict]:
    """
    Returns the authentic payment schedule for this loan:
    - Paid installments with actual payment_date and due_date
    - Upcoming installments with scheduled due_date and EMI amount
    """
    payments = (
        db.query(models.Payment)
        .filter(models.Payment.loan_id == loan.id)
        .order_by(models.Payment.id.asc())
        .all()
    )

    tenure = loan.tenure_months or 12
    if tenure <= 0:
        tenure = 12

    paid_count = len(payments)
    schedule = []

    # Determine baseline due date (installment #1)
    base_due_date = None
    if payments and payments[0].due_date:
        base_due_date = parse_date_safe(payments[0].due_date)

    if not base_due_date and loan.next_due_date:
        next_dt = parse_date_safe(loan.next_due_date)
        if next_dt:
            base_due_date = add_months(next_dt, -paid_count)

    if not base_due_date:
        created_dt = parse_date_safe(loan.created_at)
        if created_dt:
            base_due_date = date(created_dt.year, created_dt.month, 15)
        else:
            base_due_date = date(2026, 8, 15)

    for i in range(1, tenure + 1):
        installment_due = add_months(base_due_date, i - 1)
        due_str = installment_due.strftime("%Y-%m-%d")

        if i <= paid_count:
            p = payments[i - 1]
            schedule.append({
                "installment_number": i,
                "due_date": p.due_date or due_str,
                "amount": p.amount,
                "status": "paid",
                "payment_date": p.payment_date
            })
        else:
            # If loan was completely repaid, do not output remaining
            if loan.status == "completed" and loan.remaining_amount <= 0:
                break
            schedule.append({
                "installment_number": i,
                "due_date": due_str,
                "amount": loan.emi,
                "status": "upcoming",
                "payment_date": None
            })

    return schedule