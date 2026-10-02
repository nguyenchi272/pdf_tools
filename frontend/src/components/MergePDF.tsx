import {
  useRef,
  useState,
} from 'react'

import { mergePdfs } from '../api/pdfApi'

interface MergePDFProps {
  onClose: () => void
  onMerged: (file: File) => void
}

export default function MergePDF({
  onClose,
  onMerged,
}: MergePDFProps) {
  const inputRef =
    useRef<HTMLInputElement | null>(null)

  const [files, setFiles] =
    useState<File[]>([])

  const [isDragging, setIsDragging] =
    useState(false)

  const [isMerging, setIsMerging] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const addFiles = (
    selectedFiles: FileList | File[],
  ) => {
    const incoming = Array.from(selectedFiles)

    const pdfFiles = incoming.filter(
      (file) =>
        file.type === 'application/pdf' ||
        file.name
          .toLowerCase()
          .endsWith('.pdf'),
    )

    if (pdfFiles.length === 0) {
      setError(
        'Please select PDF files only.',
      )
      return
    }

    setError(null)

    setFiles((current) => [
      ...current,
      ...pdfFiles,
    ])
  }

  const handleFileInput = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.files) {
      addFiles(event.target.files)
    }

    // Allow selecting the same file again.
    event.target.value = ''
  }

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault()
    setIsDragging(false)

    if (event.dataTransfer.files) {
      addFiles(event.dataTransfer.files)
    }
  }

  const moveFile = (
    index: number,
    direction: 'up' | 'down',
  ) => {
    setFiles((current) => {
      const next = [...current]

      const targetIndex =
        direction === 'up'
          ? index - 1
          : index + 1

      if (
        targetIndex < 0 ||
        targetIndex >= next.length
      ) {
        return current
      }

      const temp = next[index]
      next[index] =
        next[targetIndex]
      next[targetIndex] = temp

      return next
    })
  }

  const removeFile = (
    index: number,
  ) => {
    setFiles((current) =>
      current.filter(
        (_, i) => i !== index,
      ),
    )
  }

  const handleMerge = async () => {
    if (files.length < 2) {
      setError(
        'Please add at least two PDF files.',
      )
      return
    }

    setError(null)
    setIsMerging(true)

    try {
      const blob =
        await mergePdfs(files)

      const mergedFile = new File(
        [blob],
        'merged.pdf',
        {
          type: 'application/pdf',
        },
      )

      onMerged(mergedFile)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to merge PDFs.',
      )
    } finally {
      setIsMerging(false)
    }
  }

  return (
    <div className="merge-pdf">
      <div className="merge-pdf-header">
        <h2>Merge PDF</h2>

        <button
          type="button"
          onClick={onClose}
          disabled={isMerging}
        >
          Close
        </button>
      </div>

      <div
        className={`merge-pdf-dropzone ${
          isDragging
            ? 'merge-pdf-dropzone-dragging'
            : ''
        }`}
        onDragEnter={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setIsDragging(false)
        }}
        onDrop={handleDrop}
      >
        <p>
          Drag and drop PDF files here
        </p>

        <p>or</p>

        <button
          type="button"
          onClick={() =>
            inputRef.current?.click()
          }
        >
          Add PDF
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          hidden
          onChange={handleFileInput}
        />
      </div>

      {files.length > 0 && (
        <div className="merge-pdf-files">
          <h3>
            Files ({files.length})
          </h3>

          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="merge-pdf-file"
            >
              <div className="merge-pdf-file-info">
                <span className="merge-pdf-file-number">
                  {index + 1}
                </span>

                <span className="merge-pdf-file-name">
                  {file.name}
                </span>
              </div>

              <div className="merge-pdf-file-actions">
                <button
                  type="button"
                  onClick={() =>
                    moveFile(
                      index,
                      'up',
                    )
                  }
                  disabled={
                    index === 0 ||
                    isMerging
                  }
                  title="Move up"
                >
                  ↑
                </button>

                <button
                  type="button"
                  onClick={() =>
                    moveFile(
                      index,
                      'down',
                    )
                  }
                  disabled={
                    index ===
                      files.length - 1 ||
                    isMerging
                  }
                  title="Move down"
                >
                  ↓
                </button>

                <button
                  type="button"
                  onClick={() =>
                    removeFile(index)
                  }
                  disabled={isMerging}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="merge-pdf-error">
          {error}
        </div>
      )}

      <div className="merge-pdf-footer">
        <button
          type="button"
          onClick={onClose}
          disabled={isMerging}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleMerge}
          disabled={
            files.length < 2 ||
            isMerging
          }
        >
          {isMerging
            ? 'Merging...'
            : 'Merge PDF'}
        </button>
      </div>
    </div>
  )
}
