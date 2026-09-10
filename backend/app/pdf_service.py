import json

import pymupdf

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse, Response


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

SUPPORTED_ANNOTATION_TYPES = {
    'highlight',
    'underline',
    'strikeout',
    'text',
}


def point_to_xy(point):
    if hasattr(point, 'x') and hasattr(point, 'y'):
        return float(point.x), float(point.y)

    if isinstance(point, (tuple, list)) and len(point) >= 2:
        return float(point[0]), float(point[1])

    raise ValueError(
        f'Unsupported PDF point format: {point!r}'
    )


def vertices_to_rects(vertices):
    """
    Convert PDF text-markup QuadPoints into frontend rectangles.

    Text markup annotations normally have 4 points per quad:
        p1, p2, p3, p4

    A single annotation can contain multiple quads, for example
    when a highlight spans multiple lines.
    """
    if not vertices:
        return []

    rects = []

    for index in range(0, len(vertices), 4):
        quad = vertices[index:index + 4]

        if len(quad) < 4:
            break

        points = [
            point_to_xy(point)
            for point in quad
        ]

        xs = [point[0] for point in points]
        ys = [point[1] for point in points]

        x0 = min(xs)
        y0 = min(ys)
        x1 = max(xs)
        y1 = max(ys)

        width = x1 - x0
        height = y1 - y0

        if width <= 0 or height <= 0:
            continue

        rects.append({
            'x': x0,
            'y': y0,
            'width': width,
            'height': height,
        })

    return rects


def annot_to_api_annotation(page_number, annot):
    """
    Convert a PyMuPDF Annot object to the frontend Annotation format.
    """

    annot_type = annot.type

    # PyMuPDF annot.type is typically:
    # [number, "Highlight", ...]
    type_name = ''

    if annot_type and len(annot_type) >= 2:
        type_name = str(
            annot_type[1]
        ).strip().lower()

    if type_name not in SUPPORTED_ANNOTATION_TYPES:
        return None

    if type_name == 'text':
        rect = annot.rect

        rects = [
            {
                'x': float(rect.x0),
                'y': float(rect.y0),
                'width': float(rect.width),
                'height': float(rect.height),
            }
        ]

        info = annot.info or {}

        return {
            'id': f'pdf-{page_number}-{annot.xref}',
            'xref': int(annot.xref),
            'page': page_number,
            'type': 'note',
            'rects': rects,
            'text': info.get('content', ''),
        }

    # Highlight / Underline / StrikeOut
    rects = vertices_to_rects(
        annot.vertices
    )

    # Some PDFs may not expose vertices correctly.
    # Fall back to the annotation bounding box.
    if not rects:
        rect = annot.rect

        rects = [
            {
                'x': float(rect.x0),
                'y': float(rect.y0),
                'width': float(rect.width),
                'height': float(rect.height),
            }
        ]

    frontend_type = type_name

    if frontend_type == 'strikeout':
        frontend_type = 'strikeout'

    return {
        'id': f'pdf-{page_number}-{annot.xref}',
        'xref': int(annot.xref),
        'page': page_number,
        'type': frontend_type,
        'rects': rects,
        'text': '',
    }


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
# Save Annotations
# ============================================================

def parse_annotations(
    annotations: str,
) -> list[dict]:
    """
    Parse annotation JSON received from the frontend.

    Expected format:

    [
        {
            "id": "...",
            "page": 1,
            "type": "highlight",
            "rects": [
                {
                    "x": 100,
                    "y": 150,
                    "width": 200,
                    "height": 20
                }
            ],
            "text": "..."
        }
    ]
    """

    if not annotations.strip():
        return []

    try:
        data = json.loads(annotations)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid annotations JSON: {exc}",
        )

    if not isinstance(data, list):
        raise HTTPException(
            status_code=400,
            detail="Annotations must be a JSON array.",
        )

    return data


def parse_annotation_rect(
    rect: dict,
) -> pymupdf.Rect:
    """Convert frontend annotation rect to PyMuPDF Rect."""

    try:
        x = float(rect["x"])
        y = float(rect["y"])
        width = float(rect["width"])
        height = float(rect["height"])
    except (KeyError, TypeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Invalid annotation rectangle.",
        )

    if width <= 0 or height <= 0:
        raise HTTPException(
            status_code=400,
            detail="Annotation rectangle must have positive width and height.",
        )

    return pymupdf.Rect(
        x,
        y,
        x + width,
        y + height,
    )


def add_pdf_annotation(
    page: pymupdf.Page,
    annotation: dict,
) -> None:
    """
    Add one frontend annotation to a PDF page.

    Supported types:
        highlight
        underline
        strikeout
        note
    """

    annotation_type = annotation.get("type")

    if annotation_type not in {
        "highlight",
        "underline",
        "strikeout",
        "note",
    }:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported annotation type: {annotation_type}",
        )

    rects = annotation.get("rects")

    if not isinstance(rects, list) or not rects:
        raise HTTPException(
            status_code=400,
            detail="Annotation must contain at least one rectangle.",
        )

    pdf_rects = [
        parse_annotation_rect(rect)
        for rect in rects
    ]

    # --------------------------------------------------------
    # Highlight
    # --------------------------------------------------------

    if annotation_type == "highlight":
        annot = page.add_highlight_annot(
            pdf_rects
        )

        annot.set_colors(
            stroke=(1, 0.9, 0)
        )

        annot.update()

        return

    # --------------------------------------------------------
    # Underline
    # --------------------------------------------------------

    if annotation_type == "underline":
        annot = page.add_underline_annot(
            pdf_rects
        )

        annot.set_colors(
            stroke=(0.15, 0.4, 0.9)
        )

        annot.update()

        return

    # --------------------------------------------------------
    # Strikeout
    # --------------------------------------------------------

    if annotation_type == "strikeout":
        annot = page.add_strikeout_annot(
            pdf_rects
        )

        annot.set_colors(
            stroke=(0.85, 0.15, 0.15)
        )

        annot.update()

        return

    # --------------------------------------------------------
    # Note
    # --------------------------------------------------------

    if annotation_type == "note":
        rect = pdf_rects[0]

        # PDF sticky-note annotations use a point/rect
        # location. Keep the frontend position and use
        # the annotation text as the comment.
        annot = page.add_text_annot(
            rect.tl,
            annotation.get("text", ""),
        )

        annot.update()

        return

@router.post('/save-annotations')
async def save_annotations(
    file: UploadFile = File(...),
    annotations: str = Form(...),
):
    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail='Empty PDF file.',
        )

    try:
        annotation_data = json.loads(
            annotations
        )
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail='Invalid annotation JSON.',
        )

    if not isinstance(
        annotation_data,
        list,
    ):
        raise HTTPException(
            status_code=400,
            detail='Annotations must be a list.',
        )

    try:
        doc = pymupdf.open(
            stream=contents,
            filetype='pdf',
        )
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f'Unable to open PDF: {exc}',
        )

    supported_types = {
        'highlight',
        'underline',
        'strikeout',
        'text',
    }

    try:

        existing_annotations = {}

        for page_index in range(
            doc.page_count
        ):
            page = doc[page_index]

            page_number = page_index + 1

            for annot in page.annots() or []:
                annot_type = annot.type

                type_name = ''

                if (
                    annot_type
                    and len(annot_type) >= 2
                ):
                    type_name = str(
                        annot_type[1]
                    ).strip().lower()

                if (
                    type_name
                    not in supported_types
                ):
                    continue

                existing_annotations[
                    int(annot.xref)
                ] = {
                    'page': page_number,
                    'annot': annot,
                    'type': type_name,
                }

        requested_xrefs = set()

        for annotation in annotation_data:

            if not isinstance(
                annotation,
                dict,
            ):
                continue

            xref = annotation.get(
                'xref'
            )

            if xref is None:
                continue

            try:
                requested_xrefs.add(
                    int(xref)
                )
            except (
                TypeError,
                ValueError,
            ):
                continue

        for xref, item in (
            existing_annotations.items()
        ):

            if xref in requested_xrefs:
                continue

            page_number = item['page']

            page = doc[
                page_number - 1
            ]

            annot = page.load_annot(
                xref
            )

            if annot is not None:
                page.delete_annot(
                    annot
                )

        for annotation in annotation_data:

            if not isinstance(
                annotation,
                dict,
            ):
                continue

            xref = annotation.get(
                'xref'
            )

            if xref is not None:
                continue

            page_number = annotation.get(
                'page'
            )

            if not isinstance(
                page_number,
                int,
            ):
                continue

            if (
                page_number < 1
                or page_number > doc.page_count
            ):
                continue

            page = doc[
                page_number - 1
            ]

            add_pdf_annotation(
                page,
                annotation,
            )

        output = doc.tobytes(
            garbage=4,
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f'Failed to save annotations: {exc}',
        )

    finally:
        doc.close()


    return Response(
        content=output,
        media_type='application/pdf',
        headers={
            'Content-Disposition':
                'attachment; filename="annotated.pdf"',
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

        for page_index in sorted(
            set(page_indexes),
            reverse=True,
        ):
            doc.delete_page(page_index)

        if len(doc) == 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete all pages from the PDF.",
            )

        return document_response(doc)

    except Exception:
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
            # Other pages -> insert duplicate immediately
            # after original
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

# ============================================================
# Annotations
# ============================================================    
@router.post('/annotations')
async def read_annotations(
    file: UploadFile = File(...),
):
    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail='Empty PDF file',
        )

    try:
        doc = pymupdf.open(
            stream=contents,
            filetype='pdf',
        )
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f'Unable to open PDF: {exc}',
        )

    annotations = []

    try:
        for page_index in range(doc.page_count):
            page = doc[page_index]

            page_number = page_index + 1

            for annot in page.annots() or []:
                annotation = annot_to_api_annotation(
                    page_number,
                    annot,
                )

                if annotation is not None:
                    annotations.append(
                        annotation
                    )

    finally:
        doc.close()

    return annotations