import {
  Undo2,
  Redo2,
} from 'lucide-react'

interface EditMenuProps {
  onUndo: () => void
  onRedo: () => void

  canUndo: boolean
  canRedo: boolean

  processing: boolean
  onClose: () => void
}

export default function EditMenu({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  processing,
  onClose,
}: EditMenuProps) {

  return (
    <div className="top-menu-dropdown">

      <button
        onClick={() => {
          onClose()
          onUndo()
        }}
        disabled={
          !canUndo ||
          processing
        }
      >
        <Undo2 size={16} />

        <span>
          Undo
        </span>

        <kbd>Ctrl+Z</kbd>
      </button>


      <button
        onClick={() => {
          onClose()
          onRedo()
        }}
        disabled={
          !canRedo ||
          processing
        }
      >
        <Redo2 size={16} />

        <span>
          Redo
        </span>

        <kbd>Ctrl+Y</kbd>
      </button>

    </div>
  )
}