import { useCallback, useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'

export interface PDFSearchMatch {
  pageNumber: number
  start: number
  end: number
  text: string
}

interface PageText {
  pageNumber: number
  text: string
}

export default function usePDFSearch(pdf: PDFDocumentProxy | null) {
  const [matches, setMatches] = useState<PDFSearchMatch[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const pageTextsRef = useRef<PageText[]>([])
  const loadedPdfRef = useRef<PDFDocumentProxy | null>(null)

  /**
   * Load text content from every page.
   *
   * This is intentionally kept separate from search so that
   * repeated searches do not need to reload the PDF text.
   */
  const loadText = useCallback(async () => {
    if (!pdf) {
      pageTextsRef.current = []
      loadedPdfRef.current = null
      return
    }

    if (loadedPdfRef.current === pdf && pageTextsRef.current.length > 0) {
      return
    }

    setIsSearching(true)

    try {
      const pages: PageText[] = []

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber)
        const textContent = await page.getTextContent()

        const text = textContent.items
          .map((item) => {
            if ('str' in item) {
              return item.str
            }

            return ''
          })
          .join(' ')

        pages.push({
          pageNumber,
          text,
        })
      }

      pageTextsRef.current = pages
      loadedPdfRef.current = pdf
    } finally {
      setIsSearching(false)
    }
  }, [pdf])

  /**
   * Search the entire PDF.
   *
   * Case-insensitive.
   */
  const search = useCallback(
    async (query: string) => {
      const normalizedQuery = query.trim()

      if (!normalizedQuery) {
        setMatches([])
        return []
      }

      await loadText()

      setIsSearching(true)

      try {
        const searchQuery = normalizedQuery.toLocaleLowerCase()
        const results: PDFSearchMatch[] = []

        for (const page of pageTextsRef.current) {
          const pageTextLower = page.text.toLocaleLowerCase()

          let startIndex = 0

          while (true) {
            const index = pageTextLower.indexOf(searchQuery, startIndex)

            if (index === -1) {
              break
            }

            results.push({
              pageNumber: page.pageNumber,
              start: index,
              end: index + normalizedQuery.length,
              text: page.text.slice(
                index,
                index + normalizedQuery.length,
              ),
            })

            startIndex = index + Math.max(searchQuery.length, 1)
          }
        }

        setMatches(results)

        return results
      } finally {
        setIsSearching(false)
      }
    },
    [loadText],
  )

  const clearSearch = useCallback(() => {
    setMatches([])
  }, [])

  /**
   * Clear cached page text when the PDF changes.
   */
  useEffect(() => {
    pageTextsRef.current = []
    loadedPdfRef.current = null
    setMatches([])
  }, [pdf])

  return {
    search,
    clearSearch,
    matches,
    isSearching,
  }
}