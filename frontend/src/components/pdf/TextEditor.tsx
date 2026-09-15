import {
  useEffect,
  useRef,
} from 'react'

interface TextEditorProps {
  x: number
  y: number
  value: string
  fontSize: number
  onChange: (
    value: string,
  ) => void
  onSave: () => void
  onCancel: () => void
}

export default function TextEditor({
  x,
  y,
  value,
  fontSize,
  onChange,
  onSave,
  onCancel,
}: TextEditorProps) {
  const textareaRef =
    useRef<HTMLTextAreaElement>(
      null,
    )

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (
      event.key === 'Escape'
    ) {
      event.preventDefault()
      onCancel()
      return
    }

    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault()
      onSave()
    }
  }

  return (
    <textarea
      ref={textareaRef}
      className="text-editor"
      value={value}
      placeholder="Type text..."
      onChange={(event) =>
        onChange(
          event.target.value,
        )
      }
      onKeyDown={handleKeyDown}
      onBlur={() => {
        if (value.trim()) {
          onSave()
        }
      }}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        fontSize: `${fontSize}px`,
      }}
    />
  )
}