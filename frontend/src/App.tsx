import {
  FilePlus,
} from 'lucide-react'

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'

import PDFViewer from './components/PDFViewer'
import Sidebar from './components/Sidebar'
import Toolbar from './components/Toolbar'
import TopMenu from './components/menus/TopMenu'
import UnsavedChangesDialog from './components/UnsavedChangesDialog'

import {
  usePDFEditor,
} from './hooks/usePDFEditor'

import useAnnotations
  from './hooks/useAnnotations'

import useTopMenu
  from './hooks/useTopMenu'

import useKeyboardShortcuts
  from './hooks/useKeyboardShortcuts'

import useBeforeUnload from './hooks/useBeforeUnload'

import useTextElements
  from './hooks/useTextElements'

import useEditorHistory from './hooks/useEditorHistory'

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

  useBeforeUnload(editor.isDirty)

  const history =
    useEditorHistory()

  const historyActionRef =
    useRef<'undo' | 'redo' | null>(
      null,
    )

  const [textMode, setTextMode] =
    useState(false)

  const {
    textElements,
    addText,
    updateText,
    removeText,
    moveText,
    beginMoveText,
    endMoveText,
    beginResizeText,
    resizeText,
    endResizeText,
    replaceTextElements,
  } = useTextElements({
    onChange: (
      previous,
      next,
    ) => {
      history.record(
        {
          annotations: annotationsRef.current,
          textElements: previous,
        },
        {
          annotations: annotationsRef.current,
          textElements: next,
        },
      )
      textElementsRef.current = next

      editor.setIsDirty(true)
    },
  })
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
  } = useAnnotations({
    onChange: (
      previous,
      next,
    ) => {
      history.record(
        {
          annotations: previous,
          textElements: textElementsRef.current,
        },
        {
          annotations: next,
          textElements: textElementsRef.current,
        },
      )
      annotationsRef.current = next

      editor.setIsDirty(true)
    },
  })

  const annotationsRef =
    useRef(annotations)

  const textElementsRef =
    useRef(textElements)

  useEffect(() => {
    annotationsRef.current =
      annotations
  }, [annotations])

  useEffect(() => {
    textElementsRef.current =
      textElements
  }, [textElements])


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

  const [showUnsavedDialog, setShowUnsavedDialog] =
    useState(false)

  type PendingAction =
    | 'open'
    | 'new'
    | 'close'
    | null

  const [pendingAction, setPendingAction] =
    useState<PendingAction>(null)

  const executePendingAction = () => {
    if (pendingAction === 'open') {
      editor.openPDF()
    }

    if (pendingAction === 'new') {
      editor.closePDF()
    }

    if (pendingAction === 'close') {
      editor.closePDF()
    }

    setPendingAction(null)
  }

  const handleNewPDF = () => {
    if (!editor.pdfFile || !editor.isDirty) {
      editor.closePDF()
      return
    }

    setPendingAction('new')
    setShowUnsavedDialog(true)
  }

  const handleOpenPDF = () => {
    if (!editor.pdfFile || !editor.isDirty) {
      editor.openPDF()
      return
    }

    setPendingAction('open')
    setShowUnsavedDialog(true)
  }

  const handleClosePDF = () => {
    if (!editor.pdfFile || !editor.isDirty) {
      editor.closePDF()
      return
    }

    setPendingAction('close')
    setShowUnsavedDialog(true)
  }

  const handleDontSave = () => {
    setShowUnsavedDialog(false)

    executePendingAction()
  }

  const handleCancelUnsaved = () => {
    setShowUnsavedDialog(false)
    setPendingAction(null)
  }

  const handleSaveBeforeAction = () => {
    editor.savePDF()

    setShowUnsavedDialog(false)

    executePendingAction()
  }

  const handleUndo =
    useCallback(() => {
      if (!history.canUndo) {
        return
      }

      historyActionRef.current =
        'undo'

      history.undo()

      editor.setIsDirty(true)
    }, [
      history.canUndo,
      history.undo,
      editor,
    ])

  const handleRedo =
    useCallback(() => {
      if (!history.canRedo) {
        return
      }

      historyActionRef.current =
        'redo'

      history.redo()

      editor.setIsDirty(true)
    }, [
      history.canRedo,
      history.redo,
      editor,
    ])

  const handleLoadAnnotations =
    useCallback(
      (next: typeof annotations) => {
        replaceAnnotations(next)

        annotationsRef.current =
          next

        history.reset({
          annotations: next,
          textElements:
            textElementsRef.current,
        })
      },
      [
        replaceAnnotations,
        history.reset,
      ],
    )

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
            textElements,
          )


        /*
         * Make the newly generated PDF
         * the current PDF.
         */
        editor.replacePdfFile(
          newFile,
        )
        annotationsRef.current =
          annotations

        textElementsRef.current =
          []
        replaceTextElements([])
        history.reset({
          annotations,
          textElements: [],
        })

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
    onNew:
      handleNewPDF,

    onOpen:
      handleOpenPDF,

    onSave:
      handleSaveAnnotations,

    onUndo: handleUndo,
    onRedo: handleRedo,

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

  useEffect(() => {
    if (
      historyActionRef.current ===
      null
    ) {
      return
    }

    const snapshot =
      history.history.present

    replaceAnnotations(
      snapshot.annotations,
    )

    replaceTextElements(
      snapshot.textElements,
    )

    historyActionRef.current =
      null
  }, [
    history.history.present,
    replaceAnnotations,
    replaceTextElements,
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
          <span>
            OpenPDF
          </span>

          {editor.isDirty && (
            <span
              className="unsaved-indicator"
              title="Unsaved changes"
            >
              *
            </span>
          )}
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
          onNew={
            handleNewPDF
          }

          onOpen={
            handleOpenPDF
          }

          onSave={
            handleSaveAnnotations
          }

          onClosePDF={
            handleClosePDF
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
            handleUndo
          }

          onRedo={
            handleRedo
          }

          canUndo={
            history.canUndo
          }

          canRedo={
            history.canRedo
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
          handleOpenPDF
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

        //text mode
        textMode={
          textMode
        }

        onTextModeChange={
          setTextMode
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
          handleUndo
        }

        onRedo={
          handleRedo
        }

        canUndo={
          history.canUndo
        }

        canRedo={
          history.canRedo
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

                textMode={
                  textMode
                }

                textElements={
                  textElements
                }

                onAddText={
                  addText
                }

                onUpdateText={
                  updateText
                }

                onRemoveText={
                  removeText
                }

                onMoveText={
                  moveText
                }

                onBeginMoveText={
                  beginMoveText
                }

                onEndMoveText={
                  endMoveText
                }

                onBeginResizeText={beginResizeText}
                onResizeText={resizeText}
                onEndResizeText={endResizeText}

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
                  handleLoadAnnotations
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
          {editor.isDirty && (
            <span className="status-unsaved">
              Modified
            </span>
          )}
        </span>

        <span>

          {annotationMode

            ? `Annotation: ${annotationMode}`

            : editor.selectedPages.length > 0

              ? `${editor.selectedPages.length} page(s) selected`

              : 'Ready'}

        </span>

      </footer>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onCancel={handleCancelUnsaved}
        onDontSave={handleDontSave}
        onSave={handleSaveBeforeAction}
      />

    </div>
  )
}