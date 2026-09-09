export type AnnotationType =
  | 'highlight'
  | 'underline'
  | 'strikeout'

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
}