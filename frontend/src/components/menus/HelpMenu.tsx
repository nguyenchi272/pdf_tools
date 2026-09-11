import {
  Keyboard,
  Info,
} from 'lucide-react'

interface HelpMenuProps {
  onClose: () => void
}

export default function HelpMenu({
  onClose,
}: HelpMenuProps) {

  const showShortcuts = () => {
    onClose()

    window.alert(
      [
        'OpenPDF Keyboard Shortcuts',
        '',
        'Ctrl+N    New PDF',
        'Ctrl+O    Open PDF',
        'Ctrl+S    Save PDF',
        'Ctrl+Z    Undo',
        'Ctrl+Y    Redo',
        'Ctrl+=    Zoom In',
        'Ctrl+-    Zoom Out',
      ].join('\n'),
    )
  }

  const showAbout = () => {
    onClose()

    window.alert(
      'OpenPDF\n\nLocal PDF editor.',
    )
  }

  return (
    <div className="top-menu-dropdown">

      <button onClick={showShortcuts}>
        <Keyboard size={16} />

        <span>
          Keyboard Shortcuts
        </span>
      </button>


      <button onClick={showAbout}>
        <Info size={16} />

        <span>
          About OpenPDF
        </span>
      </button>

    </div>
  )
}