from backend.app.api.routes.auth import router as auth_router
from backend.app.api.routes.profile import router as profile_router
from backend.app.api.routes.preparation import router as preparation_router
from backend.app.api.routes.interview import router as interview_router
from backend.app.api.routes.reports import router as reports_router
from backend.app.api.routes.audio import router as audio_router

__all__ = [
    "auth_router",
    "profile_router",
    "preparation_router",
    "interview_router",
    "reports_router",
    "audio_router"
]
