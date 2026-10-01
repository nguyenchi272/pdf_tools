import { useEffect, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import PDFOutline from './PDFOutline'
import type { PDFOutlineItem } from '../hooks/usePDFOutline'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

interface BookmarkTarget {
  text: string
  page: number
  x: number
  y: number
  width: number
  height: number
}

interface PDFBookmark {
  id: string
  title: string
  pageNumber: number
  left: number
  top: number
  level: number
}

interface SidebarProps {
  pdfUrl: string
  numPages: number
  currentPage: number
  selectedPages: number[]
  bookmarks: PDFBookmark[]

  onPageChange: (page: number) => void
  onSelectionChange: (pages: number[]) => void

  onReorder: (
    draggedPage: number,
    targetPage: number,
  ) => void

  outline: PDFOutlineItem[]
  onOutlineItemClick: (
    item: PDFOutlineItem,
  ) => void

  selectedBookmarkTarget:
    BookmarkTarget | null

  onAddBookmark: () => void

  onChangeBookmarkLevel: (
    id: string,
    level: number,
  ) => void

  onDeleteBookmark: (
    id: string,
  ) => void

  onEditBookmarkTitle: (
    id: string,
    title: string,
  ) => void

  onBookmarkClick: (
    bookmark: PDFBookmark,
  ) => void
}


export default function Sidebar({
  pdfUrl,
  numPages,
  currentPage,
  selectedPages,
  outline,
  selectedBookmarkTarget,
  bookmarks,
  onPageChange,
  onSelectionChange,
  onReorder,
  onOutlineItemClick,
  onAddBookmark,
  onChangeBookmarkLevel,
  onDeleteBookmark,
  onEditBookmarkTitle,
  onBookmarkClick,
}: SidebarProps) {

  const [thumbnails, setThumbnails] =
    useState<string[]>([])

  const [draggedPage, setDraggedPage] =
    useState<number | null>(null)

  const [dragOverPage, setDragOverPage] =
    useState<number | null>(null)

  const [activeTab, setActiveTab] =
    useState<'pages' | 'outline'>('pages')

  const [
    editingBookmarkId,
    setEditingBookmarkId,
  ] = useState<string | null>(null)

  const [
    editingBookmarkTitle,
    setEditingBookmarkTitle,
  ] = useState('')

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

  /*
  * Bookmark editing
  */

  const startEditingBookmark = (
    bookmark: PDFBookmark,
  ) => {
    setEditingBookmarkId(bookmark.id)
    setEditingBookmarkTitle(bookmark.title)
  }

  const cancelEditingBookmark = () => {
    setEditingBookmarkId(null)
    setEditingBookmarkTitle('')
  }

  const saveEditingBookmark = (
    bookmark: PDFBookmark,
  ) => {
    const newTitle =
      editingBookmarkTitle.trim()

    if (!newTitle) {
      cancelEditingBookmark()
      return
    }

    onEditBookmarkTitle(
      bookmark.id,
      newTitle,
    )

    setEditingBookmarkId(null)
    setEditingBookmarkTitle('')
  }

  return (

    <aside className="sidebar">

      <div className="sidebar-tabs">

        <button
          type="button"
          className={
            activeTab === 'pages'
              ? 'sidebar-tab active'
              : 'sidebar-tab'
          }
          onClick={() => setActiveTab('pages')}
        >
          Pages

          {selectedPages.length > 0 && (
            <span className="selected-count">
              {selectedPages.length}
            </span>
          )}
        </button>

        <button
          type="button"
          className={
            activeTab === 'outline'
              ? 'sidebar-tab active'
              : 'sidebar-tab'
          }
          onClick={() => setActiveTab('outline')}
        >
          Bookmarks
        </button>

      </div>

      {activeTab === 'pages' && (
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
      )}

      {activeTab === 'outline' && (
        <div className="bookmarks-container">

          {/* ADD BOOKMARK */}
          <div className="bookmarks-toolbar">
            <button
              type="button"
              className="bookmark-add-button"
              onClick={onAddBookmark}
              disabled={!selectedBookmarkTarget}
              title={
                selectedBookmarkTarget
                  ? 'Add bookmark from selected text'
                  : 'Select text in the PDF first'
              }
            >
              <span>＋</span>
              <span>Add Bookmark</span>
            </button>
          </div>

          {/* USER BOOKMARKS */}
          <div className="bookmarks-list">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="bookmark-item"
                style={{
                  paddingLeft: `${12 + bookmark.level * 16}px`,
                }}
                title={
                  editingBookmarkId === bookmark.id
                    ? undefined
                    : bookmark.title
                }
                onClick={() => {
                  onBookmarkClick(bookmark)
                }}
              >
                <span className="bookmark-icon">
                  🔖
                </span>

                {editingBookmarkId === bookmark.id ? (
                  <input
                    type="text"
                    className="bookmark-title-input"
                    value={editingBookmarkTitle}
                    autoFocus

                    onChange={(event) => {
                      setEditingBookmarkTitle(
                        event.target.value,
                      )
                    }}

                    onClick={(event) => {
                      event.stopPropagation()
                    }}

                    onDoubleClick={(event) => {
                      event.stopPropagation()
                    }}

                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()

                        saveEditingBookmark(
                          bookmark,
                        )
                      }

                      if (event.key === 'Escape') {
                        event.preventDefault()

                        cancelEditingBookmark()
                      }
                    }}

                    onBlur={() => {
                      saveEditingBookmark(
                        bookmark,
                      )
                    }}
                  />
                ) : (
                  <span
                    className="bookmark-title"
                    onDoubleClick={(event) => {
                      event.stopPropagation()

                      startEditingBookmark(
                        bookmark,
                      )
                    }}
                  >
                    {bookmark.title}
                  </span>
                )}

                <span className="bookmark-page">
                  {bookmark.pageNumber}
                </span>

                <div className="bookmark-actions">
                  <button
                    type="button"
                    title="Decrease level"
                    disabled={bookmark.level === 0}
                    onClick={(event) => {
                      event.stopPropagation()
                      onChangeBookmarkLevel(
                        bookmark.id,
                        bookmark.level - 1,
                      )
                    }}
                  >
                    ←
                  </button>

                  <button
                    type="button"
                    title="Increase level"
                    onClick={(event) => {
                      event.stopPropagation()
                      onChangeBookmarkLevel(
                        bookmark.id,
                        bookmark.level + 1,
                      )
                    }}
                  >
                    →
                  </button>

                  <button
                    type="button"
                    title="Delete bookmark"
                    onClick={(event) => {
                      event.stopPropagation()
                      onDeleteBookmark(bookmark.id)
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}  

    </aside>
  )
}