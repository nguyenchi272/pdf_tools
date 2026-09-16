import {
  useEffect,
  useRef,
  useState,
} from 'react'

import * as pdfjsLib from 'pdfjs-dist'

import pdfWorker from
  'pdfjs-dist/build/pdf.worker.min.mjs?url'

import 'pdfjs-dist/web/pdf_viewer.css'

import type {
  Annotation,
  AnnotationRect,
  AnnotationType,
} from '../types/annotation'

import PDFPage from './pdf/PDFPage'
import { loadAnnotations } from '../api/pdfApi'
import type { TextElement } from '../types/text'
import type { ResizeHandle } from '../hooks/useTextElements'


pdfjsLib.GlobalWorkerOptions.workerSrc =
  pdfWorker


interface PDFViewerProps {
  pdfUrl: string

  zoom: number

  rotation: number

  currentPage: number

  annotations: Annotation[]

  annotationMode:
    | AnnotationType
    | null

  textMode: boolean

  textElements: TextElement[]

  selectedTextId:
    string | null

  onSelectText: (
    id: string | null,
  ) => void

  onAddText: (
    page: number,
    x: number,
    y: number,
    text: string,
  ) => void

  onUpdateText: (
    id: string,
    text: string,
  ) => void

  onUpdateTextFontSize: (
    id: string,
    fontSize: number,
  ) => void

  onRemoveText: (
    id: string,
  ) => void

  onMoveText: (
    id: string,
    x: number,
    y: number,
  ) => void

  onBeginMoveText: () => void
  onEndMoveText: () => void
  
  onBeginResizeText: (
    id: string,
  ) => void

  onResizeText: (
    id: string,
    handle: ResizeHandle,
    deltaX: number,
    deltaY: number,
  ) => void

  onEndResizeText: () => void

  onAddAnnotation: (
    page: number,
    type: AnnotationType,
    rects: AnnotationRect[],
  ) => void

  onAddNote: (
    page: number,
    x: number,
    y: number,
    text: string,
  ) => void

  onRemoveAnnotation: (
    id: string,
  ) => void

  onLoadAnnotations: (
    annotations: Annotation[],
  ) => void

  onNumPages: (
    pages: number,
  ) => void

  onPageChange: (
    page: number,
  ) => void
}


export default function PDFViewer({
  pdfUrl,

  zoom,
  rotation,

  currentPage,

  annotations,
  annotationMode,

  textMode,
  textElements,
  selectedTextId,
  onSelectText,

  onAddAnnotation,
  onAddNote,
  onRemoveAnnotation,

  onBeginResizeText,
  onResizeText,
  onEndResizeText,

  onLoadAnnotations,

  onAddText,
  onUpdateText,
  onUpdateTextFontSize,
  onRemoveText,
  onMoveText,
  onBeginMoveText,
  onEndMoveText,

  onNumPages,
  onPageChange,
}: PDFViewerProps) {
  const containerRef =
    useRef<HTMLDivElement>(
      null,
    )


  const pageRefs =
    useRef<
      Map<
        number,
        HTMLDivElement
      >
    >(new Map())


  const [
    pdf,
    setPdf,
  ] =
    useState<
      pdfjsLib.PDFDocumentProxy | null
    >(null)


  /*
   * =====================================================
   * LOAD PDF
   * =====================================================
   */

  useEffect(() => {
    if (!pdfUrl) {
      setPdf(null)
      return
    }


    let cancelled = false


    const loadingTask =
      pdfjsLib.getDocument({
        url: pdfUrl,
      })


    loadingTask.promise
      .then((document) => {
        if (cancelled) {
          return
        }


        setPdf(document)

        onNumPages(
          document.numPages,
        )
      })

      .catch((error) => {
        if (!cancelled) {
          console.error(
            'Failed to load PDF:',
            error,
          )
        }
      })


    return () => {
      cancelled = true

      loadingTask.destroy()
    }
  }, [
    pdfUrl,
    onNumPages,
  ])


  /*
  * =====================================================
  * LOAD NATIVE PDF ANNOTATIONS
  * =====================================================
  *
  * The backend reads annotations directly from
  * the current PDF using PyMuPDF.
  *
  * Every time pdfUrl changes, reload annotations.
  */

  useEffect(() => {

    if (!pdfUrl) {
      onLoadAnnotations([])
      return
    }

    let cancelled = false

    /*
    * Clear previous document annotations immediately.
    *
    * This prevents annotations from the previous PDF
    * from being displayed while the new PDF is loading.
    */
    onLoadAnnotations([])

    const fetchAnnotations = async () => {

      try {

        const loadedAnnotations =
          await loadAnnotations(
            pdfUrl,
          )

        if (cancelled) {
          return
        }

        onLoadAnnotations(
          loadedAnnotations,
        )

      } catch (error) {

        if (cancelled) {
          return
        }

        console.error(
          'Failed to load PDF annotations:',
          error,
        )

      }

    }

    fetchAnnotations()

    return () => {
      cancelled = true
    }

  }, [
    pdfUrl,
    onLoadAnnotations,
  ])


  /*
   * =====================================================
   * REGISTER PAGE REF
   * =====================================================
   */

  const registerPageRef =
    (
      pageNumber: number,
      element:
        HTMLDivElement | null,
    ) => {
      if (element) {
        pageRefs.current.set(
          pageNumber,
          element,
        )
      } else {
        pageRefs.current.delete(
          pageNumber,
        )
      }
    }


  /*
   * =====================================================
   * TRACK VISIBLE PAGE
   * =====================================================
   */

  useEffect(() => {
    const container =
      containerRef.current


    if (!container || !pdf) {
      return
    }


    const elements =
      Array.from(
        pageRefs.current.values(),
      )


    if (
      elements.length === 0
    ) {
      return
    }


    const observer =
      new IntersectionObserver(
        (entries) => {
          const visible =
            entries
              .filter(
                (entry) =>
                  entry.isIntersecting,
              )

              .sort(
                (a, b) =>
                  b.intersectionRatio -
                  a.intersectionRatio,
              )


          if (
            visible.length === 0
          ) {
            return
          }


          const element =
            visible[0]
              .target as HTMLElement


          const page =
            Number(
              element.dataset.page,
            )


          if (page) {
            onPageChange(
              page,
            )
          }
        },

        {
          root:
            container,

          threshold: [
            0.25,
            0.5,
            0.75,
          ],
        },
      )


    elements.forEach(
      (element) => {
        observer.observe(
          element,
        )
      },
    )


    return () => {
      observer.disconnect()
    }
  }, [
    pdf,
    onPageChange,
  ])


  /*
   * =====================================================
   * NAVIGATE TO CURRENT PAGE
   * =====================================================
   */

  useEffect(() => {
    const page =
      pageRefs.current.get(
        currentPage,
      )


    if (!page) {
      return
    }


    page.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [
    currentPage,
  ])


  /*
   * =====================================================
   * EMPTY VIEWER
   * =====================================================
   */

  if (!pdf) {
    return (
      <div
        ref={containerRef}
        className="pdf-viewer"
      />
    )
  }


  /*
   * =====================================================
   * PDF VIEWER
   * =====================================================
   */

  return (
    <div
      ref={containerRef}
      className="pdf-viewer"
    >
      {Array.from(
        {
          length:
            pdf.numPages,
        },

        (_, index) => {
          const pageNumber =
            index + 1


          return (
            <PDFPage
              key={
                pageNumber
              }

              pdf={
                pdf
              }

              pageNumber={
                pageNumber
              }

              zoom={
                zoom
              }

              rotation={
                rotation
              }

              annotations={
                annotations
              }

              annotationMode={
                annotationMode
              }

              textMode={textMode}

              textElements={textElements}

              selectedTextId={
                selectedTextId
              }

              onSelectText={
                onSelectText
              }

              onAddText={onAddText}

              onUpdateText={onUpdateText}

              onUpdateTextFontSize={onUpdateTextFontSize}

              onMoveText={onMoveText}

              onBeginMoveText={onBeginMoveText}

              onEndMoveText={onEndMoveText}

              onBeginResizeText={onBeginResizeText}

              onResizeText={onResizeText}

              onEndResizeText={onEndResizeText}

              onRemoveText={onRemoveText}

              onAddAnnotation={
                onAddAnnotation
              }

              onAddNote={
                onAddNote
              }

              onRemoveAnnotation={
                onRemoveAnnotation
              }

              onPageRef={
                registerPageRef
              }
            />
          )
        },
      )}
    </div>
  )
}