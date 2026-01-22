from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
import json
from scalar_fastapi import get_scalar_api_reference
from app.core.config import settings
from app.api.routes import users, auth, scraper, metadata, recommendations, admin, scholars, edits, contact, universities
from app.data_access.database import engine, Base

class UTF8JSONResponse(JSONResponse):
    def render(self, content) -> bytes:
        return json.dumps(
            content,
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(",", ":"),
        ).encode("utf-8")

app = FastAPI(
    title=settings.project_name,
    description="Hivemind API - Academic network and scholar discovery platform",
    version="1.0.0",
    default_response_class=UTF8JSONResponse,
    docs_url=None,
    redoc_url=None,
)

@app.get("/docs", include_in_schema=False)
async def scalar_docs():
    """
    Access the Scalar API documentation interface.
    
    This endpoint serves the Scalar UI, which provides an interactive and modern
    interface for exploring and testing API endpoints. Scalar replaces the default
    Swagger UI with enhanced features including improved code samples, better
    authentication support, and a more intuitive user experience.
    
    Returns:
        HTML content containing the Scalar documentation interface.
    """
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/user", tags=["users"])
app.include_router(scraper.router, prefix="/scraper", tags=["scraper"])
app.include_router(metadata.router, prefix="/api/v1/metadata", tags=["metadata"])
app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["recommendations"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(scholars.router, prefix="/api/v1/scholars", tags=["scholars"])
app.include_router(edits.router, prefix="/api/v1/edits", tags=["edits"])
app.include_router(contact.router, prefix="/api/v1/contact", tags=["contact"])
app.include_router(universities.router, prefix="/api/v1/universities", tags=["universities"])

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)

@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()

@app.get("/")
def read_root():
    """
    Welcome endpoint for the Hivemind API.
    
    This endpoint provides a simple greeting message to confirm that the API
    is running and accessible. It serves as a health check and entry point
    for the API.
    
    Returns:
        A dictionary containing a welcome message.
    """
    return {"message": "Welcome to Hivemind API"}
