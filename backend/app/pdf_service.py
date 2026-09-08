import pymupdf

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse


router = APIRouter()


# ============================================================
# Helpers
# ============================================================

def open_pdf(data: bytes) -> pymupdf.Document:
    """Open PDF from bytes and convert invalid PDFs to HTTP 400."""
    try:
        return pymupdf.open(stream=data, filetype="pdf")
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid PDF file: {exc}",
        )


async def read_pdf(file: UploadFile) -> pymupdf.Document:
    """Read uploaded PDF and open it with PyMuPDF."""
    data = await file.read()
    return open_pdf(data)


def parse_page_numbers(
    pages: str,
    page_count: int,
) -> list[int]:
    """
    Parse comma-separated 1-based page numbers.

    Example:
        "1,3,5" -> [0,2,4]
    """

    if not pages.strip():
        raise HTTPException(
            status_code=400,
            detail="No pages specified.",
        )

    try:
        numbers = [
            int(page.strip())
            for page in pages.split(",")
            if page.strip()
        ]
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid page numbers.",
        )

    if not numbers:
        raise HTTPException(
            status_code=400,
            detail="No pages specified.",
        )

    zero_based = []

    for page_number in numbers:
        if page_number < 1 or page_number > page_count:
            raise HTTPException(
                status_code=400,
                detail=f"Page {page_number} does not exist.",
            )

        zero_based.append(page_number - 1)

    return zero_based


def document_response(
    doc: pymupdf.Document,
    filename: str = "modified.pdf",
) -> StreamingResponse:
    """
    Convert a PyMuPDF document to PDF bytes and return
    it as a streaming HTTP response.
    """

    try:
        output = doc.tobytes()
    finally:
        doc.close()

    return StreamingResponse(
        iter([output]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


# ============================================================
# Delete Pages
# ============================================================

@router.post(
    "/delete-pages",
    response_class=StreamingResponse,
    responses={
        200: {
            "content": {
                "application/pdf": {}
            }
        }
    },
)
async def delete_pages(
    file: UploadFile = File(...),
    pages: str = Form(...),
):
    """
    Delete selected pages.

    pages:
        Comma-separated 1-based page numbers.

    Example:
        1,3,5
    """

    doc = await read_pdf(file)

    try:
        page_indexes = parse_page_numbers(
            pages,
            len(doc),
        )

        # Delete from highest index to lowest index so that
        # deleting one page does not change indexes of pages
        # that are still waiting to be deleted.
        for page_index in sorted(set(page_indexes), reverse=True):
            doc.delete_page(page_index)

        if len(doc) == 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete all pages from the PDF.",
            )

        return document_response(doc)

    except Exception:
        # document_response() already closes the document
        # on success. Close it here when an exception occurs.
        if not doc.is_closed:
            doc.close()

        raise


# ============================================================
# Rotate Pages
# ============================================================

@router.post(
    "/rotate-pages",
    response_class=StreamingResponse,
    responses={
        200: {
            "content": {
                "application/pdf": {}
            }
        }
    },
)
async def rotate_pages(
    file: UploadFile = File(...),
    pages: str = Form(...),
    angle: int = Form(...),
):
    """
    Rotate selected pages.

    angle:
        90, 180 or 270 degrees.
    """

    if angle not in (90, 180, 270):
        raise HTTPException(
            status_code=400,
            detail="Angle must be 90, 180 or 270.",
        )

    doc = await read_pdf(file)

    try:
        page_indexes = parse_page_numbers(
            pages,
            len(doc),
        )

        for page_index in page_indexes:
            page = doc[page_index]

            page.set_rotation(
                (page.rotation + angle) % 360
            )

        return document_response(doc)

    except Exception:
        if not doc.is_closed:
            doc.close()

        raise


# ============================================================
# Reorder Pages
# ============================================================

@router.post(
    "/reorder-pages",
    response_class=StreamingResponse,
    responses={
        200: {
            "content": {
                "application/pdf": {}
            }
        }
    },
)
async def reorder_pages(
    file: UploadFile = File(...),
    order: str = Form(...),
):
    """
    Reorder all pages.

    order:
        New page order using 1-based page numbers.

    Example:
        3,1,2,4
    """

    doc = await read_pdf(file)

    try:
        if not order.strip():
            raise HTTPException(
                status_code=400,
                detail="No page order specified.",
            )

        try:
            new_order = [
                int(page.strip())
                for page in order.split(",")
                if page.strip()
            ]
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid page order.",
            )

        page_count = len(doc)

        if len(new_order) != page_count:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Page order must contain every page "
                    "exactly once."
                ),
            )

        expected = set(range(1, page_count + 1))

        if set(new_order) != expected:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Page order must contain each page "
                    "exactly once."
                ),
            )

        zero_based_order = [
            page - 1
            for page in new_order
        ]

        doc.select(zero_based_order)

        return document_response(doc)

    except Exception:
        if not doc.is_closed:
            doc.close()

        raise


# ============================================================
# Duplicate Page
# ============================================================

@router.post(
    "/duplicate-page",
    response_class=StreamingResponse,
    responses={
        200: {
            "content": {
                "application/pdf": {}
            }
        }
    },
)
async def duplicate_page(
    file: UploadFile = File(...),
    page: int = Form(...),
):
    """
    Duplicate a page and insert the copy immediately
    after the original page.
    """

    doc = await read_pdf(file)

    try:
        if page < 1 or page > len(doc):
            raise HTTPException(
                status_code=400,
                detail=f"Page {page} does not exist.",
            )

        page_index = page - 1

        if page_index == len(doc) - 1:
        # Last page -> append duplicate to the end
            doc.fullcopy_page(page_index)
        else:
        # Other pages -> insert duplicate immediately after original
            doc.fullcopy_page(
                page_index,
                page_index + 1,
            )

        return document_response(doc)

    except Exception:
        if not doc.is_closed:
            doc.close()

        raise


# ============================================================
# Extract Pages
# ============================================================

@router.post(
    "/extract-pages",
    response_class=StreamingResponse,
    responses={
        200: {
            "content": {
                "application/pdf": {}
            }
        }
    },
)
async def extract_pages(
    file: UploadFile = File(...),
    pages: str = Form(...),
):
    """
    Extract selected pages into a new PDF.

    Supports both contiguous and non-contiguous pages.

    Examples:
        1,2,3
        1,3,5
        5,2,7
    """

    source = await read_pdf(file)

    try:
        page_indexes = parse_page_numbers(
            pages,
            len(source),
        )

        output = pymupdf.open()

        try:
            # Insert each selected page individually.
            # This correctly supports non-contiguous pages.
            for page_index in page_indexes:
                output.insert_pdf(
                    source,
                    from_page=page_index,
                    to_page=page_index,
                )

        except Exception:
            output.close()
            raise

        finally:
            source.close()

        return document_response(
            output,
            filename="extracted.pdf",
        )

    except Exception:
        if not source.is_closed:
            source.close()

        raise