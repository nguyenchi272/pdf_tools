import {
  useCallback,
  useRef,
  useState,
} from 'react'

import type {
  Annotation,
  AnnotationRect,
  AnnotationType,
} from '../types/annotation'

interface UseAnnotationsOptions {
  onChange?: (
    previous: Annotation[],
    next: Annotation[],
  ) => void
}

export default function useAnnotations({
  onChange,
}: UseAnnotationsOptions = {}) {
  const [
    annotations,
    setAnnotations,
  ] = useState<Annotation[]>([])

  const annotationsRef =
    useRef<Annotation[]>([])

  const commit = useCallback(
    (next: Annotation[]) => {
      const previous =
        annotationsRef.current

      annotationsRef.current =
        next

      setAnnotations(next)

      onChange?.(
        previous,
        next,
      )
    },
    [onChange],
  )

  /*
   * ADD HIGHLIGHT / UNDERLINE /
   * STRIKEOUT
   */
  const addAnnotation =
    useCallback(
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

        commit([
          ...annotationsRef.current,
          annotation,
        ])
      },
      [commit],
    )

  /*
   * ADD NOTE
   */
  const addNote =
    useCallback(
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

        commit([
          ...annotationsRef.current,
          annotation,
        ])
      },
      [commit],
    )

  /*
   * DELETE
   */
  const removeAnnotation =
    useCallback(
      (id: string) => {
        const current =
          annotationsRef.current

        const next =
          current.filter(
            (annotation) =>
              annotation.id !== id,
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
   * LOAD / RESTORE
   *
   * Không tạo history.
   */
  const replaceAnnotations =
    useCallback(
      (
        nextAnnotations: Annotation[],
      ) => {
        annotationsRef.current =
          nextAnnotations

        setAnnotations(
          nextAnnotations,
        )
      },
      [],
    )

  /*
   * CLEAR
   */
  const clearAnnotations =
    useCallback(() => {
      if (
        annotationsRef.current
          .length === 0
      ) {
        return
      }

      commit([])
    }, [commit])

  return {
    annotations,

    addAnnotation,
    addNote,
    removeAnnotation,

    clearAnnotations,
    replaceAnnotations,
  }
}