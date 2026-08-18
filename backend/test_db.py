from database import engine

try:
    connection = engine.connect()
    print("✅ Connected to PostgreSQL!")
    connection.close()
except Exception as e:
    print("❌ Connection failed:")
    print(e)