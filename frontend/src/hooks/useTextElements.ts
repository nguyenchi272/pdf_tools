import {
  useCallback,
  useRef,
  useState,
} from 'react'

import type { TextElement } from '../types/text'

export type ResizeHandle =
  | 'nw'
  | 'ne'
  | 'sw'
  | 'se'

interface UseTextElementsOptions {
  onChange?: (
    previous: TextElement[],
    next: TextElement[],
  ) => void
}

export default function useTextElements({
  onChange,
}: UseTextElementsOptions = {}) {
  const [
    textElements,
    setTextElements,
  ] = useState<TextElement[]>([])

  const elementsRef =
    useRef<TextElement[]>([])

  const dragStartRef =
    useRef<TextElement[] | null>(
      null,
    )

  const resizeStartRef =
    useRef<{
      elements: TextElement[]
      id: string
    } | null>(null)

  const commit = useCallback(
    (next: TextElement[]) => {
      const previous =
        elementsRef.current

      elementsRef.current =
        next

      setTextElements(next)

      onChange?.(
        previous,
        next,
      )
    },
    [onChange],
  )

  // --------------------------------------------------
  // ADD
  // --------------------------------------------------

  const addText = useCallback(
    (
      page: number,
      x: number,
      y: number,
      text: string,
    ) => {
      const trimmedText =
        text.trim()

      if (!trimmedText) {
        return
      }

      const element: TextElement = {
        id: crypto.randomUUID(),
        page,
        x,
        y,
        width: 200,
        height: 40,
        text: trimmedText,
        fontSize: 14,
      }

      commit([
        ...elementsRef.current,
        element,
      ])
    },
    [commit],
  )

  // --------------------------------------------------
  // EDIT TEXT
  // --------------------------------------------------

  const updateText = useCallback(
    (
      id: string,
      text: string,
    ) => {
      const trimmedText =
        text.trim()

      if (!trimmedText) {
        return
      }

      const current =
        elementsRef.current

      const exists =
        current.some(
          (element) =>
            element.id === id,
        )

      if (!exists) {
        return
      }

      const next =
        current.map((element) =>
          element.id === id
            ? {
                ...element,
                text: trimmedText,
              }
            : element,
        )

      commit(next)
    },
    [commit],
  )

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  const removeText = useCallback(
    (id: string) => {
      const current =
        elementsRef.current

      const next =
        current.filter(
          (element) =>
            element.id !== id,
        )

      if (
        next.length ===
        current.length
      ) {
        return
      }

      commit(next)
    },
    [commit],
  )

  // --------------------------------------------------
  // DRAG
  // --------------------------------------------------

  const beginMoveText =
    useCallback(() => {
      dragStartRef.current =
        elementsRef.current.map(
          (element) => ({
            ...element,
          }),
        )
    }, [])

  const moveText = useCallback(
    (
      id: string,
      x: number,
      y: number,
    ) => {
      const next =
        elementsRef.current.map(
          (element) =>
            element.id === id
              ? {
                  ...element,
                  x,
                  y,
                }
              : element,
        )

      elementsRef.current =
        next

      setTextElements(next)
    },
    [],
  )

  const endMoveText =
    useCallback(() => {
      const previous =
        dragStartRef.current

      const current =
        elementsRef.current

      dragStartRef.current =
        null

      if (!previous) {
        return
      }

      if (
        JSON.stringify(previous) ===
        JSON.stringify(current)
      ) {
        return
      }

      onChange?.(
        previous,
        current,
      )
    }, [onChange])

  // --------------------------------------------------
  // RESIZE
  // --------------------------------------------------

  const beginResizeText =
    useCallback(
      (id: string) => {
        resizeStartRef.current = {
          id,
          elements:
            elementsRef.current.map(
              (element) => ({
                ...element,
              }),
            ),
        }
      },
      [],
    )

  const resizeText =
    useCallback(
      (
        id: string,
        handle: ResizeHandle,
        deltaX: number,
        deltaY: number,
      ) => {
        const start =
          resizeStartRef.current

        if (!start) {
          return
        }

        const element =
          start.elements.find(
            (item) =>
              item.id === id,
          )

        if (!element) {
          return
        }

        const minWidth = 40
        const minHeight = 20

        let x = element.x
        let y = element.y
        let width = element.width
        let height = element.height

        // ------------------------------------------
        // EAST
        // ------------------------------------------

        if (
          handle === 'ne' ||
          handle === 'se'
        ) {
          width = Math.max(
            minWidth,
            element.width + deltaX,
          )
        }

        // ------------------------------------------
        // WEST
        // ------------------------------------------

        if (
          handle === 'nw' ||
          handle === 'sw'
        ) {
          const newWidth =
            Math.max(
              minWidth,
              element.width -
                deltaX,
            )

          x =
            element.x +
            (
              element.width -
              newWidth
            )

          width = newWidth
        }

        // ------------------------------------------
        // SOUTH
        // ------------------------------------------

        if (
          handle === 'sw' ||
          handle === 'se'
        ) {
          height = Math.max(
            minHeight,
            element.height +
              deltaY,
          )
        }

        // ------------------------------------------
        // NORTH
        // ------------------------------------------

        if (
          handle === 'nw' ||
          handle === 'ne'
        ) {
          const newHeight =
            Math.max(
              minHeight,
              element.height -
                deltaY,
            )

          y =
            element.y +
            (
              element.height -
              newHeight
            )

          height = newHeight
        }

        const next =
          start.elements.map(
            (item) =>
              item.id === id
                ? {
                    ...item,
                    x,
                    y,
                    width,
                    height,
                  }
                : item,
          )

        elementsRef.current =
          next

        setTextElements(next)
      },
      [],
    )

  const endResizeText =
    useCallback(() => {
      const start =
        resizeStartRef.current

      const current =
        elementsRef.current

      resizeStartRef.current =
        null

      if (!start) {
        return
      }

      if (
        JSON.stringify(
          start.elements,
        ) ===
        JSON.stringify(current)
      ) {
        return
      }

      onChange?.(
        start.elements,
        current,
      )
    }, [onChange])

  // --------------------------------------------------
  // REPLACE
  // --------------------------------------------------

  const replaceTextElements =
    useCallback(
      (elements: TextElement[]) => {
        elementsRef.current =
          elements

        setTextElements(
          elements,
        )

        dragStartRef.current =
          null

        resizeStartRef.current =
          null
      },
      [],
    )

  // --------------------------------------------------
  // CLEAR
  // --------------------------------------------------

  const clearTextElements =
    useCallback(() => {
      const current =
        elementsRef.current

      if (current.length === 0) {
        return
      }

      commit([])
    }, [commit])

  return {
    textElements,

    addText,
    updateText,
    removeText,

    beginMoveText,
    moveText,
    endMoveText,

    beginResizeText,
    resizeText,
    endResizeText,

    replaceTextElements,
    clearTextElements,
  }
}