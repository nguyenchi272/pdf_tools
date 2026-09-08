import { useEffect, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker


interface SidebarProps {
  pdfUrl: string
  numPages: number
  currentPage: number
  selectedPages: number[]

  onPageChange: (page: number) => void
  onSelectionChange: (pages: number[]) => void

  onReorder: (
    draggedPage: number,
    targetPage: number,
  ) => void
}


export default function Sidebar({
  pdfUrl,
  numPages,
  currentPage,
  selectedPages,
  onPageChange,
  onSelectionChange,
  onReorder,
}: SidebarProps) {

  const [thumbnails, setThumbnails] =
    useState<string[]>([])

  const [draggedPage, setDraggedPage] =
    useState<number | null>(null)

  const [dragOverPage, setDragOverPage] =
    useState<number | null>(null)


  /*
   * Load thumbnails
   */

  useEffect(() => {

    if (!pdfUrl) {
      setThumbnails([])
      return
    }

    let cancelled = false

    const loadThumbnails = async () => {

      try {

        const loadingTask =
          pdfjsLib.getDocument({
            url: pdfUrl,
          })

        const pdf =
          await loadingTask.promise

        const result: string[] = []

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

          const viewport =
            page.getViewport({
              scale: 0.22,
            })

          const canvas =
            document.createElement('canvas')

          canvas.width =
            Math.ceil(viewport.width)

          canvas.height =
            Math.ceil(viewport.height)

          const context =
            canvas.getContext('2d')

          if (!context) {
            result.push('')
            continue
          }

          await page.render({
            canvas,
            canvasContext: context,
            viewport,
          }).promise

          result.push(
            canvas.toDataURL('image/png'),
          )
        }

        if (!cancelled) {
          setThumbnails(result)
        }

      } catch (error) {

        console.error(
          'Failed to render thumbnails:',
          error,
        )
      }
    }

    loadThumbnails()

    return () => {
      cancelled = true
    }

  }, [pdfUrl])


  /*
   * Page selection
   */

  const handlePageClick = (
    pageNumber: number,
    event: React.MouseEvent,
  ) => {

    onPageChange(pageNumber)

    if (
      event.ctrlKey ||
      event.metaKey
    ) {

      if (
        selectedPages.includes(pageNumber)
      ) {

        onSelectionChange(
          selectedPages.filter(
            (page) =>
              page !== pageNumber,
          ),
        )

      } else {

        onSelectionChange([
          ...selectedPages,
          pageNumber,
        ])
      }

    } else {

      onSelectionChange([
        pageNumber,
      ])
    }
  }


  /*
   * Double click
   */

  const handlePageDoubleClick = (
    pageNumber: number,
  ) => {
    onPageChange(pageNumber)
  }


  /*
   * Drag start
   */

  const handleDragStart = (
    pageNumber: number,
    event: React.DragEvent<HTMLDivElement>,
  ) => {

    setDraggedPage(pageNumber)

    event.dataTransfer.effectAllowed =
      'move'

    event.dataTransfer.setData(
      'text/plain',
      String(pageNumber),
    )
  }


  /*
   * Drag over
   */

  const handleDragOver = (
    pageNumber: number,
    event: React.DragEvent<HTMLDivElement>,
  ) => {

    event.preventDefault()

    event.dataTransfer.dropEffect =
      'move'

    if (
      draggedPage !== pageNumber
    ) {
      setDragOverPage(pageNumber)
    }
  }


  /*
   * Drop
   */

  const handleDrop = (
    targetPage: number,
    event: React.DragEvent<HTMLDivElement>,
  ) => {

    event.preventDefault()

    const sourcePage =
      Number(
        event.dataTransfer.getData(
          'text/plain',
        ),
      )

    if (
      !sourcePage ||
      sourcePage === targetPage
    ) {
      setDraggedPage(null)
      setDragOverPage(null)
      return
    }

    onReorder(
      sourcePage,
      targetPage,
    )

    setDraggedPage(null)
    setDragOverPage(null)
  }


  /*
   * Drag end
   */

  const handleDragEnd = () => {

    setDraggedPage(null)
    setDragOverPage(null)
  }


  return (

    <aside className="sidebar">

      <div className="sidebar-header">

        <span>
          Pages
        </span>

        {selectedPages.length > 0 && (
          <span className="selected-count">
            {selectedPages.length}
          </span>
        )}

      </div>


      <div className="thumbnail-container">

        {Array.from(
          { length: numPages },
          (_, index) => {

            const pageNumber =
              index + 1

            const isCurrent =
              pageNumber === currentPage

            const isSelected =
              selectedPages.includes(
                pageNumber,
              )

            const isDragging =
              pageNumber === draggedPage

            const isDragOver =
              pageNumber === dragOverPage

            return (

              <div
                key={pageNumber}

                className={[
                  'thumbnail-wrapper',

                  isCurrent
                    ? 'active'
                    : '',

                  isSelected
                    ? 'selected'
                    : '',

                  isDragging
                    ? 'dragging'
                    : '',

                  isDragOver
                    ? 'drag-over'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}

                draggable

                onClick={(event) =>
                  handlePageClick(
                    pageNumber,
                    event,
                  )
                }

                onDoubleClick={() =>
                  handlePageDoubleClick(
                    pageNumber,
                  )
                }

                onDragStart={(event) =>
                  handleDragStart(
                    pageNumber,
                    event,
                  )
                }

                onDragOver={(event) =>
                  handleDragOver(
                    pageNumber,
                    event,
                  )
                }

                onDrop={(event) =>
                  handleDrop(
                    pageNumber,
                    event,
                  )
                }

                onDragEnd={
                  handleDragEnd
                }
              >

                {thumbnails[index] ? (

                  <img
                    src={
                      thumbnails[index]
                    }
                    className="thumbnail-image"
                    draggable={false}
                    alt={`Page ${pageNumber}`}
                  />

                ) : (

                  <div className="thumbnail-loading">
                    Loading...
                  </div>

                )}

                <div className="thumbnail-label">
                  {pageNumber}
                </div>

              </div>
            )
          },
        )}

      </div>

    </aside>
  )
}