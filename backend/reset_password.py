from getpass import getpass

from database import SessionLocal
from models import User
from auth import hash_password


def reset_password():
    db = SessionLocal()

    try:
        email = input("Enter user email: ").strip()
        new_password = getpass("Enter new password: ")

        if not new_password:
            print("Password cannot be empty.")
            return

        user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if not user:
            print("User not found.")
            return

        user.password = hash_password(new_password)

        db.commit()
        db.refresh(user)

        print()
        print("Password reset successfully.")
        print(f"Account: {user.email}")
        print("You can now log in.")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")

    finally:
        db.close()


if __name__ == "__main__":
    reset_password()