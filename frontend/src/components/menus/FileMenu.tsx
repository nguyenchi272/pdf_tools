import {
  FolderOpen,
  Save,
} from 'lucide-react'

interface FileMenuProps {
  onOpen: () => void
  onSave: () => void
  onClose: () => void

  hasPDF: boolean
  processing: boolean
  isSaving: boolean
}

export default function FileMenu({
  onOpen,
  onSave,
  onClose,
  hasPDF,
  processing,
  isSaving,
}: FileMenuProps) {

  return (
    <div className="top-menu-dropdown">

      <button
        onClick={() => {
          onClose()
          onOpen()
        }}
        disabled={processing}
      >
        <FolderOpen size={16} />

        <span>
          Open PDF
        </span>

        <kbd>Ctrl+O</kbd>
      </button>


      <button
        onClick={() => {
          onClose()
          onSave()
        }}
        disabled={
          !hasPDF ||
          processing ||
          isSaving
        }
      >
        <Save size={16} />

        <span>
          Save PDF
        </span>

        <kbd>Ctrl+S</kbd>
      </button>

    </div>
  )
}