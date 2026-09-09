import { useCallback, useState } from 'react'

import type {
  Annotation,
  AnnotationRect,
  AnnotationType,
} from '../types/annotation'


export default function useAnnotations() {
  const [annotations, setAnnotations] =
    useState<Annotation[]>([])


  /*
   * =====================================================
   * ADD SELECTION ANNOTATION
   *
   * Highlight
   * Underline
   * Strikeout
   * =====================================================
   */

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

      setAnnotations((current) => [
        ...current,
        annotation,
      ])
    },
    [],
  )


  /*
   * =====================================================
   * ADD NOTE
   * =====================================================
   */

  const addNote = useCallback(
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

      setAnnotations((current) => [
        ...current,
        annotation,
      ])
    },
    [],
  )


  /*
   * =====================================================
   * REMOVE ONE
   * =====================================================
   */

  const removeAnnotation =
    useCallback((id: string) => {
      setAnnotations((current) =>
        current.filter(
          (annotation) =>
            annotation.id !== id,
        ),
      )
    }, [])


  /*
   * =====================================================
   * CLEAR ALL
   * =====================================================
   */

  const clearAnnotations =
    useCallback(() => {
      setAnnotations([])
    }, [])


  return {
    annotations,

    addAnnotation,
    addNote,

    removeAnnotation,
    clearAnnotations,
  }
}