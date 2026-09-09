import { useCallback, useState } from 'react'

import type {
  Annotation,
  AnnotationType,
  AnnotationRect,
} from '../types/annotation'


export default function useAnnotations() {

  const [annotations, setAnnotations] =
    useState<Annotation[]>([])


  const addAnnotation = useCallback(
    (
      page: number,
      type: AnnotationType,
      rects: AnnotationRect[],
    ) => {

      if (rects.length === 0) {
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


  const removeAnnotation = useCallback(
    (id: string) => {

      setAnnotations((current) =>
        current.filter(
          (annotation) =>
            annotation.id !== id,
        ),
      )

    },
    [],
  )


  const clearAnnotations = useCallback(() => {

    setAnnotations([])

  }, [])


  return {
    annotations,
    addAnnotation,
    removeAnnotation,
    clearAnnotations,
  }
}