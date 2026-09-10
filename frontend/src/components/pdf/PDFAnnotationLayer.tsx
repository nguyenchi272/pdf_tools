import { useState, useEffect } from 'react'
import type { MouseEvent } from 'react'
import type { Annotation } from '../../types/annotation'

interface PDFAnnotationLayerProps {
  annotations: Annotation[]
  pageNumber: number
  zoom: number
  width: number
  height: number
  onRemoveAnnotation: (id: string) => void
}

interface ContextMenu {
  x: number
  y: number
  annotation: Annotation
}

export default function PDFAnnotationLayer({
  annotations,
  pageNumber,
  zoom,
  width,
  height,
  onRemoveAnnotation,
}: PDFAnnotationLayerProps) {
  const [selectedNote, setSelectedNote] =
    useState<Annotation | null>(null)

  const [contextMenu, setContextMenu] =
    useState<ContextMenu | null>(null)

    useEffect(() => {
    if (!contextMenu) {
        return
    }

    const handleOutsideClick = (
        event: globalThis.MouseEvent,
    ) => {
        const target =
        event.target as HTMLElement

        if (
        target.closest(
            '.annotation-context-menu',
        )
        ) {
        return
        }

        setContextMenu(null)
    }

    document.addEventListener(
        'mousedown',
        handleOutsideClick,
    )

    return () => {
        document.removeEventListener(
        'mousedown',
        handleOutsideClick,
        )
    }
    }, [contextMenu])

  const pageAnnotations =
    annotations.filter(
      (annotation) =>
        annotation.page === pageNumber,
    )

  const handleContextMenu = (
    event: MouseEvent,
    annotation: Annotation,
  ) => {
    event.preventDefault()
    event.stopPropagation()

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      annotation,
    })
  }

  const handleDelete = () => {
    if (!contextMenu) {
      return
    }

    onRemoveAnnotation(
      contextMenu.annotation.id,
    )

    if (
      selectedNote?.id ===
      contextMenu.annotation.id
    ) {
      setSelectedNote(null)
    }

    setContextMenu(null)
  }

  const handleNoteClick = (
    event: MouseEvent,
    annotation: Annotation,
  ) => {
    event.stopPropagation()

    setSelectedNote(annotation)
  }

  return (
    <>
      <div
        className="react-annotation-layer"
        style={{
          position: 'absolute',

          left: 0,
          top: 0,

          width: `${width}px`,
          height: `${height}px`,

          pointerEvents: 'none',

          zIndex: 5,
        }}
      >
        {pageAnnotations.map(
          (annotation) =>
            annotation.rects.map(
              (rect, index) => (
                <div
                  key={`${annotation.id}-${index}`}
                  className={
                    `annotation annotation-${annotation.type}`
                  }
                  data-annotation-id={
                    annotation.id
                  }
                  data-index={index}
                  style={{
                    position: 'absolute',

                    left:
                      `${rect.x * zoom}px`,

                    top:
                      `${rect.y * zoom}px`,

                    width:
                      `${rect.width * zoom}px`,

                    height:
                      `${rect.height * zoom}px`,
                  }}
                  onContextMenu={(event) =>
                    handleContextMenu(
                      event,
                      annotation,
                    )
                  }
                >
                  {annotation.type ===
                    'note' &&
                    index === 0 && (
                      <button
                        type="button"
                        className="annotation-note-icon"
                        title="View note"
                        onClick={(event) =>
                          handleNoteClick(
                            event,
                            annotation,
                          )
                        }
                        onContextMenu={(event) =>
                          handleContextMenu(
                            event,
                            annotation,
                          )
                        }
                      >
                        📝
                      </button>
                    )}

                  {annotation.type !==
                    'note' && (
                    <button
                      type="button"
                      className="annotation-click-target"
                      aria-label={`Select ${annotation.type} annotation`}
                      onContextMenu={(event) =>
                        handleContextMenu(
                          event,
                          annotation,
                        )
                      }
                    />
                  )}
                </div>
              ),
            ),
        )}
      </div>

      {/* Note viewer */}
      {selectedNote && (
        <div
          className="note-viewer-backdrop"
          onClick={() =>
            setSelectedNote(null)
          }
        >
          <div
            className="note-viewer"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="note-viewer-header">
              <strong>
                Note
              </strong>

              <button
                type="button"
                className="note-viewer-close"
                onClick={() =>
                  setSelectedNote(null)
                }
              >
                ×
              </button>
            </div>

            <div className="note-viewer-content">
              {selectedNote.text}
            </div>
          </div>
        </div>
      )}

      {/* Annotation context menu */}
      {contextMenu && (
        <div
          className="annotation-context-menu"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(event) =>
            event.stopPropagation()
          }
          onContextMenu={(event) =>
            event.preventDefault()
          }
        >
          <button
            type="button"
            onClick={handleDelete}
          >
            Delete Annotation
          </button>
        </div>
      )}
    </>
  )
}