from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from typing import Optional

from app.database.connection import get_session

# Simple authentication for now - in production this would use JWT tokens
security = HTTPBearer()

class User:
    def __init__(self, id: int, email: str, role: str = "user"):
        self.id = id
        self.email = email
        self.role = role

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> User:
    """
    Get current user from authorization token
    For now, this is a simplified implementation
    In production, this would validate JWT tokens and fetch user from database
    """
    try:
        # Simple token validation - in production use JWT
        token = credentials.credentials

        # For demonstration, accept any token and return a default user
        # In production, decode JWT and validate
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Mock user - in production, fetch from database using decoded token
        # For now, use user ID 1 which should exist from the events table
        user = User(id=1, email="admin@gameplanpro.com", role="admin")
        return user

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role for certain operations"""
    if current_user.role not in ["admin", "coach"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user