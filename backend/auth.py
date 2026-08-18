from datetime import datetime, timedelta

from jose import jwt
from passlib.context import CryptContext
from passlib.exc import UnknownHashError


SECRET_KEY = "lifeloan_secret_key_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str) -> str:
    """
    Convert a plain-text password into a secure bcrypt hash.
    """
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    """
    Verify a password against its stored bcrypt hash.

    If the database contains an old/invalid password value,
    return False instead of crashing the API with a 500 error.
    """

    try:
        return pwd_context.verify(
            plain_password,
            hashed_password
        )

    except UnknownHashError:
        return False

    except (ValueError, TypeError):
        return False


def create_access_token(data: dict) -> str:

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({
        "exp": expire
    })

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )