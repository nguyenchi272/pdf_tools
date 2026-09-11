import {
  useEffect,
  useState,
} from 'react'

export default function usePDFDocument() {
  const [pdfFile, setPdfFile] =
    useState<File | null>(null)

  const [pdfUrl, setPdfUrl] =
    useState('')

  /*
   * Whether the current PDF has
   * unsaved changes.
   */
  const [isDirty, setIsDirty] =
    useState(false)

  /*
   * Create object URL whenever
   * the PDF file changes.
   */
  useEffect(() => {
    if (!pdfFile) {
      setPdfUrl('')
      return
    }

    const url =
      URL.createObjectURL(pdfFile)

    setPdfUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [pdfFile])

  /*
   * Open PDF.
   *
   * The caller handles resetting
   * page/view state.
   */
  const openPDF = (
    onOpen: (file: File) => void,
  ) => {
    const input =
      document.createElement('input')

    input.type = 'file'
    input.accept = 'application/pdf'

    input.onchange = () => {
      const file =
        input.files?.[0]

      if (!file) return

      if (
        file.type !== 'application/pdf'
      ) {
        alert(
          'Please select a PDF file.',
        )

        return
      }

      onOpen(file)
    }

    input.click()
  }

  /*
   * Replace current PDF.
   */
  const replacePdfFile = (
    file: File,
  ) => {
    setPdfFile(file)
  }

  return {
    pdfFile,
    pdfUrl,

    setPdfFile,

    isDirty,
    setIsDirty,

    openPDF,
    replacePdfFile,
  }
}