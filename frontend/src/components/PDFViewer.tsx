import { useEffect, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker


interface PDFViewerProps {
  pdfUrl: string
  zoom: number
  rotation: number
  currentPage: number
  onNumPages: (pages: number) => void
  onPageChange: (page: number) => void
}


export default function PDFViewer({
  pdfUrl,
  zoom,
  rotation,
  currentPage,
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
   * Render PDF
   */

  useEffect(() => {

    if (!pdfUrl) return


    let cancelled = false


    const renderPDF = async () => {

      const container =
        containerRef.current


      if (!container) return


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


        onNumPages(pdf.numPages)


        for (
          let pageNumber = 1;
          pageNumber <= pdf.numPages;
          pageNumber++
        ) {

          if (cancelled) {
            return
          }


          const page =
            await pdf.getPage(pageNumber)


          const wrapper =
            document.createElement('div')

          wrapper.className =
            'pdf-page-wrapper'

          wrapper.dataset.page =
            String(pageNumber)


          const label =
            document.createElement('div')

          label.className =
            'page-number-label'

          label.textContent =
            `Page ${pageNumber}`


          const canvas =
            document.createElement('canvas')

          canvas.className =
            'pdf-page'


          wrapper.appendChild(label)
          wrapper.appendChild(canvas)

          container.appendChild(wrapper)


          pageRefs.current.set(
            pageNumber,
            wrapper,
          )


          const viewport =
            page.getViewport({
              scale: zoom,
              rotation,
            })


          canvas.width =
            Math.ceil(viewport.width)

          canvas.height =
            Math.ceil(viewport.height)


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
   * Track visible page
   */

  useEffect(() => {

    const container =
      containerRef.current


    if (!container) return


    const elements =
      Array.from(
        pageRefs.current.values(),
      )


    if (elements.length === 0) {
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
        observer.observe(element)
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
   * Navigate to current page
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

  }, [currentPage])


  return (
    <div
      ref={containerRef}
      className="pdf-viewer"
    />
  )
}