import joblib

preprocessor = joblib.load("models/preprocessor.pkl")

print(preprocessor.feature_names_in_)