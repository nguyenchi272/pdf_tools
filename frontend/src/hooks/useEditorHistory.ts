import { useCallback, useState } from 'react'
import type { Annotation } from '../types/annotation'
import type { TextElement } from '../types/text'

export interface EditorSnapshot {
  annotations: Annotation[]
  textElements: TextElement[]
}

interface HistoryState {
  past: EditorSnapshot[]
  present: EditorSnapshot
  future: EditorSnapshot[]
}

const initialState: HistoryState = {
  past: [],
  present: {
    annotations: [],
    textElements: [],
  },
  future: [],
}

function cloneSnapshot(
  snapshot: EditorSnapshot,
): EditorSnapshot {
  return {
    annotations: snapshot.annotations.map(
      (annotation) => ({
        ...annotation,
        rects: annotation.rects.map(
          (rect) => ({
            ...rect,
          }),
        ),
      }),
    ),
    textElements: snapshot.textElements.map(
      (element) => ({
        ...element,
      }),
    ),
  }
}

function isSameSnapshot(
  a: EditorSnapshot,
  b: EditorSnapshot,
): boolean {
  return (
    JSON.stringify(a) ===
    JSON.stringify(b)
  )
}

export default function useEditorHistory() {
  const [history, setHistory] =
    useState<HistoryState>(
      initialState,
    )

  const record = useCallback(
    (
      previous: EditorSnapshot,
      next: EditorSnapshot,
    ) => {
      if (
        isSameSnapshot(
          previous,
          next,
        )
      ) {
        return
      }

      const previousSnapshot =
        cloneSnapshot(previous)

      const nextSnapshot =
        cloneSnapshot(next)

      setHistory((current) => ({
        past: [
          ...current.past,
          previousSnapshot,
        ],
        present: nextSnapshot,
        future: [],
      }))
    },
    [],
  )

  const undo = useCallback(() => {
    setHistory((current) => {
      if (
        current.past.length === 0
      ) {
        return current
      }

      const previous =
        current.past[
          current.past.length - 1
        ]

      return {
        past:
          current.past.slice(0, -1),

        present:
          cloneSnapshot(previous),

        future: [
          cloneSnapshot(
            current.present,
          ),
          ...current.future,
        ],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory((current) => {
      if (
        current.future.length === 0
      ) {
        return current
      }

      const next =
        current.future[0]

      return {
        past: [
          ...current.past,
          cloneSnapshot(
            current.present,
          ),
        ],

        present:
          cloneSnapshot(next),

        future:
          current.future.slice(1),
      }
    })
  }, [])

  const reset = useCallback(
    (snapshot: EditorSnapshot) => {
      setHistory({
        past: [],
        present:
          cloneSnapshot(snapshot),
        future: [],
      })
    },
    [],
  )

  return {
    history,
    record,
    undo,
    redo,
    reset,

    canUndo:
      history.past.length > 0,

    canRedo:
      history.future.length > 0,
  }
}