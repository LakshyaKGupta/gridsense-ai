from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.models.user import User
from app.schemas.user import SessionExchangeRequest, Token, UserCreate, UserLogin
from app.utils.auth import (
    create_access_token,
    create_session_token,
    get_password_hash,
    verify_firebase_identity_token,
    verify_password,
)

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    hashed_password = get_password_hash(user.password)
    db_user = User(email=user.email, password_hash=hashed_password, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Create token
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=30)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(user: UserLogin, db: Session = Depends(get_db)):
    # Find user
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    # Verify password
    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    # Create token
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=30)
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/session", response_model=Token)
async def create_session(request: SessionExchangeRequest):
    if request.is_demo:
        expected_token = f"demo-{request.role}-token"
        if request.upstream_token != expected_token:
            raise HTTPException(status_code=401, detail="Invalid demo session token")
    else:
        await verify_firebase_identity_token(
            request.upstream_token,
            expected_uid=request.uid,
            expected_email=request.email,
        )

    access_token = create_session_token(
        {
            "sub": request.email,
            "email": request.email,
            "uid": request.uid,
            "role": request.role,
            "name": request.name,
            "is_demo": request.is_demo,
            "auth_source": "demo" if request.is_demo else "firebase",
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}
