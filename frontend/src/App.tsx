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

import useTextClipboard
  from './hooks/useTextClipboard'

import type {
  AnnotationType,
} from './types/annotation'

import {
  saveAnnotations,
  loadOpenPDFBookmarks,
} from './api/pdfApi'
import TextToolbar from './components/TextToolbar'
import MergePDF from './components/MergePDF'
import type { PDFOutlineItem } from './hooks/usePDFOutline'

interface BookmarkTarget {
  text: string
  page: number
  x: number
  y: number
  width: number
  height: number
}

interface PDFBookmark {
  id: string
  title: string
  pageNumber: number
  left: number
  top: number
  level: number
}

interface BookmarkNavigation {
  bookmark: PDFBookmark
  requestId: number
}


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

  const [
    selectedTextId,
    setSelectedTextId,
  ] = useState<string | null>(null)

  const [pastePosition, setPastePosition] =
    useState<{
      page: number
      x: number
      y: number
    } | null>(null)
  
  const [outline, setOutline] = useState<PDFOutlineItem[]>([])

  const [outlineNavigation, setOutlineNavigation] =
    useState<PDFOutlineItem | null>(null)

  const [
    selectedBookmarkTarget,
    setSelectedBookmarkTarget,
  ] = useState<BookmarkTarget | null>(null)

  const [
    bookmarks,
    setBookmarks,
  ] = useState<PDFBookmark[]>([])

  const [
  bookmarkNavigation,
  setBookmarkNavigation,
] = useState<BookmarkNavigation | null>(null)

  const [showMergePDF, setShowMergePDF] =
    useState(false)

  const {
    copyText,
    getCopiedText,
  } =
    useTextClipboard()

  const {
    textElements,
    addText,
    updateText,
    updateTextFontSize,
    updateTextFormatting,
    removeText,
    moveText,
    duplicateText,
    pasteText,
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

  const selectedTextElement =
    textElements.find(
      (element) =>
        element.id ===
        selectedTextId,
    ) ?? null
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
    | 'merge'
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

    if (pendingAction === 'merge') {
      editor.closePDF()
      setShowMergePDF(true)
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

  const handleMergePDF = () => {
    /*
    * No PDF is currently open.
    * Open Merge PDF directly.
    */
    if (!editor.pdfFile) {
      setShowMergePDF(true)
      return
    }

    /*
    * PDF is open but has no unsaved changes.
    * Close it first, then open Merge PDF.
    */
    if (!editor.isDirty) {
      editor.closePDF()
      setShowMergePDF(true)
      return
    }

    /*
    * PDF has unsaved changes.
    * Reuse the existing unsaved-changes dialog.
    */
    setPendingAction('merge')
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

  const handleSaveBeforeAction = async () => {
    const saved =
      await handleSaveAnnotations()

    if (!saved) {
      return
    }

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
  
  const handleSelectTool = useCallback(() => {
    setSelectedTextId(null)
    setAnnotationMode(null)
    setTextMode(false)
  }, [])

  const handleDuplicateText = useCallback(() => {
    if (!selectedTextId) {
      return
    }

    const newId =
      duplicateText(selectedTextId)

    if (newId) {
      setSelectedTextId(newId)
    }
  }, [
    selectedTextId,
    duplicateText,
  ])

  const handleCopyText =
    useCallback(async () => {
      if (!selectedTextId) {
        return
      }

      const element =
        textElements.find(
          (item) =>
            item.id === selectedTextId,
        )

      if (!element) {
        return
      }

      await copyText(element)
    }, [
      selectedTextId,
      textElements,
      copyText,
    ])
  
  const handlePasteText =
  useCallback(async () => {
    const {
      element,
      text,
    } =
      await getCopiedText()

    if (element) {
      const position =
        pastePosition?.page ===
        editor.currentPage
          ? pastePosition
          : {
              page: editor.currentPage,
              x: 100,
              y: 100,
            }

      const newId =
        pasteText(
          element,
          position.x,
          position.y,
        )

      if (newId) {
        setSelectedTextId(newId)
      }

      return
    }

    if (!text) {
      return
    }

    const trimmedText =
      text.trim()

    if (!trimmedText) {
      return
    }

    if (!editor.pdfFile) {
      return
    }

    const position =
      pastePosition?.page ===
      editor.currentPage
        ? pastePosition
        : {
            page: editor.currentPage,
            x: 100,
            y: 100,
          }

    const newId =
      addText(
        position.page,
        position.x,
        position.y,
        trimmedText,
      )

    if (newId) {
      setSelectedTextId(newId)
    }
  }, [
    getCopiedText,
    pasteText,
    addText,
    editor.pdfFile,
    editor.currentPage,
    pastePosition,
  ])

  const handleSetPastePosition =
    useCallback(
      (
        page: number,
        x: number,
        y: number,
      ) => {
        setPastePosition({
          page,
          x,
          y,
        })
      },
      [],
    )

  const handleToggleTextBold =
    useCallback(() => {
      if (!selectedTextId) {
        return
      }

      const element =
        textElements.find(
          (item) =>
            item.id === selectedTextId,
        )

      if (!element) {
        return
      }

      updateTextFormatting(
        selectedTextId,
        {
          bold: !element.bold,
        },
      )
    }, [
      selectedTextId,
      textElements,
      updateTextFormatting,
    ])

  const handleToggleTextItalic =
    useCallback(() => {
      if (!selectedTextId) {
        return
      }

      const element =
        textElements.find(
          (item) =>
            item.id === selectedTextId,
        )

      if (!element) {
        return
      }

      updateTextFormatting(
        selectedTextId,
        {
          italic: !element.italic,
        },
      )
    }, [
      selectedTextId,
      textElements,
      updateTextFormatting,
    ])

  const handleToggleTextUnderline =
    useCallback(() => {
      if (!selectedTextId) {
        return
      }

      const element =
        textElements.find(
          (item) =>
            item.id === selectedTextId,
        )

      if (!element) {
        return
      }

      updateTextFormatting(
        selectedTextId,
        {
          underline: !element.underline,
        },
      )
    }, [
      selectedTextId,
      textElements,
      updateTextFormatting,
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

  const handleSaveAnnotations = async (): Promise<boolean> => {
    if (!editor.pdfUrl) {
      return false
    }

    try {
      setIsSaving(true)

      const newFile =
        await saveAnnotations(
          editor.pdfUrl,
          annotations,
          textElements,
          bookmarks,
        )

      editor.replacePdfFile(newFile)

      annotationsRef.current = annotations

      textElementsRef.current = []
      replaceTextElements([])

      history.reset({
        annotations,
        textElements: [],
      })

      const url =
        URL.createObjectURL(newFile)

      const link =
        document.createElement('a')

      link.href = url

      link.download =
        newFile.name ||
        'annotated.pdf'

      document.body.appendChild(link)

      link.click()

      link.remove()

      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)

      return true

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

      return false

    } finally {
      setIsSaving(false)
    }
  }

  const handleAddBookmark = () => {
    if (!selectedBookmarkTarget) {
      return
    }

    const target = selectedBookmarkTarget

    const bookmark: PDFBookmark = {
      id: crypto.randomUUID(),
      title: target.text,
      pageNumber: target.page,
      left: target.x,
      top: target.y,
      level: 0,
    }

    setBookmarks((current) => {
      const next = [...current, bookmark]

      next.sort((a, b) => {
        if (a.pageNumber !== b.pageNumber) {
          return a.pageNumber - b.pageNumber
        }

        if (a.top !== b.top) {
          return b.top - a.top
        }

        return a.left - b.left
      })

      return next
    })

    setSelectedBookmarkTarget(null)
  }
  
  const handleChangeBookmarkLevel = (
    id: string,
    level: number,
  ) => {
    setBookmarks((current) => {
      const index = current.findIndex(
        (bookmark) => bookmark.id === id,
      )

      if (index === -1) {
        return current
      }

      // Bookmark đầu tiên luôn là root
      if (index === 0) {
        return current.map((bookmark) =>
          bookmark.id === id
            ? {
                ...bookmark,
                level: 0,
              }
            : bookmark,
        )
      }

      const previousBookmark = current[index - 1]

      const maxLevel =
        previousBookmark.level + 1

      const nextLevel = Math.max(
        0,
        Math.min(level, maxLevel),
      )

      return current.map((bookmark) =>
        bookmark.id === id
          ? {
              ...bookmark,
              level: nextLevel,
            }
          : bookmark,
      )
    })
  }

  const handleDeleteBookmark = (id: string) => {
    setBookmarks((current) =>
      current.filter(
        (bookmark) => bookmark.id !== id,
      ),
    )
  }

  const handleEditBookmarkTitle = (
    id: string,
    title: string,
  ) => {
    const newTitle = title.trim()

    if (!newTitle) {
      return
    }

    setBookmarks((current) =>
      current.map((bookmark) =>
        bookmark.id === id
          ? {
              ...bookmark,
              title: newTitle,
            }
          : bookmark,
      ),
    )
  }

  const handleBookmarkClick = useCallback(
    (bookmark: PDFBookmark) => {
      setBookmarkNavigation((current) => ({
        bookmark,
        requestId:
          (current?.requestId ?? 0) + 1,
      }))

      editor.setCurrentPage(
        bookmark.pageNumber,
      )
    },
    [
      editor.setCurrentPage,
    ],
  )

  const handleMergedPDF = useCallback(
    (file: File) => {
      /*
      * The merged PDF becomes the new
      * current document.
      */
      editor.replacePdfFile(file)

      /*
      * Reset document-related state.
      */
      replaceAnnotations([])

      annotationsRef.current = []

      replaceTextElements([])

      textElementsRef.current = []

      setBookmarks([])

      setSelectedBookmarkTarget(null)

      setBookmarkNavigation(null)

      setOutline([])

      setOutlineNavigation(null)

      setSelectedTextId(null)

      setPastePosition(null)

      setAnnotationMode(null)

      setTextMode(false)

      /*
      * Reset editor history for the new document.
      */
      history.reset({
        annotations: [],
        textElements: [],
      })

      /*
      * The merged PDF itself is already saved.
      */
      editor.setIsDirty(false)

      /*
      * Close Merge PDF screen.
      */
      setShowMergePDF(false)
    },
    [
      editor,
      replaceAnnotations,
      replaceTextElements,
      history,
    ],
  )

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

    onDuplicateText:
      handleDuplicateText,

    onCopyText:
      handleCopyText,

    onPasteText:
      handlePasteText,

    disabled:
      editor.processing ||
      isSaving,

    hasPDF:
      !!editor.pdfFile,
    
    hasSelectedText:
      selectedTextId !== null,

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

  useEffect(() => {
    if (!editor.pdfUrl) {
      setBookmarks([])
      return
    }

    let cancelled = false

    const loadBookmarks = async () => {
      try {
        const loaded =
          await loadOpenPDFBookmarks(
            editor.pdfUrl,
          )

        if (cancelled) {
          return
        }

        const normalized =
          loaded.map(
            (
              bookmark,
              index,
            ) => ({
              ...bookmark,
              id:
                bookmark.id ||
                `pdf-bookmark-${index}`,
            }),
          )

        setBookmarks(
          normalized,
        )
      } catch (error) {
        console.error(
          'Failed to load OpenPDF bookmarks:',
          error,
        )

        if (!cancelled) {
          setBookmarks([])
        }
      }
    }

    loadBookmarks()

    return () => {
      cancelled = true
    }
  }, [
    editor.pdfUrl,
  ])

  /*
  * =====================================================
  * IMPORT NATIVE PDF BOOKMARKS
  * =====================================================
  *
  * Khi mở một PDF mới:
  * - outline = native PDF bookmarks
  * - bookmarks = danh sách bookmark mà OpenPDF quản lý
  *
  * Import toàn bộ native outline sang bookmarks
  * để PDF có sẵn bookmark cũng sử dụng được
  * các chức năng click / level / delete / highlight.
  */

  useEffect(() => {
    if (!editor.pdfUrl) {
      setBookmarks([])
      return
    }

    if (outline.length === 0) {
      setBookmarks([])
      return
    }

    const importedBookmarks: PDFBookmark[] = []

    const walkOutline = (
      items: PDFOutlineItem[],
      level: number,
    ) => {
      for (const item of items) {
        if (
          item.pageNumber === null ||
          item.pageNumber === undefined
        ) {
          continue
        }

        importedBookmarks.push({
          id: crypto.randomUUID(),
          title: item.title,
          pageNumber: item.pageNumber,
          left: item.left ?? 0,
          top: item.top ?? 0,
          level,
        })

        if (item.items.length > 0) {
          walkOutline(
            item.items,
            level + 1,
          )
        }
      }
    }

    walkOutline(outline, 0)

    setBookmarks(importedBookmarks)
  }, [
    editor.pdfUrl,
    outline,
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

          onMergePDF={
            handleMergePDF
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

        onToggleBold={
          handleToggleTextBold
        }

        onToggleItalic={
          handleToggleTextItalic
        }

        onToggleUnderline={
          handleToggleTextUnderline
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

        selectedTextElement={
          selectedTextElement
        }

        onUpdateTextFontSize={
          updateTextFontSize
        }

        onSelectTool={handleSelectTool}

      />


      {/* =================================================
          MAIN CONTENT
          ================================================= */}

      <main className="main-content">
        {showMergePDF ? (
          <MergePDF
            onClose={() =>
              setShowMergePDF(false)
            }
            onMerged={
              handleMergedPDF
            }
          />
        ) : editor.pdfUrl ? (

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

              outline={outline}

              onOutlineItemClick={setOutlineNavigation}

              selectedBookmarkTarget={
                selectedBookmarkTarget
              }

              onAddBookmark={
                handleAddBookmark
              }

              bookmarks={bookmarks}

              onChangeBookmarkLevel={
                handleChangeBookmarkLevel
              }

              onDeleteBookmark={
                handleDeleteBookmark
              }

              onEditBookmarkTitle={
                handleEditBookmarkTitle
              }

              onBookmarkClick={
                handleBookmarkClick
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

                selectedTextId={
                  selectedTextId
                }

                onSelectText={
                  setSelectedTextId
                }

                onAddText={
                  addText
                }

                onUpdateText={
                  updateText
                }

                onUpdateTextFontSize={
                  updateTextFontSize
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

                onOutlineChange={setOutline}
                outlineNavigation={outlineNavigation}
                bookmarkNavigation={bookmarkNavigation}
                onTextSelection={setSelectedBookmarkTarget}

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

                onSetPastePosition={
                  handleSetPastePosition
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