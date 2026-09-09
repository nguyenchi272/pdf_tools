export type AnnotationType =
  | 'highlight'
  | 'underline'
  | 'strikeout'
  | 'note'

export interface AnnotationRect {
  x: number
  y: number
  width: number
  height: number
}

export interface Annotation {
  id: string
  page: number
  type: AnnotationType
  rects: AnnotationRect[]

  text?: string
}