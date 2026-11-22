import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import Base, engine
import backend.app.models # ensures models are registered
from backend.app.api.routes import (
    auth_router,
    profile_router,
    preparation_router,
    interview_router,
    reports_router,
    audio_router
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("careercatalyst")

# Ensure database tables are created on initialization (backward-compatible)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Personalized Interview Preparation & Communication Coaching Platform API (Phase 1 & Phase 2)",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(profile_router, prefix=settings.API_V1_STR)
app.include_router(preparation_router, prefix=settings.API_V1_STR)
app.include_router(interview_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(audio_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "CareerCatalyst API",
        "version": "2.0.0",
        "docs": "/docs",
        "api_prefix": settings.API_V1_STR
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
