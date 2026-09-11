import { AlertTriangle } from 'lucide-react'

interface UnsavedChangesDialogProps {
  open: boolean
  onCancel: () => void
  onDontSave: () => void
  onSave: () => void
  saving?: boolean
}

export default function UnsavedChangesDialog({
  open,
  onCancel,
  onDontSave,
  onSave,
  saving = false,
}: UnsavedChangesDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div
      className="dialog-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel()
        }
      }}
    >
      <div
        className="unsaved-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-dialog-title"
      >
        <div className="unsaved-dialog-icon">
          <AlertTriangle size={24} />
        </div>

        <div className="unsaved-dialog-content">
          <h2 id="unsaved-dialog-title">
            Save changes?
          </h2>

          <p>
            This PDF has unsaved changes.
            Do you want to save them?
          </p>
        </div>

        <div className="unsaved-dialog-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onDontSave}
            disabled={saving}
          >
            Don't Save
          </button>

          <button
            type="button"
            className="primary"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}