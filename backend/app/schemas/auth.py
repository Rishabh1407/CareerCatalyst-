import re
from datetime import datetime
from pydantic import BaseModel, Field, field_validator

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"

class UserRegister(BaseModel):
    email: str = Field(..., description="Valid email address")
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

    @field_validator("email")
    def validate_email(cls, v):
        v = v.strip().lower()
        if not re.match(EMAIL_REGEX, v):
            raise ValueError("Invalid email format")
        return v

class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator("email")
    def validate_email(cls, v):
        return v.strip().lower()


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    user: UserResponse
    token: Token
