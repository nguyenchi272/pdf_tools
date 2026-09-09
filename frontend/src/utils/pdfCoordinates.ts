import type {
  AnnotationRect,
} from '../types/annotation'


/*
 * =====================================================
 * CLIENT RECT → PDF PAGE COORDINATE
 * =====================================================
 */

export function clientRectToAnnotationRect(
  rect: DOMRect,
  pageBounds: DOMRect,
  zoom: number,
): AnnotationRect {
  return {
    x:
      (rect.left -
        pageBounds.left) /
      zoom,

    y:
      (rect.top -
        pageBounds.top) /
      zoom,

    width:
      rect.width / zoom,

    height:
      rect.height / zoom,
  }
}


/*
 * =====================================================
 * SCREEN POINT → PDF PAGE COORDINATE
 * =====================================================
 */

export function pointToPDFCoordinates(
  clientX: number,
  clientY: number,
  pageBounds: DOMRect,
  zoom: number,
) {
  return {
    x:
      (clientX -
        pageBounds.left) /
      zoom,

    y:
      (clientY -
        pageBounds.top) /
      zoom,
  }
}