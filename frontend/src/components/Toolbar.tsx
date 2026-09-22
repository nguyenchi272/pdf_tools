import {
  FilePlus,
  Save,
  Undo2,
  Redo2,
  ChevronDown,
  Trash2,
  Copy,
  RotateCw,
  FileOutput,
  Highlighter,
  Underline,
  Strikethrough,
  StickyNote,
  Type,
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronLeft,
  ChevronRight,
  MousePointer2,
} from 'lucide-react'

import {
  useEffect,
  useRef,
  useState,
} from 'react'

import type { TextElement } from '../types/text'
import TextToolbar from './TextToolbar'

import type {
  AnnotationType,
} from '../types/annotation'


interface ToolbarProps {
  hasPDF: boolean
  processing: boolean

  currentPage: number
  numPages: number

  selectedPages: number[]

  zoom: number

  annotationMode:
    | AnnotationType
    | null

  textMode: boolean

  canUndo: boolean
  canRedo: boolean

  selectedTextElement:
  TextElement | null

  onUpdateTextFontSize: (
    id: string,
    fontSize: number,
  ) => void

  onOpen: () => void
  onSave: () => void

  onDelete: () => void
  onDuplicate: () => void
  onRotate: () => void
  onExtract: () => void

  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void

  onRotateView: () => void

  onPreviousPage: () => void
  onNextPage: () => void

  onAnnotationModeChange:
    (mode: AnnotationType | null) => void

  onTextModeChange:
    (enabled: boolean) => void

  onUndo: () => void
  onRedo: () => void
  onSelectTool: () => void
  onToggleBold: () => void
  onToggleItalic: () => void
  onToggleUnderline: () => void
}


export default function Toolbar({
  hasPDF,
  processing,

  currentPage,
  numPages,

  selectedPages,

  zoom,

  annotationMode,
  textMode,

  canUndo,
  canRedo,
  selectedTextElement,

  onUpdateTextFontSize,
  onOpen,
  onSave,

  onDelete,
  onDuplicate,
  onRotate,
  onExtract,

  onZoomIn,
  onZoomOut,
  onResetZoom,

  onRotateView,

  onPreviousPage,
  onNextPage,

  onAnnotationModeChange,
  onTextModeChange,

  onUndo,
  onRedo,
  onSelectTool,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
}: ToolbarProps) {

  const [
    openMenu,
    setOpenMenu,
  ] = useState<
    'pages' | 'annotate' | null
  >(null)

  const toolbarRef =
    useRef<HTMLDivElement>(null)


  /*
   * =====================================================
   * CLOSE MENU
   * =====================================================
   */

  useEffect(() => {

    const handleMouseDown = (
      event: globalThis.MouseEvent,
    ) => {

      if (
        !toolbarRef.current?.contains(
          event.target as Node,
        )
      ) {
        setOpenMenu(null)
      }

    }


    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {

      if (event.key === 'Escape') {
        setOpenMenu(null)
      }

    }


    document.addEventListener(
      'mousedown',
      handleMouseDown,
    )

    document.addEventListener(
      'keydown',
      handleKeyDown,
    )


    return () => {

      document.removeEventListener(
        'mousedown',
        handleMouseDown,
      )

      document.removeEventListener(
        'keydown',
        handleKeyDown,
      )

    }

  }, [])


  /*
   * =====================================================
   * MENU HELPERS
   * =====================================================
   */

  const toggleMenu = (
    menu:
      | 'pages'
      | 'annotate',
  ) => {

    if (processing) {
      return
    }

    setOpenMenu((current) =>
      current === menu
        ? null
        : menu,
    )

  }


  const selectAnnotationMode = (
    mode: AnnotationType,
  ) => {
    onTextModeChange(false)

    onAnnotationModeChange(
      annotationMode === mode
        ? null
        : mode,
    )

    setOpenMenu(null)

  }

  const selectTextMode = () => {

    const nextMode = !textMode

    onTextModeChange(nextMode)

    if (nextMode) {
        onAnnotationModeChange(null)
    }

    setOpenMenu(null)

  }


  const pageOperationDisabled =
    !hasPDF ||
    processing ||
    selectedPages.length === 0


  const duplicateDisabled =
    !hasPDF ||
    processing ||
    selectedPages.length !== 1


  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (

    <div
      ref={toolbarRef}
      className="toolbar"
    >

      {/* =================================================
          PRIMARY
          ================================================= */}

      <div className="toolbar-group">

        <button
          className="toolbar-button"
          onClick={onOpen}
          disabled={processing}
          title="Open PDF"
        >
          <FilePlus size={17} />
          <span>Open</span>
        </button>


        <button
          className="toolbar-button"
          onClick={onSave}
          disabled={
            !hasPDF ||
            processing
          }
          title="Save PDF"
        >
          <Save size={17} />
          <span>Save</span>
        </button>

      </div>


      <div className="toolbar-separator" />


      {/* =================================================
          UNDO / REDO
          ================================================= */}

      <div className="toolbar-group">

        <button
          className="toolbar-icon-button"
          type="button"
          onClick={onUndo}
          disabled={!canUndo || processing}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <Undo2 size={18} />
        </button>


        <button
          className="toolbar-icon-button"
          type="button"
          onClick={onRedo}
          disabled={!canRedo || processing}
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
        >
          <Redo2 size={18} />
        </button>

      </div>


      <div className="toolbar-separator" />

      <button
        type="button"
        className="toolbar-button"
        title="Select"
        onClick={onSelectTool}
        disabled={!hasPDF || processing}
        >
        <MousePointer2 size={18} />
      </button>


      {/* =================================================
          PAGES MENU
          ================================================= */}

      <div className="toolbar-dropdown">

        <button
          type="button"
          className={
            openMenu === 'pages'
              ? 'toolbar-button menu-button active'
              : 'toolbar-button menu-button'
          }
          onClick={() =>
            toggleMenu('pages')
          }
          disabled={
            processing ||
            !hasPDF
          }
          aria-expanded={
            openMenu === 'pages'
          }
        >
          <span>Pages</span>
          <ChevronDown size={15} />
        </button>


        {openMenu === 'pages' && (

          <div className="toolbar-menu">

            <button
              type="button"
              onClick={() => {
                onDelete()
                setOpenMenu(null)
              }}
              disabled={
                pageOperationDisabled
              }
            >
              <Trash2 size={16} />
              <span>Delete Pages</span>
            </button>


            <button
              type="button"
              onClick={() => {
                onDuplicate()
                setOpenMenu(null)
              }}
              disabled={
                duplicateDisabled
              }
            >
              <Copy size={16} />
              <span>Duplicate Page</span>
            </button>


            <button
              type="button"
              onClick={() => {
                onRotate()
                setOpenMenu(null)
              }}
              disabled={
                pageOperationDisabled
              }
            >
              <RotateCw size={16} />
              <span>Rotate Pages</span>
            </button>


            <button
              type="button"
              onClick={() => {
                onExtract()
                setOpenMenu(null)
              }}
              disabled={
                pageOperationDisabled
              }
            >
              <FileOutput size={16} />
              <span>Extract Pages</span>
            </button>

          </div>

        )}

      </div>


      {/* =================================================
          ANNOTATE MENU
          ================================================= */}

      <div className="toolbar-dropdown">

        <button
          type="button"
          className={
            openMenu === 'annotate' ||
            annotationMode ||
            textMode
              ? 'toolbar-button menu-button active'
              : 'toolbar-button menu-button'
          }
          onClick={() =>
            toggleMenu('annotate')
          }
          disabled={
            processing ||
            !hasPDF
          }
          aria-expanded={
            openMenu === 'annotate'
          }
        >
          <Highlighter size={17} />
          <span>
            {textMode
              ? 'Add Text'
              :annotationMode
                ? annotationMode === 'highlight'
                  ? 'Highlight'
                  : annotationMode === 'underline'
                    ? 'Underline'
                    : annotationMode === 'strikeout'
                      ? 'Strikeout'
                      : 'Note'
              : 'Annotate'}
          </span>
          <ChevronDown size={15} />
        </button>


        {openMenu === 'annotate' && (

          <div className="toolbar-menu">

            <button
              type="button"
              className={
                annotationMode === 'highlight'
                  ? 'selected'
                  : ''
              }
              onClick={() =>
                selectAnnotationMode(
                  'highlight',
                )
              }
              disabled={processing}
            >
              <Highlighter size={16} />
              <span>Highlight</span>

              {annotationMode ===
                'highlight' && (
                <span className="menu-check">
                  ✓
                </span>
              )}

            </button>


            <button
              type="button"
              className={
                annotationMode === 'underline'
                  ? 'selected'
                  : ''
              }
              onClick={() =>
                selectAnnotationMode(
                  'underline',
                )
              }
              disabled={processing}
            >
              <Underline size={16} />
              <span>Underline</span>

              {annotationMode ===
                'underline' && (
                <span className="menu-check">
                  ✓
                </span>
              )}

            </button>


            <button
              type="button"
              className={
                annotationMode === 'strikeout'
                  ? 'selected'
                  : ''
              }
              onClick={() =>
                selectAnnotationMode(
                  'strikeout',
                )
              }
              disabled={processing}
            >
              <Strikethrough size={16} />
              <span>Strikeout</span>

              {annotationMode ===
                'strikeout' && (
                <span className="menu-check">
                  ✓
                </span>
              )}

            </button>


            <button
              type="button"
              className={
                annotationMode === 'note'
                  ? 'selected'
                  : ''
              }
              onClick={() =>
                selectAnnotationMode(
                  'note',
                )
              }
              disabled={processing}
            >
              <StickyNote size={16} />
              <span>Note</span>

              {annotationMode ===
                'note' && (
                <span className="menu-check">
                  ✓
                </span>
              )}

            </button>

            <div className="toolbar-menu-separator" />

            <button
            type="button"
            className={
                textMode
                ? 'selected'
                : ''
            }
            onClick={
                selectTextMode
            }
            disabled={
                processing
            }
            >
            <Type size={16} />
            <span>Add Text</span>

            {textMode && (
                <span className="menu-check">
                ✓
                </span>
            )}

            </button>

          </div>

        )}

      </div>


      <div className="toolbar-separator" />

      {selectedTextElement && (
        <TextToolbar
          fontSize={
            selectedTextElement.fontSize
          }

          onChangeFontSize={(
            fontSize,
            ) => {
            onUpdateTextFontSize(
                selectedTextElement.id,
                fontSize,
            )
            }}

              bold={
                selectedTextElement.bold
            }

            italic={
                selectedTextElement.italic
            }

            underline={
                selectedTextElement.underline
            }

            onToggleBold={
                onToggleBold
            }

            onToggleItalic={
                onToggleItalic
            }

            onToggleUnderline={
                onToggleUnderline
            }

        />
      )}

      {/* =================================================
          VIEW CONTROLS
          ================================================= */}

      <div className="toolbar-group">

        <button
          className="toolbar-icon-button"
          onClick={onZoomOut}
          disabled={!hasPDF}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut size={18} />
        </button>


        <button
          className="toolbar-zoom"
          onClick={onResetZoom}
          disabled={!hasPDF}
          title="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </button>


        <button
          className="toolbar-icon-button"
          onClick={onZoomIn}
          disabled={!hasPDF}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn size={18} />
        </button>

      </div>


      <button
        className="toolbar-icon-button"
        onClick={onRotateView}
        disabled={!hasPDF}
        title="Rotate view"
        aria-label="Rotate view"
      >
        <RotateCw size={18} />
      </button>


      <button
        className="toolbar-icon-button"
        onClick={onResetZoom}
        disabled={!hasPDF}
        title="Fit / reset view"
        aria-label="Fit / reset view"
      >
        <Maximize size={18} />
      </button>


      <div className="toolbar-spacer" />


      {/* =================================================
          PAGE NAVIGATION
          ================================================= */}

      <div className="page-navigation">

        <button
          className="toolbar-icon-button"
          onClick={onPreviousPage}
          disabled={
            !hasPDF ||
            currentPage <= 1
          }
          title="Previous page"
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>


        <span className="page-counter">

          {hasPDF
            ? `${currentPage} / ${numPages}`
            : '0 / 0'}

        </span>


        <button
          className="toolbar-icon-button"
          onClick={onNextPage}
          disabled={
            !hasPDF ||
            currentPage >= numPages
          }
          title="Next page"
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>

      </div>

    </div>

  )
}