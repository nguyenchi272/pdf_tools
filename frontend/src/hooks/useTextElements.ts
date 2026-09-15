import { useCallback, useState } from 'react'
import type { TextElement } from '../types/text'

interface UseTextElementsOptions {
  onChange?: () => void
}

export default function useTextElements({
  onChange,
}: UseTextElementsOptions = {}) {
  const [textElements, setTextElements] =
    useState<TextElement[]>([])

  const addText = useCallback(
    (
      page: number,
      x: number,
      y: number,
      text: string,
    ) => {
      const trimmedText = text.trim()

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

      setTextElements((current) => [
        ...current,
        element,
      ])

      onChange?.()
    },
    [onChange],
  )

  const removeText = useCallback(
    (id: string) => {
      setTextElements((current) => {
        const next = current.filter(
          (element) =>
            element.id !== id,
        )

        if (
          next.length ===
          current.length
        ) {
          return current
        }

        onChange?.()

        return next
      })
    },
    [onChange],
  )

  const updateText = useCallback(
    (
        id: string,
        text: string,
    ) => {
        const trimmedText = text.trim()

        if (!trimmedText) {
        return
        }

        setTextElements((current) => {
        const exists = current.some(
            (element) => element.id === id,
        )

        if (!exists) {
            return current
        }

        onChange?.()

        return current.map((element) =>
            element.id === id
            ? {
                ...element,
                text: trimmedText,
                }
            : element,
        )
        })
    },
    [onChange],
    )

  const moveText = useCallback(
    (
        id: string,
        x: number,
        y: number,
    ) => {
        setTextElements((current) => {
        const exists = current.some(
            (element) =>
            element.id === id,
        )

        if (!exists) {
            return current
        }

        onChange?.()

        return current.map(
            (element) =>
            element.id === id
                ? {
                    ...element,
                    x,
                    y,
                }
                : element,
        )
        })
    },
    [onChange],
    )

  const replaceTextElements =
    useCallback(
      (elements: TextElement[]) => {
        setTextElements(elements)
      },
      [],
    )

  const clearTextElements =
    useCallback(() => {
      setTextElements((current) => {
        if (current.length === 0) {
          return current
        }

        onChange?.()

        return []
      })
    }, [onChange])

  return {
    textElements,
    addText,
    updateText,
    moveText,
    removeText,
    replaceTextElements,
    clearTextElements,
  }
}