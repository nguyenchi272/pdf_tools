import {
  useEffect,
  useState,
} from 'react'

import {
  deletePages,
  rotatePages,
  duplicatePage,
  reorderPages,
  extractPages,
} from '../api/pdfApi'


export function usePDFEditor() {

  const [pdfFile, setPdfFile] =
    useState<File | null>(null)

  const [pdfUrl, setPdfUrl] =
    useState('')

  const [numPages, setNumPages] =
    useState(0)

  const [currentPage, setCurrentPage] =
    useState(1)

  const [selectedPages, setSelectedPages] =
    useState<number[]>([])

  const [zoom, setZoom] =
    useState(1)

  const [rotation, setRotation] =
    useState(0)

  const [processing, setProcessing] =
    useState(false)


  /*
   * Create object URL whenever the PDF changes.
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
   * Open PDF
   */

  const openPDF = () => {

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

      setPdfFile(file)

      setCurrentPage(1)
      setSelectedPages([])
      setZoom(1)
      setRotation(0)
      setNumPages(0)
    }

    input.click()
  }


  /*
   * Zoom
   */

  const zoomIn = () => {

    setZoom((value) =>
      Math.min(
        3,
        Number(
          (value + 0.1).toFixed(2),
        ),
      ),
    )
  }


  const zoomOut = () => {

    setZoom((value) =>
      Math.max(
        0.5,
        Number(
          (value - 0.1).toFixed(2),
        ),
      ),
    )
  }


  const resetZoom = () => {
    setZoom(1)
  }


  /*
   * Viewer-only rotation.
   */

  const rotateView = () => {

    setRotation(
      (value) =>
        (value + 90) % 360,
    )
  }


  /*
   * Page navigation
   */

  const previousPage = () => {

    setCurrentPage((page) =>
      Math.max(1, page - 1),
    )
  }


  const nextPage = () => {

    setCurrentPage((page) =>
      Math.min(
        numPages,
        page + 1,
      ),
    )
  }


  /*
   * Delete selected pages.
   */

  const handleDeletePages = async () => {

    if (!pdfFile) return

    if (selectedPages.length === 0) {

      alert(
        'Select at least one page first.',
      )

      return
    }

    const confirmed =
      window.confirm(
        `Delete ${selectedPages.length} selected page(s)?`,
      )

    if (!confirmed) return

    try {

      setProcessing(true)

      const newFile =
        await deletePages(
          pdfFile,
          selectedPages,
        )

      const deletedCurrentPage =
        selectedPages.includes(currentPage)

      const deletedBeforeCurrent =
        selectedPages.filter(
          (page) =>
            page < currentPage,
        ).length

      setPdfFile(newFile)

      setSelectedPages([])

      /*
       * Keep the same logical page visible
       * whenever possible.
       */
      if (deletedCurrentPage) {

        setCurrentPage(
          Math.min(
            currentPage -
              deletedBeforeCurrent,
            Math.max(
              1,
              numPages -
                selectedPages.length,
            ),
          ),
        )

      } else {

        setCurrentPage(
          Math.max(
            1,
            currentPage -
              deletedBeforeCurrent,
          ),
        )
      }

      setRotation(0)

    } catch (error) {

      console.error(error)

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to delete pages.',
      )

    } finally {

      setProcessing(false)
    }
  }


  /*
   * Rotate selected pages.
   */

  const handleRotatePages = async () => {

    if (!pdfFile) return

    if (selectedPages.length === 0) {

      alert(
        'Select at least one page first.',
      )

      return
    }

    try {

      setProcessing(true)

      const newFile =
        await rotatePages(
          pdfFile,
          selectedPages,
          90,
        )

      setPdfFile(newFile)

      setSelectedPages([])

      setRotation(0)

    } catch (error) {

      console.error(error)

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to rotate pages.',
      )

    } finally {

      setProcessing(false)
    }
  }


  /*
   * Duplicate selected page.
   */

  const handleDuplicatePage = async () => {

    if (!pdfFile) return

    if (selectedPages.length !== 1) {

      alert(
        'Select exactly one page to duplicate.',
      )

      return
    }

    try {

      setProcessing(true)

      const selectedPage =
        selectedPages[0]

      const newFile =
        await duplicatePage(
          pdfFile,
          selectedPage,
        )

      setPdfFile(newFile)

      setSelectedPages([])

      setRotation(0)

      /*
       * The duplicated page is inserted
       * immediately after the original.
       */
      setCurrentPage(
        selectedPage + 1 <= numPages + 1
          ? selectedPage + 1
          : selectedPage,
      )

    } catch (error) {

      console.error(error)

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to duplicate page.',
      )

    } finally {

      setProcessing(false)
    }
  }


  /*
   * Reorder pages using drag & drop.
   */

  const handleReorder = async (
    draggedPage: number,
    targetPage: number,
  ) => {

    if (!pdfFile) return

    if (
      draggedPage === targetPage
    ) {
      return
    }

    const order =
      Array.from(
        { length: numPages },
        (_, index) => index + 1,
      )

    const draggedIndex =
      order.indexOf(draggedPage)

    if (draggedIndex === -1) {
      return
    }

    order.splice(
      draggedIndex,
      1,
    )

    const targetIndex =
      order.indexOf(targetPage)

    if (targetIndex === -1) {
      return
    }

    order.splice(
      targetIndex,
      0,
      draggedPage,
    )

    const currentIndex =
      order.indexOf(currentPage)

    try {

      setProcessing(true)

      const newFile =
        await reorderPages(
          pdfFile,
          order,
        )

      setPdfFile(newFile)

      setSelectedPages([])

      setRotation(0)

      if (currentIndex !== -1) {

        setCurrentPage(
          currentIndex + 1,
        )
      }

    } catch (error) {

      console.error(error)

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to reorder pages.',
      )

    } finally {

      setProcessing(false)
    }
  }


  /*
   * Extract selected pages.
   */

  const handleExtractPages = async () => {

    if (!pdfFile) return

    if (selectedPages.length === 0) {

      alert(
        'Select at least one page first.',
      )

      return
    }

    try {

      setProcessing(true)

      const newFile =
        await extractPages(
          pdfFile,
          selectedPages,
        )

      setPdfFile(newFile)

      setCurrentPage(1)

      setSelectedPages([])

      setRotation(0)

    } catch (error) {

      console.error(error)

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to extract pages.',
      )

    } finally {

      setProcessing(false)
    }
  }


  /*
   * Save current PDF.
   */

  const savePDF = () => {

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

    /*
     * Give the browser a moment to start
     * the download before revoking the URL.
     */
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 1000)
  }


  return {
    pdfFile,
    pdfUrl,

    numPages,
    setNumPages,

    currentPage,
    setCurrentPage,

    selectedPages,
    setSelectedPages,

    zoom,
    rotation,

    processing,

    openPDF,

    zoomIn,
    zoomOut,
    resetZoom,
    rotateView,

    previousPage,
    nextPage,

    handleDeletePages,
    handleRotatePages,
    handleDuplicatePage,
    handleReorder,
    handleExtractPages,

    savePDF,
  }
}