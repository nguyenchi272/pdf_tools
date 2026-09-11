import {
  ChevronDown,
} from 'lucide-react'

import type {
  AnnotationType,
} from '../../types/annotation'

import FileMenu from './FileMenu'
import EditMenu from './EditMenu'
import ViewMenu from './ViewMenu'
import ToolsMenu from './ToolsMenu'
import HelpMenu from './HelpMenu'

import type {
  TopMenuType,
} from '../../hooks/useTopMenu'

interface TopMenuProps {

  openTopMenu: TopMenuType

  toggleTopMenu: (
    menu: Exclude<TopMenuType, null>,
  ) => void

  closeTopMenu: () => void

  /*
   * File
   */
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onClosePDF: () => void
  hasPDF: boolean
  processing: boolean
  isSaving: boolean

  /*
   * Edit
   */
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean

  /*
   * View
   */
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  onRotateView: () => void

  /*
   * Pages
   */
  selectedPages: number[]
  onDelete: () => void
  onDuplicate: () => void
  onRotate: () => void
  onExtract: () => void

  /*
   * Annotation
   */
  annotationMode:
    | AnnotationType
    | null

  onAnnotationModeChange: (
    mode: AnnotationType | null,
  ) => void
}

const menuItems: {
  key: Exclude<TopMenuType, null>
  label: string
}[] = [
  {
    key: 'file',
    label: 'File',
  },
  {
    key: 'edit',
    label: 'Edit',
  },
  {
    key: 'view',
    label: 'View',
  },
  {
    key: 'tools',
    label: 'Tools',
  },
  {
    key: 'help',
    label: 'Help',
  },
]

export default function TopMenu({
  openTopMenu,
  toggleTopMenu,
  closeTopMenu,

  onNew,
  onOpen,
  onSave,
  onClosePDF,
  hasPDF,
  processing,
  isSaving,

  onUndo,
  onRedo,
  canUndo,
  canRedo,

  onZoomIn,
  onZoomOut,
  onResetZoom,
  onRotateView,

  selectedPages,
  onDelete,
  onDuplicate,
  onRotate,
  onExtract,

  annotationMode,
  onAnnotationModeChange,
}: TopMenuProps) {

  const renderMenu =
    (menu: Exclude<TopMenuType, null>) => {

      switch (menu) {

        case 'file':
          return (
            <FileMenu
              onNew={onNew}
              onOpen={onOpen}
              onSave={onSave}
              onClose={closeTopMenu}
              onClosePDF={onClosePDF}
              hasPDF={hasPDF}
              processing={processing}
              isSaving={isSaving}
            />
          )

        case 'edit':
          return (
            <EditMenu
              onUndo={onUndo}
              onRedo={onRedo}
              canUndo={canUndo}
              canRedo={canRedo}
              processing={processing}
              onClose={closeTopMenu}
            />
          )

        case 'view':
          return (
            <ViewMenu
              hasPDF={hasPDF}
              onZoomIn={onZoomIn}
              onZoomOut={onZoomOut}
              onResetZoom={onResetZoom}
              onRotateView={onRotateView}
              onClose={closeTopMenu}
            />
          )

        case 'tools':
          return (
            <ToolsMenu
              hasPDF={hasPDF}
              processing={processing}
              selectedPages={selectedPages}
              annotationMode={annotationMode}
              onAnnotationModeChange={
                onAnnotationModeChange
              }
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onRotate={onRotate}
              onExtract={onExtract}
              onClose={closeTopMenu}
            />
          )

        case 'help':
          return (
            <HelpMenu
              onClose={closeTopMenu}
            />
          )
      }
    }

  return (
    <nav className="top-menu">

      {menuItems.map((item) => (
        <div
          key={item.key}
          className="top-menu-item"
        >

          <button
            className={
              openTopMenu === item.key
                ? 'top-menu-button active'
                : 'top-menu-button'
            }
            onClick={() =>
              toggleTopMenu(item.key)
            }
          >
            {item.label}

            <ChevronDown size={13} />
          </button>


          {openTopMenu === item.key &&
            renderMenu(item.key)}
        </div>
      ))}

    </nav>
  )
}