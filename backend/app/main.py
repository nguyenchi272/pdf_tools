from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from app.pdf_service import router as pdf_router

from fastapi.responses import Response


app = FastAPI(
    title="OpenPDF API",
    version="0.2.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "openpdf-api",
        "version": "0.2.0",
    }


app.include_router(
    pdf_router,
    prefix="/api/pdf",
)

@app.get("/api/test-size")
def test_size(mb: float = Query(1, ge=1, le=100)):
    data = b"A" * int(mb * 1024 * 1024)

    return Response(
        content=data,
        media_type="application/octet-stream",
    )