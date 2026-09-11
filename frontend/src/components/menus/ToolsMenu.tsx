import {
  Trash2,
  Copy,
  RotateCw,
  FileOutput,
  Highlighter,
  Underline,
  Strikethrough,
  StickyNote,
} from 'lucide-react'

import type {
  AnnotationType,
} from '../../types/annotation'

interface ToolsMenuProps {
  hasPDF: boolean
  processing: boolean
  selectedPages: number[]

  annotationMode:
    | AnnotationType
    | null

  onAnnotationModeChange: (
    mode: AnnotationType | null,
  ) => void

  onDelete: () => void
  onDuplicate: () => void
  onRotate: () => void
  onExtract: () => void

  onClose: () => void
}

export default function ToolsMenu({
  hasPDF,
  processing,
  selectedPages,
  annotationMode,
  onAnnotationModeChange,
  onDelete,
  onDuplicate,
  onRotate,
  onExtract,
  onClose,
}: ToolsMenuProps) {

  const toggleAnnotation =
    (type: AnnotationType) => {

      onClose()

      onAnnotationModeChange(
        annotationMode === type
          ? null
          : type,
      )
    }

  const noPages =
    selectedPages.length === 0

  const notSinglePage =
    selectedPages.length !== 1

  return (
    <div className="top-menu-dropdown wide">

      <div className="top-menu-section">
        Pages
      </div>


      <button
        onClick={() => {
          onClose()
          onDelete()
        }}
        disabled={
          noPages ||
          processing
        }
      >
        <Trash2 size={16} />

        <span>
          Delete Pages
        </span>
      </button>


      <button
        onClick={() => {
          onClose()
          onDuplicate()
        }}
        disabled={
          notSinglePage ||
          processing
        }
      >
        <Copy size={16} />

        <span>
          Duplicate Page
        </span>
      </button>


      <button
        onClick={() => {
          onClose()
          onRotate()
        }}
        disabled={
          noPages ||
          processing
        }
      >
        <RotateCw size={16} />

        <span>
          Rotate Pages
        </span>
      </button>


      <button
        onClick={() => {
          onClose()
          onExtract()
        }}
        disabled={
          noPages ||
          processing
        }
      >
        <FileOutput size={16} />

        <span>
          Extract Pages
        </span>
      </button>


      <div className="top-menu-divider" />


      <div className="top-menu-section">
        Annotate
      </div>


      <button
        onClick={() =>
          toggleAnnotation('highlight')
        }
        disabled={
          !hasPDF ||
          processing
        }
      >
        <Highlighter size={16} />

        <span>
          Highlight
        </span>
      </button>


      <button
        onClick={() =>
          toggleAnnotation('underline')
        }
        disabled={
          !hasPDF ||
          processing
        }
      >
        <Underline size={16} />

        <span>
          Underline
        </span>
      </button>


      <button
        onClick={() =>
          toggleAnnotation('strikeout')
        }
        disabled={
          !hasPDF ||
          processing
        }
      >
        <Strikethrough size={16} />

        <span>
          Strikeout
        </span>
      </button>


      <button
        onClick={() =>
          toggleAnnotation('note')
        }
        disabled={
          !hasPDF ||
          processing
        }
      >
        <StickyNote size={16} />

        <span>
          Note
        </span>
      </button>

    </div>
  )
}