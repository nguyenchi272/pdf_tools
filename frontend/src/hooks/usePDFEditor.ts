import usePDFDocument from './usePDFDocument'
import usePDFPages from './usePDFPages'
import usePDFView from './usePDFView'
import usePDFOperations from './usePDFOperations'

export function usePDFEditor() {
  /*
   * Document state
   */
  const pdfDocument =
    usePDFDocument()

  /*
   * Page state
   */
  const pages =
    usePDFPages()

  /*
   * View state
   */
  const view =
    usePDFView()

  /*
   * PDF operations
   */
  const operations =
    usePDFOperations({
      pdfFile:
        pdfDocument.pdfFile,

      numPages:
        pages.numPages,

      currentPage:
        pages.currentPage,

      selectedPages:
        pages.selectedPages,

      setPdfFile:
        pdfDocument.setPdfFile,

      setCurrentPage:
        pages.setCurrentPage,

      setSelectedPages:
        pages.setSelectedPages,

      setRotation:
        view.setRotation,
      onChange: () => {
        pdfDocument.setIsDirty(true)
      },
    })

  /*
   * Open PDF.
   *
   * Opening a new document resets
   * page, selection, zoom and rotation.
   */
  const openPDF = () => {
    pdfDocument.openPDF(
      (file) => {
        pdfDocument.setPdfFile(file)

        pages.setNumPages(0)

        pages.setCurrentPage(1)

        pages.setSelectedPages([])

        view.setZoom(1)

        view.setRotation(0)

        pdfDocument.setIsDirty(false)
      },
    )
  }

  /*
   * Replace current PDF.
   *
   * Used when another operation
   * generates a new PDF file,
   * for example saveAnnotations().
   */
  const replacePdfFile = (
    file: File,
  ) => {
    pdfDocument.replacePdfFile(
      file,
    )

    pages.setCurrentPage(1)

    pages.setSelectedPages([])

    view.setRotation(0)

    pdfDocument.setIsDirty(false)
  }

  /*
   * Save current PDF.
   */
  const savePDF = () => {
    const pdfFile =
      pdfDocument.pdfFile

    if (!pdfFile) return

    const url =
      URL.createObjectURL(pdfFile)

    const link =
      document.createElement('a')

    link.href = url

    link.download =
      pdfFile.name ||
      'modified.pdf'

    document.body.appendChild(link)

    link.click()

    link.remove()

    pdfDocument.setIsDirty(false)

    /*
     * Give the browser a moment
     * to start the download before
     * revoking the object URL.
     */
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 1000)
  }

  return {
    /*
     * Document
     */
    pdfFile:
      pdfDocument.pdfFile,

    pdfUrl:
      pdfDocument.pdfUrl,

    isDirty:
        pdfDocument.isDirty,
    
    setIsDirty:
        pdfDocument.setIsDirty,

    openPDF,

    replacePdfFile,

    /*
     * Pages
     */
    numPages:
      pages.numPages,

    setNumPages:
      pages.setNumPages,

    currentPage:
      pages.currentPage,

    setCurrentPage:
      pages.setCurrentPage,

    selectedPages:
      pages.selectedPages,

    setSelectedPages:
      pages.setSelectedPages,

    previousPage:
      pages.previousPage,

    nextPage:
      pages.nextPage,

    /*
     * View
     */
    zoom:
      view.zoom,

    rotation:
      view.rotation,

    zoomIn:
      view.zoomIn,

    zoomOut:
      view.zoomOut,

    resetZoom:
      view.resetZoom,

    rotateView:
      view.rotateView,

    /*
     * Operations
     */
    processing:
      operations.processing,

    handleDeletePages:
      operations.handleDeletePages,

    handleRotatePages:
      operations.handleRotatePages,

    handleDuplicatePage:
      operations.handleDuplicatePage,

    handleReorder:
      operations.handleReorder,

    handleExtractPages:
      operations.handleExtractPages,

    /*
     * Save
     */
    savePDF,
  }
}