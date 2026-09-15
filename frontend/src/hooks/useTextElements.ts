import {
  useCallback,
  useRef,
  useState,
} from 'react'

import type { TextElement } from '../types/text'

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

  /*
   * Ref luôn chứa state mới nhất.
   * Dùng ref để tránh stale state trong
   * drag và Unified History.
   */
  const elementsRef =
    useRef<TextElement[]>([])

  /*
   * Snapshot trước khi bắt đầu drag.
   */
  const dragStartRef =
    useRef<TextElement[] | null>(
      null,
    )

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

  /*
   * ADD
   */
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

  /*
   * EDIT
   */
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

  /*
   * DELETE
   */
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

  /*
   * DRAG - BEGIN
   */
  const beginMoveText =
    useCallback(() => {
      dragStartRef.current =
        elementsRef.current.map(
          (element) => ({
            ...element,
          }),
        )
    }, [])

  /*
   * DRAG - PREVIEW
   *
   * Không ghi history ở đây.
   */
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

  /*
   * DRAG - END
   *
   * Chỉ ghi đúng 1 history entry.
   */
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

  /*
   * LOAD / RESTORE
   *
   * Không tạo history.
   */
  const replaceTextElements =
    useCallback(
      (elements: TextElement[]) => {
        elementsRef.current =
          elements

        setTextElements(elements)

        dragStartRef.current =
          null
      },
      [],
    )

  /*
   * CLEAR
   */
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

    replaceTextElements,
    clearTextElements,
  }
}