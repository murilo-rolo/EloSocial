from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import ALLOWED_ORIGINS

app = FastAPI(title="EloSocial", version="1.0.0")

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
from app.api.ai import router as ai_router
from app.api.report_generator import router as report_gen_router
from app.api.search_global import router as search_global_router
from app.api.rag import router as rag_router
from app.api.ocr import router as ocr_router

app.include_router(reports_router, prefix="/api", tags=["reports"])
app.include_router(users_admin_router, prefix="/api", tags=["admin"])
app.include_router(video_router, prefix="/api", tags=["video"])
app.include_router(ai_router, prefix="/api", tags=["ai"])
app.include_router(report_gen_router, prefix="/api", tags=["ai_reports"])
app.include_router(search_global_router, prefix="/api", tags=["ai_global"])
app.include_router(rag_router, prefix="/api", tags=["rag"])
app.include_router(ocr_router, prefix="/api", tags=["ocr"])

@app.get("/api/health")
def health():
    return {"status": "ok"}
