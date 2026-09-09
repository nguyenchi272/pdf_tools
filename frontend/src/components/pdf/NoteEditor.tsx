import {
  useEffect,
  useRef,
} from 'react'


interface NoteEditorProps {
  screenX: number
  screenY: number

  value: string

  onChange: (
    value: string,
  ) => void

  onCancel: () => void

  onSave: () => void
}


export default function NoteEditor({
  screenX,
  screenY,

  value,

  onChange,
  onCancel,
  onSave,
}: NoteEditorProps) {
  const textareaRef =
    useRef<HTMLTextAreaElement>(
      null,
    )


  /*
   * Auto focus textarea.
   */

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])


  return (
    <div
      className="note-editor"

      style={{
        position: 'fixed',
        left: screenX,
        top: screenY,
        zIndex: 100,
      }}

      onMouseDown={(event) =>
        event.stopPropagation()
      }

      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <textarea
        ref={textareaRef}

        value={value}

        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }

        placeholder="Enter note..."

        rows={4}
      />

      <div className="note-editor-actions">
        <button
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          disabled={!value.trim()}
          onClick={onSave}
        >
          Add Note
        </button>
      </div>
    </div>
  )
}