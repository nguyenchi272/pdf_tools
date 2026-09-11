import {
  FilePlus,
} from 'lucide-react'

import {
  useState,
  useEffect,
} from 'react'

import PDFViewer from './components/PDFViewer'
import Sidebar from './components/Sidebar'
import Toolbar from './components/Toolbar'
import TopMenu from './components/menus/TopMenu'

import {
  usePDFEditor,
} from './hooks/usePDFEditor'

import useAnnotations
  from './hooks/useAnnotations'

import useTopMenu
  from './hooks/useTopMenu'

import useKeyboardShortcuts
  from './hooks/useKeyboardShortcuts'

import type {
  AnnotationType,
} from './types/annotation'

import {
  saveAnnotations,
} from './api/pdfApi'


export default function App() {

  /*
   * =====================================================
   * PDF EDITOR
   * =====================================================
   */

  const editor =
    usePDFEditor()


  /*
   * =====================================================
   * ANNOTATIONS
   * =====================================================
   */

  const {
    annotations,
    addAnnotation,
    addNote,
    removeAnnotation,
    replaceAnnotations,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useAnnotations()


  const [
    annotationMode,
    setAnnotationMode,
  ] = useState<AnnotationType | null>(null)


  /*
   * =====================================================
   * SAVE STATE
   * =====================================================
   */

  const [
    isSaving,
    setIsSaving,
  ] = useState(false)


  /*
   * =====================================================
   * TOP MENU
   * =====================================================
   */

  const {
    openTopMenu,
    toggleTopMenu,
    closeTopMenu,
  } = useTopMenu()


  /*
   * =====================================================
   * SAVE PDF
   * =====================================================
   */

  const handleSaveAnnotations =
    async () => {

      if (!editor.pdfUrl) {
        return
      }

      try {

        setIsSaving(true)

        const newFile =
          await saveAnnotations(
            editor.pdfUrl,
            annotations,
          )


        /*
         * Make the newly generated PDF
         * the current PDF.
         */
        editor.replacePdfFile(
          newFile,
        )


        /*
         * Download the generated PDF.
         */
        const url =
          URL.createObjectURL(
            newFile,
          )

        const link =
          document.createElement('a')

        link.href = url

        link.download =
          newFile.name ||
          'annotated.pdf'

        document.body.appendChild(
          link,
        )

        link.click()

        link.remove()


        /*
         * Release object URL.
         */
        setTimeout(() => {
          URL.revokeObjectURL(url)
        }, 1000)

      } catch (error) {

        console.error(
          'Failed to save annotations:',
          error,
        )

        window.alert(
          error instanceof Error
            ? error.message
            : 'Failed to save annotations.',
        )

      } finally {

        setIsSaving(false)

      }
    }


  /*
   * =====================================================
   * KEYBOARD SHORTCUTS
   * =====================================================
   */

  useKeyboardShortcuts({

    onOpen:
      editor.openPDF,

    onSave:
      handleSaveAnnotations,

    onUndo:
      undo,

    onRedo:
      redo,

    onZoomIn:
      editor.zoomIn,

    onZoomOut:
      editor.zoomOut,

    onCloseMenu:
      closeTopMenu,

    disabled:
      editor.processing ||
      isSaving,

    hasPDF:
      !!editor.pdfFile,

  })


  /*
   * =====================================================
   * CLOSE TOP MENU
   * WHEN CLICKING OUTSIDE
   * =====================================================
   */

  useEffect(() => {

    const handleMouseDown = (
      event: MouseEvent,
    ) => {

      const target =
        event.target as HTMLElement | null

      if (
        !target?.closest(
          '.top-menu',
        )
      ) {
        closeTopMenu()
      }

    }


    document.addEventListener(
      'mousedown',
      handleMouseDown,
    )


    return () => {

      document.removeEventListener(
        'mousedown',
        handleMouseDown,
      )

    }

  }, [
    closeTopMenu,
  ])


  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (

    <div className="app">


      {/* =================================================
          TOP BAR
          ================================================= */}

      <header className="topbar">

        <div className="brand">
          OpenPDF
        </div>


        <TopMenu

          /*
           * Menu state
           */

          openTopMenu={
            openTopMenu
          }

          toggleTopMenu={
            toggleTopMenu
          }

          closeTopMenu={
            closeTopMenu
          }


          /*
           * File
           */

          onOpen={
            editor.openPDF
          }

          onSave={
            handleSaveAnnotations
          }

          hasPDF={
            !!editor.pdfFile
          }

          processing={
            editor.processing
          }

          isSaving={
            isSaving
          }


          /*
           * Edit
           */

          onUndo={
            undo
          }

          onRedo={
            redo
          }

          canUndo={
            canUndo
          }

          canRedo={
            canRedo
          }


          /*
           * View
           */

          onZoomIn={
            editor.zoomIn
          }

          onZoomOut={
            editor.zoomOut
          }

          onResetZoom={
            editor.resetZoom
          }

          onRotateView={
            editor.rotateView
          }


          /*
           * Pages
           */

          selectedPages={
            editor.selectedPages
          }

          onDelete={
            editor.handleDeletePages
          }

          onDuplicate={
            editor.handleDuplicatePage
          }

          onRotate={
            editor.handleRotatePages
          }

          onExtract={
            editor.handleExtractPages
          }


          /*
           * Annotation
           */

          annotationMode={
            annotationMode
          }

          onAnnotationModeChange={
            setAnnotationMode
          }

        />

      </header>


      {/* =================================================
          TOOLBAR
          ================================================= */}

      <Toolbar

        hasPDF={
          !!editor.pdfFile
        }

        processing={
          editor.processing ||
          isSaving
        }

        currentPage={
          editor.currentPage
        }

        numPages={
          editor.numPages
        }

        selectedPages={
          editor.selectedPages
        }

        zoom={
          editor.zoom
        }


        /*
         * PDF operations
         */

        onOpen={
          editor.openPDF
        }

        onSave={
          handleSaveAnnotations
        }

        onDelete={
          editor.handleDeletePages
        }

        onDuplicate={
          editor.handleDuplicatePage
        }

        onRotate={
          editor.handleRotatePages
        }

        onExtract={
          editor.handleExtractPages
        }


        /*
         * Zoom
         */

        onZoomIn={
          editor.zoomIn
        }

        onZoomOut={
          editor.zoomOut
        }

        onResetZoom={
          editor.resetZoom
        }


        /*
         * View rotation
         */

        onRotateView={
          editor.rotateView
        }


        /*
         * Page navigation
         */

        onPreviousPage={
          editor.previousPage
        }

        onNextPage={
          editor.nextPage
        }


        /*
         * Annotation
         */

        annotationMode={
          annotationMode
        }

        onAnnotationModeChange={
          setAnnotationMode
        }


        /*
         * Annotation history
         */

        onUndo={
          undo
        }

        onRedo={
          redo
        }

        canUndo={
          canUndo
        }

        canRedo={
          canRedo
        }

      />


      {/* =================================================
          MAIN CONTENT
          ================================================= */}

      <main className="main-content">

        {editor.pdfUrl ? (

          <>


            {/* =========================================
                SIDEBAR
                ========================================= */}

            <Sidebar

              pdfUrl={
                editor.pdfUrl
              }

              numPages={
                editor.numPages
              }

              currentPage={
                editor.currentPage
              }

              selectedPages={
                editor.selectedPages
              }

              onPageChange={
                editor.setCurrentPage
              }

              onSelectionChange={
                editor.setSelectedPages
              }

              onReorder={
                editor.handleReorder
              }

            />


            {/* =========================================
                PDF VIEWER
                ========================================= */}

            <section
              className="viewer-container"
            >

              <PDFViewer

                pdfUrl={
                  editor.pdfUrl
                }

                zoom={
                  editor.zoom
                }

                rotation={
                  editor.rotation
                }

                currentPage={
                  editor.currentPage
                }


                /*
                 * Annotation state
                 */

                annotations={
                  annotations
                }

                annotationMode={
                  annotationMode
                }

                onAddAnnotation={
                  addAnnotation
                }

                onAddNote={
                  addNote
                }

                onRemoveAnnotation={
                  removeAnnotation
                }

                onLoadAnnotations={
                  replaceAnnotations
                }


                /*
                 * PDF state
                 */

                onNumPages={
                  editor.setNumPages
                }

                onPageChange={
                  editor.setCurrentPage
                }

              />

            </section>

          </>

        ) : (


          /* ===========================================
             EMPTY STATE
             =========================================== */

          <div className="empty-state">

            <FilePlus
              size={64}
            />


            <h2>
              Open a PDF to get started
            </h2>


            <p>
              Edit, organize and manage
              your PDF documents locally.
            </p>


            <button
              className="open-button"
              onClick={
                editor.openPDF
              }
            >
              Open PDF
            </button>

          </div>

        )}

      </main>


      {/* =================================================
          STATUS BAR
          ================================================= */}

      <footer className="statusbar">

        <span>

          {editor.processing ||
          isSaving
            ? 'Processing PDF...'
            : editor.pdfFile
              ? editor.pdfFile.name
              : 'No document'}

        </span>


        <span>

          {annotationMode

            ? `Annotation: ${annotationMode}`

            : editor.selectedPages.length > 0

              ? `${editor.selectedPages.length} page(s) selected`

              : 'Ready'}

        </span>

      </footer>

    </div>
  )
}