import { useState } from 'react'
import type { Annotation } from '../../types/annotation'

interface PDFAnnotationLayerProps {
  annotations: Annotation[]
  pageNumber: number
  zoom: number
  width: number
  height: number
}

export default function PDFAnnotationLayer({
  annotations,
  pageNumber,
  zoom,
  width,
  height,
}: PDFAnnotationLayerProps) {
  const [selectedNote, setSelectedNote] =
    useState<Annotation | null>(null)

  const pageAnnotations =
    annotations.filter(
      (annotation) =>
        annotation.page === pageNumber,
    )

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
                >
                  {annotation.type === 'note' &&
                    index === 0 && (
                      <button
                        type="button"
                        className="annotation-note-icon"
                        title="View note"
                        onClick={(event) => {
                          event.stopPropagation()

                          setSelectedNote(
                            annotation,
                          )
                        }}
                      >
                        📝
                      </button>
                    )}
                </div>
              ),
            ),
        )}
      </div>

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
    </>
  )
}