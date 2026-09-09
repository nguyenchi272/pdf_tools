import {
  useEffect,
  useRef,
} from 'react'

import * as pdfjsLib from 'pdfjs-dist'

import pdfWorker from
  'pdfjs-dist/build/pdf.worker.min.mjs?url'

import 'pdfjs-dist/web/pdf_viewer.css'

import type {
  Annotation,
  AnnotationType,
  AnnotationRect,
} from '../types/annotation'


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

  onAddAnnotation: (
    page: number,
    type: AnnotationType,
    rects: AnnotationRect[],
  ) => void

  onNumPages: (pages: number) => void
  onPageChange: (page: number) => void
}


export default function PDFViewer({
  pdfUrl,
  zoom,
  rotation,
  currentPage,

  annotations,
  annotationMode,

  onAddAnnotation,

  onNumPages,
  onPageChange,
}: PDFViewerProps) {

  const containerRef =
    useRef<HTMLDivElement>(null)


  const pageRefs =
    useRef<Map<number, HTMLDivElement>>(
      new Map(),
    )


  /*
   * =====================================================
   * RENDER PDF
   * =====================================================
   */

  useEffect(() => {

    if (!pdfUrl) {
      return
    }


    let cancelled = false


    const renderPDF = async () => {

      const container =
        containerRef.current


      if (!container) {
        return
      }


      container.innerHTML = ''

      pageRefs.current.clear()


      try {

        const loadingTask =
          pdfjsLib.getDocument({
            url: pdfUrl,
          })


        const pdf =
          await loadingTask.promise


        if (cancelled) {
          return
        }


        onNumPages(
          pdf.numPages,
        )


        for (
          let pageNumber = 1;
          pageNumber <= pdf.numPages;
          pageNumber++
        ) {

          if (cancelled) {
            return
          }


          const page =
            await pdf.getPage(
              pageNumber,
            )


          /*
           * ===============================================
           * PAGE WRAPPER
           * ===============================================
           */

          const wrapper =
            document.createElement('div')

          wrapper.className =
            'pdf-page-wrapper'

          wrapper.dataset.page =
            String(pageNumber)


          /*
           * ===============================================
           * PAGE LABEL
           * ===============================================
           */

          const label =
            document.createElement('div')

          label.className =
            'page-number-label'

          label.textContent =
            `Page ${pageNumber}`


          /*
           * ===============================================
           * PAGE CONTAINER
           * ===============================================
           */

          const pageContainer =
            document.createElement('div')

          pageContainer.className =
            'pdf-page-container'


          /*
           * ===============================================
           * VIEWPORT
           * ===============================================
           */

          const viewport =
            page.getViewport({
              scale: zoom,
              rotation,
            })


          /*
           * ===============================================
           * CANVAS
           * ===============================================
           */

          const canvas =
            document.createElement('canvas')

          canvas.className =
            'pdf-page'


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
           * ===============================================
           * TEXT LAYER
           * ===============================================
           */

          const textLayer =
            document.createElement('div')

          textLayer.className =
            'textLayer'

          textLayer.style.width =
            `${viewport.width}px`

          textLayer.style.height =
            `${viewport.height}px`


          /*
           * PDF.js text layer needs this
           */

          textLayer.style.setProperty(
            '--scale-factor',
            String(zoom),
          )

          textLayer.style.setProperty(
            '--total-scale-factor',
            String(zoom),
          )


          /*
           * ===============================================
           * DOM ORDER
           * ===============================================
           */

          pageContainer.appendChild(
            canvas,
          )

          pageContainer.appendChild(
            textLayer,
          )


          wrapper.appendChild(
            label,
          )

          wrapper.appendChild(
            pageContainer,
          )

          container.appendChild(
            wrapper,
          )


          pageRefs.current.set(
            pageNumber,
            wrapper,
          )


          /*
           * ===============================================
           * RENDER CANVAS
           * ===============================================
           */

          const context =
            canvas.getContext('2d')


          if (!context) {
            continue
          }


          await page.render({
            canvas,
            canvasContext: context,
            viewport,
          }).promise


          if (cancelled) {
            return
          }


          /*
           * ===============================================
           * GET TEXT CONTENT
           * ===============================================
           */

          const textContent =
            await page.getTextContent()

          if (cancelled) {
            return
          }


          /*
           * ===============================================
           * RENDER TEXT LAYER
           * ===============================================
           */

          const textLayerInstance =
            new pdfjsLib.TextLayer({
              textContentSource:
                textContent,

              container:
                textLayer,

              viewport:
                viewport,
            })


          await textLayerInstance.render()

          if (cancelled) {
            return
          }


          /*
           * ===============================================
           * ANNOTATION LAYER
           * ===============================================
           */

          const annotationLayer =
            document.createElement('div')

          annotationLayer.className =
            'react-annotation-layer'

          annotationLayer.style.position =
            'absolute'

          annotationLayer.style.left =
            '0'

          annotationLayer.style.top =
            '0'

          annotationLayer.style.width =
            `${viewport.width}px`

          annotationLayer.style.height =
            `${viewport.height}px`

          annotationLayer.style.pointerEvents =
            'none'

          annotationLayer.style.zIndex =
            '5'


          pageContainer.appendChild(
            annotationLayer,
          )

        }

      } catch (error) {

        if (!cancelled) {

          console.error(
            'Failed to render PDF:',
            error,
          )

        }

      }

    }


    renderPDF()


    return () => {
      cancelled = true
    }

  }, [
    pdfUrl,
    zoom,
    rotation,
    onNumPages,
  ])


  /*
   * =====================================================
   * TEXT SELECTION
   * =====================================================
   */

  useEffect(() => {

    const container =
      containerRef.current


    if (!container) {
      return
    }


    const handleMouseUp = () => {
      /*
       * Highlight mode OFF
       */

      if (!annotationMode) {
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


      /*
       * ===============================================
       * FIND SELECTED PAGE
       * ===============================================
       */

      const range =
        selection.getRangeAt(0)

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
        
      if (!(pageElement instanceof HTMLElement)) {
        return
      }


      const pageNumber =
        Number(
          pageElement.dataset.page,
        )

      if (!pageNumber) {
        return
      }


      /*
       * ===============================================
       * PAGE CONTAINER
       * ===============================================
       */

      const pageContainer =
        pageElement.querySelector(
          '.pdf-page-container',
        ) as HTMLElement | null


      if (!pageContainer) {
        return
      }


      /*
       * ===============================================
       * SELECTION RECTANGLES
       * ===============================================
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
       * ===============================================
       * CONVERT TO PDF COORDINATES
       * ===============================================
       *
       * Current version:
       *
       * screen
       *   ↓
       * page coordinate
       *   ↓
       * divide zoom
       *
       * Rotation will be handled
       * properly in a later step.
       */

      const rects:
        AnnotationRect[] =
        selectionRects
          .map((rect) => {

            return {
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
                rect.width / zoom,

              height:
                rect.height / zoom,
            }

          })
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
       * ===============================================
       * CREATE ANNOTATION
       * ===============================================
       */

      onAddAnnotation(
        pageNumber,
        annotationMode,
        rects,
      )


      /*
       * Clear browser selection
       */

      selection.removeAllRanges()

    }


    container.addEventListener(
      'mouseup',
      handleMouseUp,
    )


    return () => {

      container.removeEventListener(
        'mouseup',
        handleMouseUp,
      )

    }

  }, [
    annotationMode,
    onAddAnnotation,
    zoom,
  ])


  /*
   * =====================================================
   * RENDER EXISTING ANNOTATIONS
   * =====================================================
   */

  useEffect(() => {

    pageRefs.current.forEach(
      (
        wrapper,
        pageNumber,
      ) => {

        const pageContainer =
          wrapper.querySelector(
            '.pdf-page-container',
          ) as HTMLElement | null


        if (!pageContainer) {
          return
        }


        /*
         * Remove old layer
         */

        const oldLayer =
          pageContainer.querySelector(
            '.react-annotation-layer',
          )


        oldLayer?.remove()


        /*
         * Create layer
         */

        const layer =
          document.createElement('div')

        layer.className =
          'react-annotation-layer'

        layer.style.position =
          'absolute'

        layer.style.left =
          '0'

        layer.style.top =
          '0'

        layer.style.width =
          `${pageContainer.offsetWidth}px`

        layer.style.height =
          `${pageContainer.offsetHeight}px`

        layer.style.pointerEvents =
          'none'

        layer.style.zIndex =
          '5'


        pageContainer.appendChild(
          layer,
        )


        /*
         * Get annotations for page
         */

        const pageAnnotations =
          annotations.filter(
            (annotation) =>
              annotation.page ===
              pageNumber,
          )


        /*
         * Render annotations
         */

        pageAnnotations.forEach(
          (annotation) => {

            annotation.rects.forEach(
              (
                rect,
                index,
              ) => {

                const item =
                  document.createElement(
                    'div',
                  )


                item.className =
                  `annotation annotation-${annotation.type}`


                item.style.position =
                  'absolute'


                item.style.left =
                  `${rect.x * zoom}px`


                item.style.top =
                  `${rect.y * zoom}px`


                item.style.width =
                  `${rect.width * zoom}px`


                item.style.height =
                  `${rect.height * zoom}px`


                item.dataset.annotationId =
                  annotation.id


                item.dataset.index =
                  String(index)


                layer.appendChild(
                  item,
                )

              },
            )

          },
        )

      },
    )

  }, [
    annotations,
    zoom,
    rotation,
    pdfUrl,
  ])


  /*
   * =====================================================
   * TRACK VISIBLE PAGE
   * =====================================================
   */

  useEffect(() => {

    const container =
      containerRef.current


    if (!container) {
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
            onPageChange(page)
          }

        },
        {
          root: container,

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
    pdfUrl,
    zoom,
    rotation,
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


  return (
    <div
      ref={containerRef}
      className="pdf-viewer"
    />
  )
}