from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import ALLOWED_ORIGINS

app = FastAPI(title="EloSocial - PDF Generator", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.reports import router as reports_router
from app.api.users_admin import router as users_admin_router
from app.api.video import router as video_router
app.include_router(reports_router, prefix="/api", tags=["reports"])
app.include_router(users_admin_router, prefix="/api", tags=["admin"])
app.include_router(video_router, prefix="/api", tags=["video"])

@app.get("/api/health")
def health():
    return {"status": "ok"}
