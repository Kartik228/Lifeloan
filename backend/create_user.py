from getpass import getpass

from database import SessionLocal
from models import User
from auth import hash_password


def create_user():
    db = SessionLocal()

    try:
        full_name = input("Enter your full name: ").strip()
        email = input("Enter your email: ").strip()
        phone = input("Enter your phone number: ").strip()
        password = getpass("Enter your password: ")

        if not full_name:
            print("Name cannot be empty.")
            return

        if not email:
            print("Email cannot be empty.")
            return

        if not password:
            print("Password cannot be empty.")
            return

        existing_user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if existing_user:
            print("A user with this email already exists.")
            return

        new_user = User(
            full_name=full_name,
            email=email,
            password=hash_password(password),
            phone=phone
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        print()
        print("================================")
        print("USER CREATED SUCCESSFULLY")
        print("================================")
        print(f"Name:  {new_user.full_name}")
        print(f"Email: {new_user.email}")
        print("Password: securely hashed")
        print("You can now log in.")

    except Exception as e:
        db.rollback()
        print(f"Error creating user: {e}")

    finally:
        db.close()


if __name__ == "__main__":
    create_user()