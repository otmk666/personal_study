from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base
from app.routers import category, question, practice, stats, ai, ai_solver


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="个人题库系统 API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["系统"])
def health_check():
    return {
        "code": 200,
        "data": {
            "status": "ok",
            "app_name": settings.APP_NAME,
            "version": settings.APP_VERSION,
        },
        "msg": "success",
    }


app.include_router(category.router, prefix="/api")
app.include_router(category.tag_router, prefix="/api")
app.include_router(question.router, prefix="/api")
app.include_router(practice.router, prefix="/api")
app.include_router(practice.wrong_router, prefix="/api")
app.include_router(practice.favorite_router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(stats.focus_router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(ai_solver.router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
