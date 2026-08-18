from predictor import predict
print(predict({
    "term": 36, "int_rate": 11.5, "annual_inc": 75000, "grade": "B",
    "purpose": "credit_card", "home_ownership": "MORTGAGE", "emp_length": "5 years"
}))