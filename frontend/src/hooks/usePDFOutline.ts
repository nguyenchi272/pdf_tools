import { useCallback, useEffect, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'

export interface PDFOutlineItem {
  title: string
  dest: unknown
  url?: string | null
  newWindow?: boolean
  bold?: boolean
  italic?: boolean
  color?: Uint8ClampedArray | null
  pageNumber: number | null
  left: number | null
  top: number | null
  zoom: number | null
  items: PDFOutlineItem[]
}

async function normalizeOutlineItem(
  pdf: PDFDocumentProxy,
  item: any,
): Promise<PDFOutlineItem> {
  let pageNumber: number | null = null
  let left: number | null = null
  let top: number | null = null
  let zoom: number | null = null

  try {
    const explicitDest =
      typeof item.dest === 'string'
        ? await pdf.getDestination(item.dest)
        : item.dest

    if (Array.isArray(explicitDest)) {
      const pageRef = explicitDest[0]

      if (pageRef) {
        const pageIndex = await pdf.getPageIndex(pageRef)
        pageNumber = pageIndex + 1
      }

      const destinationType = explicitDest[1]

      if (destinationType?.name === 'XYZ') {
        left =
          typeof explicitDest[2] === 'number'
            ? explicitDest[2]
            : null

        top =
          typeof explicitDest[3] === 'number'
            ? explicitDest[3]
            : null

        zoom =
          typeof explicitDest[4] === 'number'
            ? explicitDest[4]
            : null
      }
    }
  } catch (error) {
    console.warn(
      'Failed to resolve PDF outline destination:',
      error,
    )
  }

  const children = Array.isArray(item.items)
    ? await Promise.all(
        item.items.map((child: any) =>
          normalizeOutlineItem(pdf, child),
        ),
      )
    : []

  return {
    title: item.title ?? '',
    dest: item.dest ?? null,
    url: item.url ?? null,
    newWindow: item.newWindow ?? false,
    bold: item.bold ?? false,
    italic: item.italic ?? false,
    color: item.color ?? null,

    pageNumber,
    left,
    top,
    zoom,

    items: children,
  }
}

export default function usePDFOutline(
  pdf: PDFDocumentProxy | null,
) {
  const [outline, setOutline] = useState<PDFOutlineItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadOutline = useCallback(async () => {
    if (!pdf) {
      setOutline([])
      return
    }

    setIsLoading(true)

    try {
      const result = await pdf.getOutline()

      const normalizedOutline = await Promise.all(
        (result ?? []).map((item: any) =>
          normalizeOutlineItem(pdf, item),
        ),
      )

      setOutline(normalizedOutline)
    } catch (error) {
      console.error(
        'Failed to load PDF outline:',
        error,
      )

      setOutline([])
    } finally {
      setIsLoading(false)
    }
  }, [pdf])

  useEffect(() => {
    loadOutline()
  }, [loadOutline])

  return {
    outline,
    isLoading,
  }
}