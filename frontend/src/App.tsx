import {
  FilePlus,
} from 'lucide-react'

import {
  useState,
} from 'react'


import PDFViewer from './components/PDFViewer'
import Sidebar from './components/Sidebar'
import Toolbar from './components/Toolbar'

import {
  usePDFEditor,
} from './hooks/usePDFEditor'

import useAnnotations
  from './hooks/useAnnotations'

import type {
  AnnotationType,
} from './types/annotation'


export default function App() {

  /*
   * =====================================================
   * PDF EDITOR STATE
   * =====================================================
   */

  const editor =
    usePDFEditor()


  /*
   * =====================================================
   * ANNOTATION STATE
   * =====================================================
   */

  const {
    annotations,
    addAnnotation,
    removeAnnotation,
    clearAnnotations,
  } = useAnnotations()


  const [
    annotationMode,
    setAnnotationMode,
  ] = useState<AnnotationType | null>(null)


  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (

    <div className="app">

      {/* =========================
          TOP BAR
          ========================= */}

      <header className="topbar">

        <div className="brand">
          OpenPDF
        </div>


        <nav className="menu">

          <button
            onClick={
              editor.openPDF
            }
          >
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


      {/* =========================
          TOOLBAR
          ========================= */}

      <Toolbar

        hasPDF={
          !!editor.pdfFile
        }

        processing={
          editor.processing
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
          editor.savePDF
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

      />


      {/* =========================
          MAIN CONTENT
          ========================= */}

      <main className="main-content">

        {editor.pdfUrl ? (

          <>

            {/* =========================
                SIDEBAR
                ========================= */}

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


            {/* =========================
                PDF VIEWER
                ========================= */}

            <section className="viewer-container">

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

          /* =========================
             EMPTY STATE
             ========================= */

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
              onClick={
                editor.openPDF
              }
            >
              Open PDF
            </button>

          </div>

        )}

      </main>


      {/* =========================
          STATUS BAR
          ========================= */}

      <footer className="statusbar">

        <span>

          {editor.processing
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