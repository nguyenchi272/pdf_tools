import { useEffect, useState } from 'react'

import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronLeft,
  ChevronRight,
  FilePlus,
  Trash2,
  Copy,
  FileOutput,
} from 'lucide-react'

import PDFViewer from './components/PDFViewer'
import Sidebar from './components/Sidebar'

import {
  deletePages,
  rotatePages,
  duplicatePage,
  reorderPages,
  extractPages,
} from './api/pdfApi'


export default function App() {

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
   * Create object URL whenever PDF changes
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
   * View-only rotation
   */

  const rotateView = () => {

    setRotation(
      (rotation + 90) % 360,
    )
  }


  /*
   * Previous / next
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
   * Delete selected pages
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

      setPdfFile(newFile)

      setSelectedPages([])

      setCurrentPage(
        Math.min(
          currentPage,
          Math.max(
            1,
            numPages -
              selectedPages.length,
          ),
        ),
      )

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
   * Rotate selected pages
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
   * Duplicate page
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
       * Keep the duplicated page visible.
       *
       * If the last page was duplicated,
       * the new copy becomes the last page.
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
   * Reorder pages
   *
   * Drag page A onto page B.
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

    const targetIndex =
      order.indexOf(targetPage)

    if (
      draggedIndex === -1 ||
      targetIndex === -1
    ) {
      return
    }

    /*
     * Remove dragged page.
     */
    order.splice(draggedIndex, 1)

    /*
     * Insert before target page.
     *
     * Recalculate target index after removal.
     */
    const newTargetIndex =
      order.indexOf(targetPage)

    order.splice(
      newTargetIndex,
      0,
      draggedPage,
    )

    /*
     * Find where the current page moved.
     */
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
   * Extract selected pages
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
   * Save / download current PDF
   */

  const savePDF = () => {

    if (!pdfFile) return

    const url =
      URL.createObjectURL(pdfFile)

    const link =
      document.createElement('a')

    link.href = url

    link.download =
      pdfFile.name || 'modified.pdf'

    link.click()

    URL.revokeObjectURL(url)
  }


  return (

    <div className="app">

      {/* TOP BAR */}

      <header className="topbar">

        <div className="brand">
          OpenPDF
        </div>

        <nav className="menu">

          <button onClick={openPDF}>
            File
          </button>

          <button>
            Edit
          </button>

          <button>
            View
          </button>

          <button>
            Tools
          </button>

          <button>
            Help
          </button>

        </nav>

      </header>


      {/* TOOLBAR */}

      <div className="toolbar">

        <button
          onClick={openPDF}
          title="Open PDF"
        >
          <FilePlus size={18} />
          Open
        </button>


        <button
          onClick={savePDF}
          disabled={!pdfFile || processing}
          title="Save PDF"
        >
          Save
        </button>


        <div className="toolbar-separator" />


        <button
          onClick={handleDeletePages}
          disabled={
            !pdfFile ||
            processing ||
            selectedPages.length === 0
          }
          title="Delete selected pages"
        >
          <Trash2 size={18} />
          Delete
        </button>


        <button
          onClick={handleDuplicatePage}
          disabled={
            !pdfFile ||
            processing ||
            selectedPages.length !== 1
          }
          title="Duplicate selected page"
        >
          <Copy size={18} />
          Duplicate
        </button>


        <button
          onClick={handleRotatePages}
          disabled={
            !pdfFile ||
            processing ||
            selectedPages.length === 0
          }
          title="Rotate selected pages"
        >
          <RotateCw size={18} />
          Rotate
        </button>


        <div className="toolbar-separator" />


        <button
          onClick={handleExtractPages}
          disabled={
            !pdfFile ||
            processing ||
            selectedPages.length === 0
          }
          title="Extract selected pages"
        >
          <FileOutput size={18} />
          Extract
        </button>


        <div className="toolbar-separator" />


        <button
          onClick={zoomOut}
          disabled={!pdfFile}
          title="Zoom out"
        >
          <ZoomOut size={18} />
        </button>


        <button
          onClick={resetZoom}
          disabled={!pdfFile}
          title="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </button>


        <button
          onClick={zoomIn}
          disabled={!pdfFile}
          title="Zoom in"
        >
          <ZoomIn size={18} />
        </button>


        <button
          onClick={rotateView}
          disabled={!pdfFile}
          title="Rotate view"
        >
          <RotateCw size={18} />
        </button>


        <button
          onClick={resetZoom}
          disabled={!pdfFile}
          title="Fit"
        >
          <Maximize size={18} />
        </button>


        <div className="toolbar-spacer" />


        <button
          onClick={previousPage}
          disabled={
            !pdfFile ||
            currentPage <= 1
          }
        >
          <ChevronLeft size={18} />
        </button>


        <span className="page-counter">

          {pdfFile
            ? `${currentPage} / ${numPages}`
            : '0 / 0'}

        </span>


        <button
          onClick={nextPage}
          disabled={
            !pdfFile ||
            currentPage >= numPages
          }
        >
          <ChevronRight size={18} />
        </button>

      </div>


      {/* MAIN */}

      <main className="main-content">

        {pdfUrl ? (

          <>

            <Sidebar
              pdfUrl={pdfUrl}
              numPages={numPages}
              currentPage={currentPage}
              selectedPages={selectedPages}
              onPageChange={setCurrentPage}
              onSelectionChange={
                setSelectedPages
              }
              onReorder={
                handleReorder
              }
            />


            <section className="viewer-container">

              <PDFViewer
                pdfUrl={pdfUrl}
                zoom={zoom}
                rotation={rotation}
                currentPage={currentPage}
                onNumPages={setNumPages}
                onPageChange={setCurrentPage}
              />

            </section>

          </>

        ) : (

          <div className="empty-state">

            <FilePlus size={64} />

            <h2>
              Open a PDF to get started
            </h2>

            <p>
              Edit, organize and manage
              your PDF documents locally.
            </p>

            <button
              className="open-button"
              onClick={openPDF}
            >
              Open PDF
            </button>

          </div>

        )}

      </main>


      {/* STATUS BAR */}

      <footer className="statusbar">

        <span>
          {processing
            ? 'Processing PDF...'
            : pdfFile
              ? pdfFile.name
              : 'No document'}
        </span>


        <span>

          {selectedPages.length > 0
            ? `${selectedPages.length} page(s) selected`
            : 'Ready'}

        </span>

      </footer>

    </div>
  )
}