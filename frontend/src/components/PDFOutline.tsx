import type { PDFOutlineItem } from '../hooks/usePDFOutline'

interface PDFOutlineProps {
  outline: PDFOutlineItem[]
  onItemClick: (item: PDFOutlineItem) => void
}

interface PDFOutlineNodeProps {
  item: PDFOutlineItem
  level: number
  onItemClick: (item: PDFOutlineItem) => void
}

function PDFOutlineNode({
  item,
  level,
  onItemClick,
}: PDFOutlineNodeProps) {
  const hasChildren = item.items.length > 0

  const handleClick = () => {
    onItemClick(item)
  }

  return (
    <div className="pdf-outline-node">
      <div
        className="pdf-outline-item"
        style={{
          paddingLeft: `${12 + level * 16}px`,
          fontWeight: item.bold ? 600 : 400,
          fontStyle: item.italic ? 'italic' : 'normal',
        }}
        title={item.title}
        onClick={handleClick}
      >
        {hasChildren && (
          <span className="pdf-outline-expand">
            ▾
          </span>
        )}

        {!hasChildren && (
          <span className="pdf-outline-expand-spacer" />
        )}

        <span className="pdf-outline-title">
          {item.title}
        </span>
      </div>

      {hasChildren && (
        <div className="pdf-outline-children">
          {item.items.map((child, index) => (
            <PDFOutlineNode
              key={`${child.title}-${index}`}
              item={child}
              level={level + 1}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function PDFOutline({
  outline,
  onItemClick,
}: PDFOutlineProps) {
  if (outline.length === 0) {
    return (
      <div className="pdf-outline-empty">
        No bookmarks
      </div>
    )
  }

  return (
    <div className="pdf-outline">
      {outline.map((item, index) => (
        <PDFOutlineNode
          key={`${item.title}-${index}`}
          item={item}
          level={0}
          onItemClick={onItemClick}
        />
      ))}
    </div>
  )
}