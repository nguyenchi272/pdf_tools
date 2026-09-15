import {
  useEffect,
  useRef,
  useState,
} from 'react'

import * as pdfjsLib from 'pdfjs-dist'

import type {
  Annotation,
  AnnotationRect,
  AnnotationType,
} from '../../types/annotation'

import type { TextElement } from '../../types/text'

import TextEditor from './TextEditor'

import PDFAnnotationLayer from './PDFAnnotationLayer'

import NoteEditor from './NoteEditor'

import {
  pointToPDFCoordinates,
} from '../../utils/pdfCoordinates'
import PDFTextLayer from './PDFTextLayer'


interface PDFPageProps {
  pdf: pdfjsLib.PDFDocumentProxy

  pageNumber: number

  zoom: number

  rotation: number

  annotations: Annotation[]

  annotationMode:
    | AnnotationType
    | null

  textMode: boolean

  textElements: TextElement[]

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

  onMoveText: (
    id: string,
    x: number,
    y: number,
  ) => void

  onBeginMoveText: () => void
  onEndMoveText: () => void

  onRemoveText: (
    id: string,
  ) => void

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

  onRemoveAnnotation: (id: string) => void

  onPageRef: (
    page: number,
    element: HTMLDivElement | null,
  ) => void
}


export default function PDFPage({
  pdf,
  pageNumber,

  zoom,
  rotation,

  annotations,
  annotationMode,

  textMode,
  textElements,

  onAddAnnotation,
  onAddNote,

  onAddText,
  onUpdateText,
  onMoveText,
  onBeginMoveText,
  onEndMoveText,
  onRemoveText,

  onRemoveAnnotation,

  onPageRef,
}: PDFPageProps) {
  const canvasRef =
    useRef<HTMLCanvasElement>(
      null,
    )

  const textLayerRef =
    useRef<HTMLDivElement>(
      null,
    )

  const pageContainerRef =
    useRef<HTMLDivElement>(
      null,
    )


  const [page, setPage] =
    useState<pdfjsLib.PDFPageProxy | null>(
      null,
    )


  const [
    viewportSize,
    setViewportSize,
  ] = useState({
    width: 0,
    height: 0,
  })


  const [
    noteEditor,
    setNoteEditor,
  ] = useState<{
    x: number
    y: number
    screenX: number
    screenY: number
  } | null>(null)

  const [
    textEditor,
    setTextEditor,
  ] = useState<{
    x: number
    y: number
    screenX: number
    screenY: number
  } | null>(null)

    const [
    textValue,
    setTextValue,
  ] = useState('')

  const [
    selectedTextId,
    setSelectedTextId,
    ] = useState<string | null>(null)

  const [
    draggingText,
    setDraggingText,
  ] = useState<{
    id: string
    startMouseX: number
    startMouseY: number
    startX: number
    startY: number
  } | null>(null)


  const [
    noteText,
    setNoteText,
  ] = useState('')


  /*
   * =====================================================
   * move mouse
   * =====================================================
   */

  useEffect(() => {
    if (!draggingText) {
        return
    }

    const handleMouseMove = (
        event: MouseEvent,
    ) => {
        const deltaX =
        (event.clientX -
            draggingText.startMouseX) /
        zoom

        const deltaY =
        (event.clientY -
            draggingText.startMouseY) /
        zoom

        const newX =
        draggingText.startX +
        deltaX

        const newY =
        draggingText.startY +
        deltaY

        onMoveText(
        draggingText.id,
        newX,
        newY,
        )
    }

    const handleMouseUp = () => {
        onEndMoveText(),
        setDraggingText(null)
    }

    window.addEventListener(
        'mousemove',
        handleMouseMove,
    )

    window.addEventListener(
        'mouseup',
        handleMouseUp,
    )

    return () => {
        window.removeEventListener(
        'mousemove',
        handleMouseMove,
        )

        window.removeEventListener(
        'mouseup',
        handleMouseUp,
        )
    }
    }, [
    draggingText,
    zoom,
    onMoveText,
    onEndMoveText,
    ])

  /*
   * =====================================================
   * Delete by keyboard
   * =====================================================
   */
  useEffect(() => {
    const handleKeyDown = (
        event: KeyboardEvent,
    ) => {
        if (!selectedTextId) {
        return
        }

        if (
        event.key !== 'Delete' &&
        event.key !== 'Backspace'
        ) {
        return
        }

        if (textEditor) {
        return
        }

        event.preventDefault()

        onRemoveText(selectedTextId)

        setSelectedTextId(null)
    }

    window.addEventListener(
        'keydown',
        handleKeyDown,
    )

    return () => {
        window.removeEventListener(
        'keydown',
        handleKeyDown,
        )
    }
    }, [
    selectedTextId,
    textEditor,
    onRemoveText,
    ])

  /*
   * =====================================================
   * LOAD PAGE
   * =====================================================
   */

  useEffect(() => {
    let cancelled = false

    setPage(null)

    pdf.getPage(pageNumber)
      .then((loadedPage) => {
        if (!cancelled) {
          setPage(
            loadedPage,
          )
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error(
            `Failed to load page ${pageNumber}:`,
            error,
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    pdf,
    pageNumber,
  ])


  /*
   * =====================================================
   * RENDER CANVAS + TEXT LAYER
   * =====================================================
   */

  useEffect(() => {
    if (!page) {
      return
    }

    let cancelled = false

    const renderPage =
      async () => {
        const canvas =
          canvasRef.current

        const textLayer =
          textLayerRef.current

        if (
          !canvas ||
          !textLayer
        ) {
          return
        }


        /*
         * Clear previous text.
         */

        textLayer.innerHTML = ''


        /*
         * Create viewport.
         */

        const viewport =
          page.getViewport({
            scale: zoom,
            rotation,
          })


        if (cancelled) {
          return
        }


        setViewportSize({
          width:
            viewport.width,

          height:
            viewport.height,
        })


        /*
         * =================================================
         * CANVAS
         * =================================================
         */

        canvas.width =
          Math.ceil(
            viewport.width,
          )

        canvas.height =
          Math.ceil(
            viewport.height,
          )

        canvas.style.width =
          `${viewport.width}px`

        canvas.style.height =
          `${viewport.height}px`


        /*
         * =================================================
         * TEXT LAYER
         * =================================================
         */

        textLayer.style.width =
          `${viewport.width}px`

        textLayer.style.height =
          `${viewport.height}px`

        textLayer.style.setProperty(
          '--scale-factor',
          String(zoom),
        )

        textLayer.style.setProperty(
          '--total-scale-factor',
          String(zoom),
        )


        /*
         * =================================================
         * RENDER CANVAS
         * =================================================
         */

        const context =
          canvas.getContext(
            '2d',
          )

        if (!context) {
          return
        }


        await page.render({
          canvas,
          canvasContext:
            context,
          viewport,
          annotationMode: pdfjsLib.AnnotationMode.DISABLE,
        }).promise


        if (cancelled) {
          return
        }


        /*
         * =================================================
         * TEXT CONTENT
         * =================================================
         */

        const textContent =
          await page.getTextContent()


        if (cancelled) {
          return
        }


        /*
         * =================================================
         * TEXT LAYER
         * =================================================
         */

        const textLayerInstance =
          new pdfjsLib.TextLayer({
            textContentSource:
              textContent,

            container:
              textLayer,

            viewport,
          })


        await textLayerInstance.render()
      }


    renderPage().catch(
      (error) => {
        if (!cancelled) {
          console.error(
            `Failed to render page ${pageNumber}:`,
            error,
          )
        }
      },
    )


    return () => {
      cancelled = true
    }
  }, [
    page,
    pageNumber,
    zoom,
    rotation,
  ])


  /*
   * =====================================================
   * TEXT SELECTION
   * =====================================================
   */

  const handleMouseUp =
    () => {
      /*
       * Note does not use
       * text selection.
       */

      if (
        !annotationMode ||
        annotationMode === 'note'
      ) {
        return
      }


      const selection =
        window.getSelection()


      if (!selection) {
        return
      }


      if (
        selection.isCollapsed ||
        selection.rangeCount === 0
      ) {
        return
      }


      const range =
        selection.getRangeAt(0)


      /*
       * Find selected page.
       */

      let node:
        | Node
        | null =
        range.commonAncestorContainer


      if (
        node.nodeType ===
        Node.TEXT_NODE
      ) {
        node =
          node.parentElement
      }


      if (
        !(node instanceof HTMLElement)
      ) {
        return
      }


      const pageElement =
        node.closest(
          '.pdf-page-wrapper',
        )


      if (
        !(pageElement instanceof HTMLElement)
      ) {
        return
      }


      const selectedPage =
        Number(
          pageElement.dataset.page,
        )


      if (
        selectedPage !==
        pageNumber
      ) {
        return
      }


      /*
       * Get page container.
       */

      const pageContainer =
        pageContainerRef.current


      if (!pageContainer) {
        return
      }


      /*
       * Get selection rectangles.
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
       * Convert to PDF coordinates.
       */

      const rects:
        AnnotationRect[] =
        selectionRects
          .map(
            (rect) => ({
              x:
                (
                  rect.left -
                  pageBounds.left
                ) / zoom,

              y:
                (
                  rect.top -
                  pageBounds.top
                ) / zoom,

              width:
                rect.width /
                zoom,

              height:
                rect.height /
                zoom,
            }),
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


      /*
       * Create annotation.
       */

      onAddAnnotation(
        pageNumber,
        annotationMode,
        rects,
      )


      /*
       * Clear browser selection.
       */

      selection.removeAllRanges()
    }


  /*
   * =====================================================
   * NOTE CLICK
   * =====================================================
   */

  const handleClick =
  (
    event:
      React.MouseEvent<HTMLDivElement>,
  ) => {
    const target =
      event.target as HTMLElement

    /*
     * Do not create a new editor
     * when clicking inside an editor.
     */
    if (
        target.closest(
        '.pdf-text-element',
        )
    ) {
        return
    }

    if (
      target.closest(
        '.note-editor, .text-editor',
      )
    ) {
      return
    }

    setSelectedTextId(null)

    const pageContainer =
      pageContainerRef.current

    if (!pageContainer) {
      return
    }

    const pageBounds =
      pageContainer.getBoundingClientRect()

    /*
     * =================================================
     * ADD TEXT
     * =================================================
     */

    if (textMode) {
      const point =
        pointToPDFCoordinates(
          event.clientX,
          event.clientY,
          pageBounds,
          zoom,
        )

      setTextEditor({
        x: point.x,
        y: point.y,

        screenX:
          event.clientX,

        screenY:
          event.clientY,
      })

      setTextValue('')

      return
    }

    /*
     * =================================================
     * NOTE
     * =================================================
     */

    if (
      annotationMode !== 'note'
    ) {
      return
    }

    const point =
      pointToPDFCoordinates(
        event.clientX,
        event.clientY,
        pageBounds,
        zoom,
      )

    setNoteEditor({
      x: point.x,
      y: point.y,

      screenX:
        event.clientX,

      screenY:
        event.clientY,
    })

    setNoteText('')
  }

    /*
   * =====================================================
   * TEXT SAVE
   * =====================================================
   */

    const handleSaveText = () => {
    if (!textEditor) return

    const text = textValue.trim()

    if (text) {
        if (selectedTextId) {
        onUpdateText(
            selectedTextId,
            text,
        )
        } else {
        onAddText(
            pageNumber,
            textEditor.x,
            textEditor.y,
            text,
        )
        }
    }

    setTextEditor(null)
    setTextValue('')
    setSelectedTextId(null)
    }

  const handleCancelText = () => {
    setTextEditor(null)
    setTextValue('')
    setSelectedTextId(null)
  }

  /*
   * =====================================================
   * EDIT TEXT
   * =====================================================
   */
  const handleEditText = (
    element: TextElement,
    ) => {
    const pageContainer =
        pageContainerRef.current

    if (!pageContainer) {
        return
    }

    const bounds =
        pageContainer.getBoundingClientRect()

    setSelectedTextId(
        element.id,
    )

    setTextValue(
        element.text,
    )

    setTextEditor({
        x: element.x,
        y: element.y,

        screenX:
        bounds.left +
        element.x * zoom,

        screenY:
        bounds.top +
        element.y * zoom,
    })
    }

  const handleStartDragText = (
    event: React.MouseEvent,
    element: TextElement,
  ) => {
    if (textEditor) {
        return
    }

    const pageContainer =
        pageContainerRef.current

    if (!pageContainer) {
        return
    }

    event.preventDefault()

    setSelectedTextId(
        element.id,
    )

    onBeginMoveText()

    setDraggingText({
        id: element.id,

        startMouseX:
        event.clientX,

        startMouseY:
        event.clientY,

        startX:
        element.x,

        startY:
        element.y,
    })
  }


  /*
   * =====================================================
   * NOTE SAVE
   * =====================================================
   */

  const handleSaveNote =
    () => {
      if (!noteEditor) {
        return
      }


      const text =
        noteText.trim()


      if (!text) {
        return
      }


      onAddNote(
        pageNumber,

        noteEditor.x,
        noteEditor.y,

        text,
      )


      setNoteEditor(null)
      setNoteText('')
    }


  /*
   * =====================================================
   * NOTE CANCEL
   * =====================================================
   */

  const handleCancelNote =
    () => {
      setNoteEditor(null)
      setNoteText('')
    }


  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <div
      ref={(element) =>
        onPageRef(
          pageNumber,
          element,
        )
      }

      className="pdf-page-wrapper"

      data-page={
        pageNumber
      }

      onMouseUp={
        handleMouseUp
      }

      onClick={
        handleClick
      }
    >
      <div className="page-number-label">
        Page {pageNumber}
      </div>


      <div
        ref={pageContainerRef}

        className="pdf-page-container"

        style={{
          width:
            `${viewportSize.width}px`,

          height:
            `${viewportSize.height}px`,
        }}
      >
        <canvas
          ref={canvasRef}

          className="pdf-page"
        />


        <div
          ref={textLayerRef}

          className="textLayer"
        />

        <PDFTextLayer
            elements={
                textElements
            }
            pageNumber={
                pageNumber
            }
            zoom={
                zoom
            }
            selectedTextId={selectedTextId}

            onSelectText={setSelectedTextId}

            onEditText={handleEditText}

            onStartDragText={handleStartDragText}

          />


        <PDFAnnotationLayer
          annotations={
            annotations
          }

          pageNumber={
            pageNumber
          }

          zoom={
            zoom
          }

          width={
            viewportSize.width
          }

          height={
            viewportSize.height
          }

          onRemoveAnnotation={
            onRemoveAnnotation
          }
        />
      </div>

      {textEditor && (
        <TextEditor
            x={textEditor.screenX}
            y={textEditor.screenY}
            value={textValue}
            fontSize={14}
            onChange={setTextValue}
            onCancel={handleCancelText}
            onSave={handleSaveText}
        />
        )}

      {noteEditor && (
        <NoteEditor
          screenX={
            noteEditor.screenX
          }

          screenY={
            noteEditor.screenY
          }

          value={
            noteText
          }

          onChange={
            setNoteText
          }

          onCancel={
            handleCancelNote
          }

          onSave={
            handleSaveNote
          }
        />
      )}
    </div>
  )
}