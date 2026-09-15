import type { TextElement } from '../../types/text'
import type { ResizeHandle } from '../../hooks/useTextElements'

interface PDFTextLayerProps {
  elements: TextElement[]
  pageNumber: number
  zoom: number
  selectedTextId: string | null

  onSelectText: (
    id: string,
  ) => void

  onEditText: (
    element: TextElement,
  ) => void

  onStartDragText: (
    event: React.MouseEvent,
    element: TextElement,
  ) => void

  onStartResizeText: (
    event: React.MouseEvent,
    element: TextElement,
    handle: ResizeHandle,
  ) => void
}

const resizeHandles: ResizeHandle[] = [
  'nw',
  'ne',
  'sw',
  'se',
]

export default function PDFTextLayer({
  elements,
  pageNumber,
  zoom,
  selectedTextId,
  onSelectText,
  onEditText,
  onStartDragText,
  onStartResizeText,
}: PDFTextLayerProps) {
  const pageElements =
    elements.filter(
      (element) =>
        element.page === pageNumber,
    )

  return (
    <>
      {pageElements.map(
        (element) => {
          const isSelected =
            selectedTextId ===
            element.id

          return (
            <div
              key={element.id}
              className={`pdf-text-element ${
                isSelected
                  ? 'selected'
                  : ''
              }`}
              onMouseDown={(
                event,
              ) => {
                if (
                  event.button !==
                  0
                ) {
                  return
                }

                event.stopPropagation()

                onStartDragText(
                  event,
                  element,
                )
              }}
              onClick={(
                event,
              ) => {
                event.stopPropagation()

                onSelectText(
                  element.id,
                )
              }}
              onDoubleClick={(
                event,
              ) => {
                event.stopPropagation()

                onEditText(
                  element,
                )
              }}
              style={{
                position:
                  'absolute',

                left:
                  element.x *
                  zoom,

                top:
                  element.y *
                  zoom,

                width:
                  element.width *
                  zoom,

                minHeight:
                  element.height *
                  zoom,

                fontSize:
                  element.fontSize *
                  zoom,
              }}
            >
              {element.text}

              {isSelected &&
                resizeHandles.map(
                  (handle) => (
                    <div
                      key={handle}
                      className={`resize-handle resize-handle-${handle}`}
                      onMouseDown={(
                        event,
                      ) => {
                        event.preventDefault()
                        event.stopPropagation()

                        onStartResizeText(
                          event,
                          element,
                          handle,
                        )
                      }}
                    />
                  ),
                )}
            </div>
          )
        },
      )}
    </>
  )
}