import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config.settings import settings
from backend.config.logging import setup_logging, logger
from backend.database.database import init_db
from backend.api.routes.chat import router as chat_router
from backend.api.routes.resources import (
    assessments_router, findings_router, reports_router,
    agents_router, knowledge_router, approval_router, health_router, tools_router, capabilities_router
)

setup_logging()
logger.info("Initializing CyberAgents Agentic AI Security Copilot Backend...")

app = FastAPI(
    title="CyberAgents AI Security Copilot Backend",
    description="Production-Grade Agentic AI Security Backend driven by LangGraph, LangChain, and FastAPI.",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database tables
init_db()

from backend.api.routes.workspace import router as workspace_router

# Register API Routers
app.include_router(chat_router)
app.include_router(workspace_router)
app.include_router(assessments_router)
app.include_router(findings_router)
app.include_router(reports_router)
app.include_router(agents_router)
app.include_router(knowledge_router)
app.include_router(approval_router)
app.include_router(health_router)
app.include_router(tools_router)
app.include_router(capabilities_router)

# Centralized Error Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception caught: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": f"An error occurred during security agent execution: {str(exc)}",
                "retryable": True
            }
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        app,
        host=settings.HOST,
        port=settings.PORT
    )
