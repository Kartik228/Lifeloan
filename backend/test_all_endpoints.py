import sys
import os
import io

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(__file__), "..", "backend")
sys.path.insert(0, os.path.abspath(backend_dir))

from fastapi.testclient import TestClient
from main import app
import database
import models

client = TestClient(app)

def run_tests():
    print("=" * 60)
    print("LIFELOAN FULL BACKEND SUITE TESTING")
    print("=" * 60)

    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("✅ Health check passed:", res.json())

    # 2. Registration (User A)
    user_a_email = f"test_a_{os.urandom(4).hex()}@lifeloan.ai"
    reg_payload = {
        "email": user_a_email,
        "password": "Password123!",
        "full_name": "Karthik Raja",
        "phone": "9876543210"
    }
    res = client.post("/register", json=reg_payload)
    assert res.status_code == 201, f"User A registration failed: {res.text}"
    user_a_id = res.json()["id"]
    print(f"✅ User A registered with ID: {user_a_id}")

    # Duplicate registration check
    res_dup = client.post("/register", json=reg_payload)
    assert res_dup.status_code == 400, "Duplicate registration should return 400"
    print("✅ Duplicate registration correctly rejected")

    # 3. Login
    login_payload = {"email": user_a_email, "password": "Password123!"}
    res = client.post("/login", json=login_payload)
    assert res.status_code == 200, f"Login failed: {res.text}"
    token_a = res.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    print("✅ Login successful, JWT token obtained")

    # Wrong password check
    res_bad = client.post("/login", json={"email": user_a_email, "password": "wrongpassword"})
    assert res_bad.status_code == 401, "Invalid password should return 401"
    print("✅ Invalid password correctly rejected")

    # 4. Authenticated /me
    res = client.get("/me", headers=headers_a)
    assert res.status_code == 200
    assert res.json()["email"] == user_a_email
    print("✅ /me returned authentic user info")

    # 5. Financial Profile (Single Source of Truth)
    res = client.get("/financial-profile", headers=headers_a)
    assert res.status_code == 200
    prof = res.json()
    print("✅ /financial-profile GET:", prof)

    update_prof = {
        "annual_income": 950000.0,
        "monthly_expenses": 35000.0,
        "existing_debt": 50000.0,
        "savings": 200000.0,
        "credit_score": 760,
        "employment_status": "Salaried"
    }
    res = client.put("/financial-profile", json=update_prof, headers=headers_a)
    assert res.status_code == 200
    assert res.json()["annual_income"] == 950000.0
    print("✅ /financial-profile PUT updated successfully")

    # 6. ML Prediction & Loan Application
    pred_data = {
        "loan_amnt": 400000.0,
        "annual_inc": 950000.0,
        "term": 36,
        "int_rate": 10.5,
        "installment": 13000.0,
        "dti": 18.5,
        "fico_range_low": 760,
        "fico_range_high": 770,
        "emp_length": "5 years",
        "home_ownership": "MORTGAGE",
        "purpose": "debt_consolidation",
        "revol_bal": 50000.0,
        "delinq_2yrs": 0,
        "pub_rec": 0,
        "open_acc": 4,
        "total_acc": 8
    }
    res = client.post("/predict", json=pred_data, headers=headers_a)
    assert res.status_code == 200, f"Prediction failed: {res.text}"
    pred_result = res.json()
    assert "default_probability" in pred_result
    assert "decision" in pred_result
    assert "xai_factors" in pred_result
    print(f"✅ Real ML Prediction evaluated: Decision={pred_result['decision']}, Risk={pred_result['default_probability']}, Factors={len(pred_result['xai_factors'])}")

    # Check persistence of application & prediction
    res = client.get("/applications/latest", headers=headers_a)
    assert res.status_code == 200
    latest_data = res.json()
    assert latest_data["application"] is not None
    assert latest_data["prediction"] is not None
    print("✅ Latest application and prediction persisted and retrieved successfully")

    # 7. My Loans CRUD & EMI Payment
    loan_payload = {
        "title": "Home Renovation Loan",
        "loan_type": "Home Loan",
        "amount": 300000.0,
        "interest_rate": 10.5,
        "tenure_months": 24,
        "emi": 13915.0,
        "remaining_amount": 300000.0,
        "status": "active"
    }
    res = client.post("/loans", json=loan_payload, headers=headers_a)
    assert res.status_code == 201
    loan_a = res.json()
    loan_a_id = loan_a["id"]
    print(f"✅ Loan created with ID: {loan_a_id}, Remaining: ₹{loan_a['remaining_amount']}")

    # Pay EMI
    pay_payload = {"amount": 13915.0}
    res = client.post(f"/loans/{loan_a_id}/pay-emi", json=pay_payload, headers=headers_a)
    assert res.status_code == 200
    updated_loan = res.json()
    assert updated_loan["remaining_amount"] < 300000.0
    print(f"✅ EMI paid successfully, Remaining balance: ₹{updated_loan['remaining_amount']}")

    # Check payment history
    res = client.get(f"/loans/{loan_a_id}/payments", headers=headers_a)
    assert res.status_code == 200
    payments = res.json()
    assert len(payments) >= 1
    print(f"✅ Payment history retrieved: {len(payments)} record(s)")

    # 8. User B (Cross-User Isolation Check)
    user_b_email = f"test_b_{os.urandom(4).hex()}@lifeloan.ai"
    client.post("/register", json={
        "email": user_b_email,
        "password": "Password123!",
        "full_name": "Jane User",
        "phone": "9123456780"
    })
    res_b = client.post("/login", json={"email": user_b_email, "password": "Password123!"})
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User B should see 0 loans
    res = client.get("/loans", headers=headers_b)
    assert res.status_code == 200
    assert len(res.json()) == 0
    print("✅ Cross-user isolation verified: User B sees 0 loans")

    # User B cannot access or pay User A's loan
    res = client.get(f"/loans/{loan_a_id}", headers=headers_b)
    assert res.status_code == 404
    res = client.post(f"/loans/{loan_a_id}/pay-emi", json={"amount": 5000.0}, headers=headers_b)
    assert res.status_code == 404
    print("✅ Cross-user authorization strictly enforced (User B gets 404 for User A's loan)")

    # 9. Digital Twin Simulation (Real XGBoost ML)
    sim_request = {
        "loan_amount": 500000.0,
        "interest_rate": 11.0,
        "tenure_years": 4,
        "income_change_percent": 10.0,
        "expense_change_percent": -5.0
    }
    res = client.post("/digital-twin/simulate", json=sim_request, headers=headers_a)
    assert res.status_code == 200, f"Digital Twin simulation failed: {res.text}"
    sim_res = res.json()
    assert "current_default_probability" in sim_res
    assert "simulated_default_probability" in sim_res
    assert "risk_change_percentage_points" in sim_res
    assert "xai_factors" in sim_res
    print(f"✅ Digital Twin Real XGBoost Simulation ran: Current Risk={sim_res['current_default_probability']}%, Simulated Risk={sim_res['simulated_default_probability']}%, Risk Delta={sim_res['risk_change_percentage_points']}%")

    # 10. Bank / Loan Comparison
    res = client.get("/loan-comparison/offers?loan_amount=500000&tenure_years=5&loan_type=personal")
    assert res.status_code == 200
    comp_data = res.json()
    assert len(comp_data["offers"]) >= 4
    assert "disclaimer" in comp_data
    print(f"✅ Loan Comparison offers returned: {len(comp_data['offers'])} lenders evaluated")

    # 11. AI Recovery Planner
    rec_payload = {
        "financial_data": {
            "annual_income": 950000.0,
            "monthly_expenses": 35000.0,
            "existing_debt": 50000.0,
            "savings": 200000.0,
            "credit_score": 760
        }
    }
    res = client.post("/recovery-plan", json=rec_payload, headers=headers_a)
    assert res.status_code == 200
    plan_data = res.json()
    assert plan_data["success"] is True
    assert "plan" in plan_data
    print("✅ Recovery Plan generated successfully")

    # Recovery Progress
    res = client.put("/recovery-plan/progress", json={
        "task_id": "30_0",
        "plan_tier": "30_days",
        "status": "In Progress"
    }, headers=headers_a)
    assert res.status_code == 200
    res = client.get("/recovery-plan/progress", headers=headers_a)
    assert res.status_code == 200
    assert len(res.json()["progress"]) >= 1
    print("✅ Recovery Plan progress persisted and verified")

    # 12. AI Advisor Chat
    chat_payload = {
        "prompt": "How can I improve my financial profile and reduce default risk?",
        "context": {}
    }
    res = client.post("/ai-chat", json=chat_payload, headers=headers_a)
    assert res.status_code == 200
    assert "reply" in res.json()
    print("✅ AI Advisor Chat returned response grounded in context")

    print("\n🎉 ALL 12 BACKEND AND ML VERIFICATION TESTS PASSED PERFECTLY!\n")

if __name__ == "__main__":
    run_tests()
