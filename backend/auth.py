from datetime import datetime, timedelta
from typing import Optional

from jose import jwt, JWTError
from passlib.context import CryptContext
from passlib.exc import UnknownHashError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

import database
import models


SECRET_KEY = "lifeloan_secret_key_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours for seamless session experience


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

security = HTTPBearer(auto_error=True)
optional_security = HTTPBearer(auto_error=False)


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


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(database.get_db)
) -> models.User:
    """
    Validate the JWT Bearer token and return the authenticated User model.
    Raises HTTP 401 if token is invalid, expired, or user not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        email: Optional[str] = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception

    return user


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: Session = Depends(database.get_db)
) -> Optional[models.User]:
    """
    Extract user from Bearer token if provided, otherwise return None without error.
    Used for endpoints that support both authenticated and unauthenticated callers.
    """
    if not credentials or not credentials.credentials:
        return None

    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        email: Optional[str] = payload.get("sub")
        if email is None:
            return None
        return db.query(models.User).filter(models.User.email == email).first()
    except Exception:
        return None