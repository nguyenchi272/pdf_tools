from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from app.pdf_service import router as pdf_router

from fastapi.responses import Response
from fastapi.openapi.utils import get_openapi


app = FastAPI(
    title="OpenPDF API",
    version="0.2.0",
)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title=app.title,
        version=app.version,
        routes=app.routes,
    )

    # Swagger UI currently has a problem rendering
    # arrays of UploadFile when FastAPI generates
    # OpenAPI 3.1 contentMediaType.
    #
    # Convert:
    #   contentMediaType: application/octet-stream
    #
    # into:
    #   type: string
    #   format: binary
    #
    # This makes Swagger UI display a file picker.

    components = schema.get(
        "components",
        {},
    ).get(
        "schemas",
        {},
    )

    for component in components.values():

        if not isinstance(component, dict):
            continue

        properties = component.get(
            "properties",
            {},
        )

        for prop in properties.values():

            if not isinstance(prop, dict):
                continue

            # Single file
            if (
                prop.get("type") == "string"
                and prop.get("contentMediaType")
                == "application/octet-stream"
            ):
                prop.pop(
                    "contentMediaType",
                    None,
                )

                prop["format"] = "binary"

            # Multiple files
            items = prop.get("items")

            if (
                isinstance(items, dict)
                and items.get("contentMediaType")
                == "application/octet-stream"
            ):
                items.pop(
                    "contentMediaType",
                    None,
                )

                items["type"] = "string"
                items["format"] = "binary"

    app.openapi_schema = schema

    return app.openapi_schema


app.openapi = custom_openapi


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