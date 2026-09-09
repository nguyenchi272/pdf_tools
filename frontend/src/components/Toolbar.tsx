import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronLeft,
  ChevronRight,
  FilePlus,
  Trash2,
  Copy,
  FileOutput,
} from 'lucide-react'
import type { AnnotationType } from '../types/annotation'


interface ToolbarProps {
  hasPDF: boolean
  processing: boolean

  currentPage: number
  numPages: number

  selectedPages: number[]

  zoom: number

  annotationMode:
  | AnnotationType
  | null

  onOpen: () => void
  onSave: () => void

  onDelete: () => void
  onDuplicate: () => void
  onRotate: () => void
  onExtract: () => void

  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void

  onRotateView: () => void

  onPreviousPage: () => void
  onNextPage: () => void

  onAnnotationModeChange:
  (mode: AnnotationType | null) => void
}


export default function Toolbar({
  hasPDF,
  processing,

  currentPage,
  numPages,

  selectedPages,

  zoom,

  annotationMode,

  onOpen,
  onSave,

  onDelete,
  onDuplicate,
  onRotate,
  onExtract,

  onZoomIn,
  onZoomOut,
  onResetZoom,

  onRotateView,

  onPreviousPage,
  onNextPage,

  onAnnotationModeChange,
}: ToolbarProps) {

  return (

    <div className="toolbar">

      {/* =========================
          FILE
          ========================= */}

      <button
        onClick={onOpen}
        title="Open PDF"
      >
        <FilePlus size={18} />
        Open
      </button>


      <button
        onClick={onSave}
        disabled={
          !hasPDF ||
          processing
        }
        title="Save PDF"
      >
        Save
      </button>


      <div className="toolbar-separator" />


      {/* =========================
          PAGE OPERATIONS
          ========================= */}

      <button
        onClick={onDelete}
        disabled={
          !hasPDF ||
          processing ||
          selectedPages.length === 0
        }
        title="Delete selected pages"
      >
        <Trash2 size={18} />
        Delete
      </button>


      <button
        onClick={onDuplicate}
        disabled={
          !hasPDF ||
          processing ||
          selectedPages.length !== 1
        }
        title="Duplicate selected page"
      >
        <Copy size={18} />
        Duplicate
      </button>


      <button
        onClick={onRotate}
        disabled={
          !hasPDF ||
          processing ||
          selectedPages.length === 0
        }
        title="Rotate selected pages"
      >
        <RotateCw size={18} />
        Rotate
      </button>

      <button
        onClick={onExtract}
        disabled={
          !hasPDF ||
          processing ||
          selectedPages.length === 0
        }
        title="Extract selected pages"
      >
        <FileOutput size={18} />
        Extract
      </button>

      <div className="toolbar-divider" />

    <button
      className={
        annotationMode === 'highlight'
          ? 'toolbar-button active'
          : 'toolbar-button'
      }
      onClick={() => {

        onAnnotationModeChange(
          annotationMode === 'highlight'
            ? null
            : 'highlight',
        )

      }}
      disabled={processing}
      title="Highlight"
    >
      🖍 Highlight
    </button>

    <button
      className={
        annotationMode === 'underline'
          ? 'toolbar-button active'
          : 'toolbar-button'
      }
      onClick={() => {
        onAnnotationModeChange(
          annotationMode === 'underline' ? null : 'underline',
        )
      }}
      disabled={processing}
      title="Underline"
    >
      <u>U</u> Underline
    </button>

    <button
      className={
        annotationMode === 'strikeout'
          ? 'toolbar-button active'
          : 'toolbar-button'
      }
      onClick={() => {
        onAnnotationModeChange(
          annotationMode === 'strikeout' ? null : 'strikeout',
        )
      }}
      disabled={processing}
      title="Strikethrough"
    >
      <s>S</s> Strikethrough
    </button>

    <button
        className={
            annotationMode === 'note'
            ? 'toolbar-button active'
            : 'toolbar-button'
        }
        onClick={() => {
            onAnnotationModeChange(
            annotationMode === 'note'
                ? null
                : 'note',
            )
        }}
        disabled={processing}
        title="Add Note"
        >
        📝 Note
    </button>


      <div className="toolbar-separator" />


      {/* =========================
          ZOOM
          ========================= */}

      <button
        onClick={onZoomOut}
        disabled={!hasPDF}
        title="Zoom out"
      >
        <ZoomOut size={18} />
      </button>


      <button
        onClick={onResetZoom}
        disabled={!hasPDF}
        title="Reset zoom"
      >
        {Math.round(zoom * 100)}%
      </button>


      <button
        onClick={onZoomIn}
        disabled={!hasPDF}
        title="Zoom in"
      >
        <ZoomIn size={18} />
      </button>


      {/* =========================
          VIEW
          ========================= */}

      <button
        onClick={onRotateView}
        disabled={!hasPDF}
        title="Rotate view"
      >
        <RotateCw size={18} />
      </button>


      <button
        onClick={onResetZoom}
        disabled={!hasPDF}
        title="Reset zoom"
      >
        <Maximize size={18} />
      </button>


      <div className="toolbar-spacer" />


      {/* =========================
          PAGE NAVIGATION
          ========================= */}

      <button
        onClick={onPreviousPage}
        disabled={
          !hasPDF ||
          currentPage <= 1
        }
        title="Previous page"
      >
        <ChevronLeft size={18} />
      </button>


      <span className="page-counter">

        {hasPDF
          ? `${currentPage} / ${numPages}`
          : '0 / 0'}

      </span>


      <button
        onClick={onNextPage}
        disabled={
          !hasPDF ||
          currentPage >= numPages
        }
        title="Next page"
      >
        <ChevronRight size={18} />
      </button>

    </div>
  )
}