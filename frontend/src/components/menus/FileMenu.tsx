import {
  FilePlus,
  FolderOpen,
  Save,
  X,
} from 'lucide-react'

interface FileMenuProps {
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onClose: () => void
  onClosePDF: () => void

  hasPDF: boolean
  processing: boolean
  isSaving: boolean
}

export default function FileMenu({
  onNew,
  onOpen,
  onSave,
  onClose,
  onClosePDF,
  
  hasPDF,
  processing,
  isSaving,
}: FileMenuProps) {

  return (
    <div className="top-menu-dropdown">
      <button
        onClick={() => {
          onClose()
          onNew()
        }}
        disabled={processing}
      >
        <FilePlus size={16} />
        <span>New PDF</span>
        <kbd>Ctrl+N</kbd>
      </button>

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

      <button
        onClick={() => {
          onClose()
          onClosePDF()
        }}
        disabled={!hasPDF || processing}
      >
        <X size={16} />
        <span>Close PDF</span>
      </button>

    </div>
  )
}