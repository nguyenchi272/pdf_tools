import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import * as pdfjsLib from 'pdfjs-dist'

import pdfWorker from
  'pdfjs-dist/build/pdf.worker.min.mjs?url'

import 'pdfjs-dist/web/pdf_viewer.css'

import type {
  Annotation,
  AnnotationRect,
  AnnotationType,
} from '../types/annotation'

import PDFPage from './pdf/PDFPage'
import { loadAnnotations } from '../api/pdfApi'
import type { TextElement } from '../types/text'
import type { ResizeHandle } from '../hooks/useTextElements'
import PDFSearch from './PDFSearch'

import usePDFSearch from '../hooks/usePDFSearch'

pdfjsLib.GlobalWorkerOptions.workerSrc =
  pdfWorker


interface PDFViewerProps {
  pdfUrl: string

  zoom: number

  rotation: number

  currentPage: number

  annotations: Annotation[]

  annotationMode:
    | AnnotationType
    | null

  textMode: boolean

  textElements: TextElement[]

  selectedTextId:
    string | null

  onSelectText: (
    id: string | null,
  ) => void

  onAddText: (
    page: number,
    x: number,
    y: number,
    text: string,
  ) => void

  onUpdateText: (
    id: string,
    text: string,
  ) => void

  onUpdateTextFontSize: (
    id: string,
    fontSize: number,
  ) => void

  onRemoveText: (
    id: string,
  ) => void

  onMoveText: (
    id: string,
    x: number,
    y: number,
  ) => void

  onBeginMoveText: () => void
  onEndMoveText: () => void
  
  onBeginResizeText: (
    id: string,
  ) => void

  onResizeText: (
    id: string,
    handle: ResizeHandle,
    deltaX: number,
    deltaY: number,
  ) => void

  onEndResizeText: () => void

  onAddAnnotation: (
    page: number,
    type: AnnotationType,
    rects: AnnotationRect[],
  ) => void

  onAddNote: (
    page: number,
    x: number,
    y: number,
    text: string,
  ) => void

  onRemoveAnnotation: (
    id: string,
  ) => void

  onLoadAnnotations: (
    annotations: Annotation[],
  ) => void

  onNumPages: (
    pages: number,
  ) => void

  onPageChange: (
    page: number,
  ) => void

  onSetPastePosition: (
    page: number,
    x: number,
    y: number,
  ) => void
}

/*
 * =====================================================
 * SEARCH TEXT LAYER
 * =====================================================
 *
 * Finds the Nth occurrence of the query inside the
 * native PDF.js text layer and returns its DOM rects.
 *
 * We use DOM Range instead of PDF coordinates so the
 * highlight automatically follows zoom and rotation.
 */

function findSearchMatchInTextLayer(
  textLayer: HTMLElement,
  query: string,
  occurrenceIndex: number,
): Range | null {

  const normalizedQuery =
    query
      .trim()
      .replace(/\s+/g, ' ')
      .toLocaleLowerCase()


  if (!normalizedQuery) {
    return null
  }


  const walker =
    document.createTreeWalker(
      textLayer,
      NodeFilter.SHOW_TEXT,
    )


  const textNodes: Text[] = []

  let node =
    walker.nextNode()


  while (node) {

    if (
      node instanceof Text &&
      node.textContent
    ) {
      textNodes.push(node)
    }

    node =
      walker.nextNode()
  }


  if (
    textNodes.length === 0
  ) {
    return null
  }


  /*
   * Build a normalized text string while keeping
   * references to the original DOM text nodes.
   */

  let combinedText = ''

  const positions:
    Array<{
      node: Text
      offset: number
    }> = []


  for (
    const textNode
    of textNodes
  ) {

    const value =
      textNode.textContent ?? ''


    for (
      let index = 0;
      index < value.length;
      index++
    ) {

      combinedText +=
        value[index]

      positions.push({
        node: textNode,
        offset: index,
      })
    }
  }


  const normalizedText =
    combinedText
      .replace(/\s+/g, ' ')
      .toLocaleLowerCase()


  /*
   * Find requested occurrence.
   */

  let searchStart = 0
  let foundCount = 0


  while (true) {

    const matchIndex =
      normalizedText.indexOf(
        normalizedQuery,
        searchStart,
      )


    if (
      matchIndex === -1
    ) {
      return null
    }


    if (
      foundCount ===
      occurrenceIndex
    ) {

      /*
       * Because whitespace may have been collapsed,
       * map the normalized indexes back to the original
       * DOM text indexes.
       */

      const originalIndexes:
        number[] = []

      let previousWasWhitespace =
        false


      for (
        let index = 0;
        index < combinedText.length;
        index++
      ) {

        const character =
          combinedText[index]

        const isWhitespace =
          /\s/.test(
            character,
          )


        if (
          isWhitespace
        ) {

          if (
            previousWasWhitespace
          ) {
            continue
          }

          previousWasWhitespace =
            true

        } else {

          previousWasWhitespace =
            false
        }


        originalIndexes.push(
          index,
        )
      }


      const originalStart =
        originalIndexes[
          matchIndex
        ]


      const originalEnd =
        originalIndexes[
          matchIndex +
            normalizedQuery.length -
            1
        ]


      if (
        originalStart === undefined ||
        originalEnd === undefined
      ) {
        return null
      }


      const startPosition =
        positions[
          originalStart
        ]


      const endPosition =
        positions[
          originalEnd
        ]


      if (
        !startPosition ||
        !endPosition
      ) {
        return null
      }


      const range =
        document.createRange()


      range.setStart(
        startPosition.node,
        startPosition.offset,
      )


      range.setEnd(
        endPosition.node,
        endPosition.offset + 1,
      )


      return range
    }


    foundCount++


    searchStart =
      matchIndex +
      Math.max(
        normalizedQuery.length,
        1,
      )
  }
}

export default function PDFViewer({
  pdfUrl,

  zoom,
  rotation,

  currentPage,

  annotations,
  annotationMode,

  textMode,
  textElements,
  selectedTextId,
  onSelectText,

  onAddAnnotation,
  onAddNote,
  onRemoveAnnotation,

  onBeginResizeText,
  onResizeText,
  onEndResizeText,

  onLoadAnnotations,

  onAddText,
  onUpdateText,
  onUpdateTextFontSize,
  onRemoveText,
  onMoveText,
  onBeginMoveText,
  onEndMoveText,

  onNumPages,
  onPageChange,
  onSetPastePosition,
}: PDFViewerProps) {
  const containerRef =
    useRef<HTMLDivElement>(
      null,
    )

  const searchHighlightRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const pageRefs =
    useRef<
      Map<
        number,
        HTMLDivElement
      >
    >(new Map())


  const [
    pdf,
    setPdf,
  ] =
    useState<
      pdfjsLib.PDFDocumentProxy | null
    >(null)

  /*
  * =====================================================
  * PDF SEARCH
  * =====================================================
  */

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false)

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('')

  const [
    currentMatchIndex,
    setCurrentMatchIndex,
  ] = useState(0)


  const {
    search,
    clearSearch,
    matches,
    isSearching,
  } =
    usePDFSearch(pdf)

  /*
  * =====================================================
  * SEARCH QUERY
  * =====================================================
  */

  const handleSearchQueryChange =
    useCallback(
      (
        query: string,
      ) => {

        setSearchQuery(
          query,
        )

        setCurrentMatchIndex(
          0,
        )

        if (!query.trim()) {

          clearSearch()

        }

      },
      [
        clearSearch,
      ],
    )

  const handleSearch =
    useCallback(
      async (
        query: string,
      ) => {

        setSearchQuery(
          query,
        )

        setCurrentMatchIndex(
          0,
        )

        await search(
          query,
        )

      },
      [
        search,
      ],
    )
  /*
  * =====================================================
  * SEARCH NAVIGATION
  * =====================================================
  */

  const handlePreviousMatch =
    useCallback(() => {

      if (
        matches.length === 0
      ) {
        return
      }

      setCurrentMatchIndex(
        (current) =>
          current <= 0
            ? matches.length - 1
            : current - 1,
      )

    }, [
      matches.length,
    ])


  const handleNextMatch =
    useCallback(() => {

      if (
        matches.length === 0
      ) {
        return
      }

      setCurrentMatchIndex(
        (current) =>
          current >= matches.length - 1
            ? 0
            : current + 1,
      )

    }, [
      matches.length,
    ])

  /*
  * =====================================================
  * HIGHLIGHT CURRENT SEARCH MATCH
  * =====================================================
  */

  useEffect(() => {

    /*
    * Remove previous highlight.
    */

    const previous =
      searchHighlightRef.current


    if (previous) {

      previous.remove()

      searchHighlightRef.current =
        null
    }


    /*
    * Nothing to highlight.
    */

    if (
      !searchOpen ||
      !searchQuery.trim() ||
      matches.length === 0
    ) {
      return
    }


    const match =
      matches[
        currentMatchIndex
      ]


    if (!match) {
      return
    }


    const page =
      pageRefs.current.get(
        match.pageNumber,
      )


    if (!page) {
      return
    }


    /*
    * The page may still be rendering its PDF.js
    * text layer.
    */
    const highlightMatch =
      () => {

        const textLayer =
          page.querySelector(
            '.textLayer',
          ) as HTMLElement | null


        if (!textLayer) {
          return false
        }


        /*
        * Search occurrence index inside this page.
        *
        * PDFSearch returns matches in document order,
        * therefore only matches from the same page that
        * appear before the current match are counted.
        */

        const pageOccurrenceIndex =
          matches
            .slice(
              0,
              currentMatchIndex,
            )
            .filter(
              (item) =>
                item.pageNumber ===
                match.pageNumber,
            )
            .length


        const range =
          findSearchMatchInTextLayer(
            textLayer,
            searchQuery,
            pageOccurrenceIndex,
          )


        if (!range) {
          return false
        }


        const pageContainer =
          page.querySelector(
            '.pdf-page-container',
          ) as HTMLElement | null


        if (!pageContainer) {
          return false
        }


        /*
        * Create temporary search highlight.
        *
        * This is UI-only and is NOT saved into PDF.
        */

        const highlight =
          document.createElement(
            'div',
          )


        highlight.className =
          'pdf-search-highlight'


        const pageBounds =
          pageContainer.getBoundingClientRect()


        const rects =
          Array.from(
            range.getClientRects(),
          )


        for (
          const rect
          of rects
        ) {

          const item =
            document.createElement(
              'div',
            )


          item.className =
            'pdf-search-highlight-rect'


          item.style.left =
            `${rect.left - pageBounds.left}px`


          item.style.top =
            `${rect.top - pageBounds.top}px`


          item.style.width =
            `${rect.width}px`


          item.style.height =
            `${rect.height}px`


          highlight.appendChild(
            item,
          )
        }


        pageContainer.appendChild(
          highlight,
        )


        searchHighlightRef.current =
          highlight


        /*
        * Scroll the matched page into view.
        */

        page.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })


        /*
        * Remove native browser selection.
        */

        window
          .getSelection()
          ?.removeAllRanges()


        return true
      }


    /*
    * Try immediately.
    */

    if (
      highlightMatch()
    ) {
      return
    }


    /*
    * PDF.js may still be rendering the text layer.
    * Retry once shortly afterwards.
    */

    const timer =
      window.setTimeout(
        () => {

          highlightMatch()

        },
        150,
      )


    return () => {

      window.clearTimeout(
        timer,
      )

    }

  }, [
    searchOpen,
    searchQuery,
    matches,
    currentMatchIndex,
  ])


  /*
  * =====================================================
  * CLOSE SEARCH
  * =====================================================
  */

  const handleCloseSearch =
    useCallback(() => {

      setSearchOpen(
        false,
      )

      setSearchQuery(
        '',
      )

      setCurrentMatchIndex(
        0,
      )

      clearSearch()

    }, [
      clearSearch,
    ])

  /*
   * =====================================================
   * LOAD PDF
   * =====================================================
   */

  useEffect(() => {
    if (!pdfUrl) {
      setPdf(null)
      return
    }


    let cancelled = false


    const loadingTask =
      pdfjsLib.getDocument({
        url: pdfUrl,
      })


    loadingTask.promise
      .then((document) => {
        if (cancelled) {
          return
        }


        setPdf(document)

        onNumPages(
          document.numPages,
        )
      })

      .catch((error) => {
        if (!cancelled) {
          console.error(
            'Failed to load PDF:',
            error,
          )
        }
      })


    return () => {
      cancelled = true

      loadingTask.destroy()
    }
  }, [
    pdfUrl,
    onNumPages,
  ])


  /*
  * =====================================================
  * LOAD NATIVE PDF ANNOTATIONS
  * =====================================================
  *
  * The backend reads annotations directly from
  * the current PDF using PyMuPDF.
  *
  * Every time pdfUrl changes, reload annotations.
  */

  useEffect(() => {

    if (!pdfUrl) {
      onLoadAnnotations([])
      return
    }

    let cancelled = false

    /*
    * Clear previous document annotations immediately.
    *
    * This prevents annotations from the previous PDF
    * from being displayed while the new PDF is loading.
    */
    onLoadAnnotations([])

    const fetchAnnotations = async () => {

      try {

        const loadedAnnotations =
          await loadAnnotations(
            pdfUrl,
          )

        if (cancelled) {
          return
        }

        onLoadAnnotations(
          loadedAnnotations,
        )

      } catch (error) {

        if (cancelled) {
          return
        }

        console.error(
          'Failed to load PDF annotations:',
          error,
        )

      }

    }

    fetchAnnotations()

    return () => {
      cancelled = true
    }

  }, [
    pdfUrl,
    onLoadAnnotations,
  ])

  /*
  * =====================================================
  * SEARCH KEYBOARD SHORTCUT
  * =====================================================
  */

  useEffect(() => {

    const handleKeyDown =
      (
        event: KeyboardEvent,
      ) => {

        const target =
          event.target as HTMLElement | null


        const isEditing =
          target?.tagName === 'INPUT' ||
          target?.tagName === 'TEXTAREA' ||
          target?.isContentEditable


        /*
        * Ctrl + F / Cmd + F
        */

        if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === 'f'
        ) {

          event.preventDefault()

          setSearchOpen(
            true,
          )

          return
        }


        /*
        * Escape closes search.
        */

        if (
          event.key === 'Escape' &&
          searchOpen &&
          !isEditing
        ) {

          event.preventDefault()

          handleCloseSearch()

        }

      }


    document.addEventListener(
      'keydown',
      handleKeyDown,
    )


    return () => {

      document.removeEventListener(
        'keydown',
        handleKeyDown,
      )

    }

  }, [
    searchOpen,
    handleCloseSearch,
  ])

  useEffect(() => {

    if (!searchOpen) {
      return
    }

    setCurrentMatchIndex(
      0,
    )

  }, [
    searchOpen,
  ])

  /*
   * =====================================================
   * REGISTER PAGE REF
   * =====================================================
   */

  const registerPageRef =
    (
      pageNumber: number,
      element:
        HTMLDivElement | null,
    ) => {
      if (element) {
        pageRefs.current.set(
          pageNumber,
          element,
        )
      } else {
        pageRefs.current.delete(
          pageNumber,
        )
      }
    }


  /*
   * =====================================================
   * TRACK VISIBLE PAGE
   * =====================================================
   */

  useEffect(() => {
    const container =
      containerRef.current


    if (!container || !pdf) {
      return
    }


    const elements =
      Array.from(
        pageRefs.current.values(),
      )


    if (
      elements.length === 0
    ) {
      return
    }


    const observer =
      new IntersectionObserver(
        (entries) => {
          const visible =
            entries
              .filter(
                (entry) =>
                  entry.isIntersecting,
              )

              .sort(
                (a, b) =>
                  b.intersectionRatio -
                  a.intersectionRatio,
              )


          if (
            visible.length === 0
          ) {
            return
          }


          const element =
            visible[0]
              .target as HTMLElement


          const page =
            Number(
              element.dataset.page,
            )


          if (page) {
            onPageChange(
              page,
            )
          }
        },

        {
          root:
            container,

          threshold: [
            0.25,
            0.5,
            0.75,
          ],
        },
      )


    elements.forEach(
      (element) => {
        observer.observe(
          element,
        )
      },
    )


    return () => {
      observer.disconnect()
    }
  }, [
    pdf,
    onPageChange,
  ])


  /*
   * =====================================================
   * NAVIGATE TO CURRENT PAGE
   * =====================================================
   */

  useEffect(() => {
    const page =
      pageRefs.current.get(
        currentPage,
      )


    if (!page) {
      return
    }


    page.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [
    currentPage,
  ])


  /*
   * =====================================================
   * EMPTY VIEWER
   * =====================================================
   */

  if (!pdf) {
    return (
      <div
        ref={containerRef}
        className="pdf-viewer"
      />
    )
  }


  /*
   * =====================================================
   * PDF VIEWER
   * =====================================================
   */

  return (
    <div
      className="pdf-viewer-container"
    >

      {searchOpen && (
        <PDFSearch
          query={
            searchQuery
          }

          matches={
            matches
          }

          currentMatchIndex={
            currentMatchIndex
          }

          isSearching={
            isSearching
          }

          onQueryChange={
            handleSearchQueryChange
          }

          onPrevious={
            handlePreviousMatch
          }

          onNext={
            handleNextMatch
          }

          onClose={
            handleCloseSearch
          }

          onSearch={
            handleSearch
          }
        />
      )}


      <div
        ref={containerRef}
        className="pdf-viewer"
      >

        {Array.from(
          {
            length:
              pdf.numPages,
          },

          (_, index) => {

            const pageNumber =
              index + 1

            return (
              <PDFPage
                key={
                  pageNumber
                }

                pdf={
                  pdf
                }

                pageNumber={
                  pageNumber
                }

                zoom={
                  zoom
                }

                rotation={
                  rotation
                }

                annotations={
                  annotations
                }

                annotationMode={
                  annotationMode
                }

                textMode={
                  textMode
                }

                textElements={
                  textElements
                }

                selectedTextId={
                  selectedTextId
                }

                onSelectText={
                  onSelectText
                }

                onAddAnnotation={
                  onAddAnnotation
                }

                onAddNote={
                  onAddNote
                }

                onRemoveAnnotation={
                  onRemoveAnnotation
                }

                onAddText={
                  onAddText
                }

                onUpdateText={
                  onUpdateText
                }

                onUpdateTextFontSize={
                  onUpdateTextFontSize
                }

                onRemoveText={
                  onRemoveText
                }

                onMoveText={
                  onMoveText
                }

                onBeginMoveText={
                  onBeginMoveText
                }

                onEndMoveText={
                  onEndMoveText
                }

                onBeginResizeText={
                  onBeginResizeText
                }

                onResizeText={
                  onResizeText
                }

                onEndResizeText={
                  onEndResizeText
                }

                onPageRef={
                  registerPageRef
                }

                onSetPastePosition={
                  onSetPastePosition
                }
              />
            )
          },
        )}

      </div>

    </div>
  )
}