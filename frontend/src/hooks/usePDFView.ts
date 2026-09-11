import { useState } from 'react'

export default function usePDFView() {
  const [zoom, setZoom] =
    useState(1)

  const [rotation, setRotation] =
    useState(0)

  /*
   * Zoom in.
   */
  const zoomIn = () => {
    setZoom((value) =>
      Math.min(
        3,
        Number(
          (value + 0.1).toFixed(2),
        ),
      ),
    )
  }

  /*
   * Zoom out.
   */
  const zoomOut = () => {
    setZoom((value) =>
      Math.max(
        0.5,
        Number(
          (value - 0.1).toFixed(2),
        ),
      ),
    )
  }

  /*
   * Reset zoom.
   */
  const resetZoom = () => {
    setZoom(1)
  }

  /*
   * Viewer-only rotation.
   */
  const rotateView = () => {
    setRotation(
      (value) =>
        (value + 90) % 360,
    )
  }

  return {
    zoom,
    setZoom,

    rotation,
    setRotation,

    zoomIn,
    zoomOut,
    resetZoom,
    rotateView,
  }
}