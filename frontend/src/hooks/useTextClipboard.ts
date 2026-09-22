import {
  useCallback,
  useRef,
} from 'react'

import type { TextElement } from '../types/text'

export default function useTextClipboard() {
  const clipboardRef =
    useRef<TextElement | null>(null)

  const copyText = useCallback(
    async (
      element: TextElement | null,
    ) => {
      if (!element) {
        return
      }

      clipboardRef.current = {
        ...element,
      }

      try {
        await navigator.clipboard.writeText(
          element.text,
        )
      } catch (error) {
        console.warn(
          'Unable to write to system clipboard:',
          error,
        )
      }
    },
    [],
  )

  const getCopiedText =
    useCallback(async () => {
      let systemText: string | null =
        null

      try {
        systemText =
          await navigator.clipboard.readText()
      } catch (error) {
        console.warn(
          'Unable to read system clipboard:',
          error,
        )
      }

      const internal =
        clipboardRef.current

      if (!internal) {
        return {
          element: null,
          text: systemText,
        }
      }

      if (
        systemText !== null &&
        systemText === internal.text
      ) {
        return {
          element: {
            ...internal,
          },
          text: systemText,
        }
      }

      return {
        element: null,
        text: systemText,
      }
    }, [])

  return {
    copyText,
    getCopiedText,
  }
}