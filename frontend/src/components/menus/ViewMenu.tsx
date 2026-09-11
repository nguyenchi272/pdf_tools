import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
} from 'lucide-react'

interface ViewMenuProps {
  hasPDF: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  onRotateView: () => void
  onClose: () => void
}

export default function ViewMenu({
  hasPDF,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onRotateView,
  onClose,
}: ViewMenuProps) {

  return (
    <div className="top-menu-dropdown">

      <button
        onClick={() => {
          onClose()
          onZoomIn()
        }}
        disabled={!hasPDF}
      >
        <ZoomIn size={16} />

        <span>
          Zoom In
        </span>

        <kbd>Ctrl+=</kbd>
      </button>


      <button
        onClick={() => {
          onClose()
          onZoomOut()
        }}
        disabled={!hasPDF}
      >
        <ZoomOut size={16} />

        <span>
          Zoom Out
        </span>

        <kbd>Ctrl+-</kbd>
      </button>


      <button
        onClick={() => {
          onClose()
          onResetZoom()
        }}
        disabled={!hasPDF}
      >
        <Maximize size={16} />

        <span>
          Reset Zoom
        </span>
      </button>


      <div className="top-menu-divider" />


      <button
        onClick={() => {
          onClose()
          onRotateView()
        }}
        disabled={!hasPDF}
      >
        <RotateCw size={16} />

        <span>
          Rotate View
        </span>
      </button>

    </div>
  )
}