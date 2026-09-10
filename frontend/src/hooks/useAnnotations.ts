import { useCallback, useState } from 'react'
import type {
  Annotation,
  AnnotationRect,
  AnnotationType,
} from '../types/annotation'

interface AnnotationHistory {
  past: Annotation[][]
  present: Annotation[]
  future: Annotation[][]
}

export default function useAnnotations() {
  const [history, setHistory] =
    useState<AnnotationHistory>({
      past: [],
      present: [],
      future: [],
    })

  const annotations = history.present

  const updateAnnotations = useCallback(
    (nextAnnotations: Annotation[]) => {
      setHistory((current) => ({
        past: [
          ...current.past,
          current.present,
        ],
        present: nextAnnotations,
        future: [],
      }))
    },
    [],
  )

  const replaceAnnotations = useCallback(
    (nextAnnotations: Annotation[]) => {
        setHistory({
        past: [],
        present: nextAnnotations,
        future: [],
        })
    },
    [],
  )

  const addAnnotation = useCallback(
    (
      page: number,
      type: AnnotationType,
      rects: AnnotationRect[],
    ) => {
      if (
        rects.length === 0 ||
        type === 'note'
      ) {
        return
      }

      const annotation: Annotation = {
        id: crypto.randomUUID(),
        page,
        type,
        rects,
      }

      updateAnnotations([
        ...annotations,
        annotation,
      ])
    },
    [annotations, updateAnnotations],
  )

  const addNote = useCallback(
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

      const annotation: Annotation = {
        id: crypto.randomUUID(),
        page,
        type: 'note',
        rects: [
          {
            x,
            y,
            width: 24,
            height: 24,
          },
        ],
        text: trimmedText,
      }

      updateAnnotations([
        ...annotations,
        annotation,
      ])
    },
    [annotations, updateAnnotations],
  )

  const removeAnnotation = useCallback(
    (id: string) => {
      const nextAnnotations =
        annotations.filter(
          (annotation) =>
            annotation.id !== id,
        )

      if (
        nextAnnotations.length ===
        annotations.length
      ) {
        return
      }

      updateAnnotations(
        nextAnnotations,
      )
    },
    [annotations, updateAnnotations],
  )

  const undo = useCallback(() => {
    setHistory((current) => {
      if (current.past.length === 0) {
        return current
      }

      const previous =
        current.past[
          current.past.length - 1
        ]

      return {
        past: current.past.slice(
          0,
          -1,
        ),

        present: previous,

        future: [
          current.present,
          ...current.future,
        ],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory((current) => {
      if (current.future.length === 0) {
        return current
      }

      const next =
        current.future[0]

      return {
        past: [
          ...current.past,
          current.present,
        ],

        present: next,

        future:
          current.future.slice(1),
      }
    })
  }, [])

  const canUndo =
    history.past.length > 0

  const canRedo =
    history.future.length > 0

  const clearAnnotations =
    useCallback(() => {
      if (annotations.length === 0) {
        return
      }

      updateAnnotations([])
    }, [
      annotations,
      updateAnnotations,
    ])

  return {
    annotations,

    addAnnotation,
    addNote,
    removeAnnotation,
    clearAnnotations,
    replaceAnnotations,

    undo,
    redo,
    canUndo,
    canRedo,
  }
}