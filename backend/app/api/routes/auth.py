from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import hash_password, verify_password, create_access_token
from backend.app.models.user import User
from backend.app.models.profile import CandidateProfile
from backend.app.schemas.auth import UserRegister, UserLogin, UserResponse, Token, AuthResponse
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    hashed_pw = hash_password(payload.password)
    user = User(
        email=payload.email.lower().strip(),
        hashed_password=hashed_pw
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize candidate profile
    profile = CandidateProfile(
        user_id=user.id,
        email=user.email
    )
    db.add(profile)
    db.commit()

    token_str = create_access_token(subject=user.id)
    return AuthResponse(
        user=UserResponse.model_validate(user),
        token=Token(access_token=token_str, token_type="bearer")
    )

@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials."
        )

    token_str = create_access_token(subject=user.id)
    return AuthResponse(
        user=UserResponse.model_validate(user),
        token=Token(access_token=token_str, token_type="bearer")
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
