import { useCallback } from 'react'

import type {
  AnnotationRect,
  AnnotationType,
} from '../types/annotation'

import { clientRectToAnnotationRect } from '../utils/pdfCoordinates'

interface UsePDFSelectionOptions {
  zoom: number
  annotationMode: AnnotationType | null
  onAddAnnotation: (
    page: number,
    type: AnnotationType,
    rects: AnnotationRect[],
  ) => void
}

export default function usePDFSelection({
  zoom,
  annotationMode,
  onAddAnnotation,
}: UsePDFSelectionOptions) {
  const handleMouseUp = useCallback(
    () => {
      /*
       * Note does not use text selection.
       */
      if (
        !annotationMode ||
        annotationMode === 'note'
      ) {
        return
      }

      const selection = window.getSelection()

      if (!selection) {
        return
      }

      if (
        selection.isCollapsed ||
        selection.rangeCount === 0
      ) {
        return
      }

      const range = selection.getRangeAt(0)

      /*
       * Find selected page.
       */
      let element: Node | null =
        range.commonAncestorContainer

      if (
        element.nodeType ===
        Node.TEXT_NODE
      ) {
        element = element.parentElement
      }

      if (
        !(element instanceof HTMLElement)
      ) {
        return
      }

      const pageElement =
        element.closest(
          '.pdf-page-wrapper',
        )

      if (
        !(pageElement instanceof HTMLElement)
      ) {
        return
      }

      const pageNumber = Number(
        pageElement.dataset.page,
      )

      if (!pageNumber) {
        return
      }

      const pageContainer =
        pageElement.querySelector(
          '.pdf-page-container',
        )

      if (
        !(pageContainer instanceof HTMLElement)
      ) {
        return
      }

      /*
       * Get browser selection rectangles.
       */
      const selectionRects =
        Array.from(
          range.getClientRects(),
        )

      if (
        selectionRects.length === 0
      ) {
        return
      }

      const pageBounds =
        pageContainer.getBoundingClientRect()

      /*
       * Convert screen coordinates
       * to PDF coordinates.
       */
      const rects =
        selectionRects
          .map((rect) =>
            clientRectToAnnotationRect(
              rect,
              pageBounds,
              zoom,
            ),
          )
          .filter(
            (rect) =>
              rect.width > 1 &&
              rect.height > 1,
          )

      if (
        rects.length === 0
      ) {
        return
      }

      onAddAnnotation(
        pageNumber,
        annotationMode,
        rects,
      )

      /*
       * Clear browser selection.
       */
      selection.removeAllRanges()
    },
    [
      annotationMode,
      onAddAnnotation,
      zoom,
    ],
  )

  return {
    handleMouseUp,
  }
}