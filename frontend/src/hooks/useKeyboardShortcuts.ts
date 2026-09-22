import { useEffect } from 'react'

interface KeyboardShortcutOptions {
  onNew: () => void
  onOpen: () => void
  onSave: () => void

  onUndo: () => void
  onRedo: () => void

  onZoomIn: () => void
  onZoomOut: () => void

  onCloseMenu: () => void

  onDuplicateText: () => void
  onCopyText: () => void
  onPasteText: () => void

  disabled?: boolean
  hasPDF?: boolean
  hasSelectedText?: boolean
}

export default function useKeyboardShortcuts({
  onNew,
  onOpen,
  onSave,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onCloseMenu,
  onDuplicateText,
  onCopyText,
  onPasteText,
  disabled = false,
  hasPDF = false,
  hasSelectedText = false,
}: KeyboardShortcutOptions) {

  useEffect(() => {

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {

      const target =
        event.target as HTMLElement | null

      const isEditing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable

      if (isEditing) {
        return
      }

      /*
       * Escape
       */
      if (event.key === 'Escape') {
        onCloseMenu()
        return
      }

      const isModifier =
        event.ctrlKey ||
        event.metaKey

      if (!isModifier || disabled) {
        return
      }

      const key =
        event.key.toLowerCase()

    //   Ctrl + N
      if (key === 'n') {
        event.preventDefault()
        onCloseMenu()
        onNew()
        return
      }

      /*
       * Ctrl + O
       */
      if (key === 'o') {
        event.preventDefault()
        onCloseMenu()

        onOpen()

        return
      }

      /*
       * Ctrl + S
       */
      if (key === 's') {
        event.preventDefault()
        onCloseMenu()

        if (hasPDF) {
          onSave()
        }

        return
      }

      /*
       * Ctrl + Z
       */
      if (key === 'z') {
        event.preventDefault()
        onCloseMenu()

        if (event.shiftKey) {
          onRedo()
        } else {
          onUndo()
        }

        return
      }

      /*
       * Ctrl + Y
       */
      if (key === 'y') {
        event.preventDefault()
        onCloseMenu()

        onRedo()

        return
      }

      /*
       * Ctrl + D
       */
      if (key === 'd') {
        event.preventDefault()
        onCloseMenu()

        onDuplicateText()

        return
      }

      /*
       * Ctrl + C
       */
      if (key === 'c') {
        if (hasSelectedText){
          event.preventDefault()
          onCloseMenu()

          onCopyText()
        }
        return
      }

      /*
       * Ctrl + V
       */
      if (key === 'v') {
        event.preventDefault()
        onCloseMenu()

        onPasteText()

        return
      }

      /*
       * Ctrl + =
       */
      if (key === '=') {
        event.preventDefault()

        if (hasPDF) {
          onZoomIn()
        }

        return
      }

      /*
       * Ctrl + -
       */
      if (
        key === '-' ||
        key === '_'
      ) {
        event.preventDefault()

        if (hasPDF) {
          onZoomOut()
        }
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }

  }, [
    onNew,
    onOpen,
    onSave,
    onUndo,
    onRedo,
    onZoomIn,
    onZoomOut,
    onCloseMenu,
    onDuplicateText,
    onCopyText,
    onPasteText,
    disabled,
    hasPDF,
    hasSelectedText,
  ])
}