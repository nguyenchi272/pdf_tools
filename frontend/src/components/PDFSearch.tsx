import {
  useEffect,
  useRef,
  useState,
} from 'react'

import type {
  PDFSearchMatch,
} from '../hooks/usePDFSearch'


interface PDFSearchProps {
  query: string
  matches: PDFSearchMatch[]
  currentMatchIndex: number
  isSearching: boolean

  onQueryChange: (
    query: string,
  ) => void

  onSearch: (
    query: string,
  ) => void

  onPrevious: () => void
  onNext: () => void
  onClose: () => void
}


export default function PDFSearch({
  query,
  matches,
  currentMatchIndex,
  isSearching,
  onQueryChange,
  onSearch,
  onPrevious,
  onNext,
  onClose,
}: PDFSearchProps) {

  const [
    inputValue,
    setInputValue,
  ] = useState(query)


  const inputRef =
    useRef<HTMLInputElement>(null)


  const hasSearchedRef =
    useRef(false)


  /*
   * =====================================================
   * INITIAL FOCUS
   * =====================================================
   */

  useEffect(() => {

    inputRef.current?.focus()

  }, [])


  /*
   * =====================================================
   * INPUT CHANGE
   * =====================================================
   */

  const handleChange =
    (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {

      const value =
        event.target.value

      setInputValue(value)

      /*
       * New text means the current search result is no
       * longer associated with the input.
       */

      hasSearchedRef.current =
        false

      /*
       * Only update parent state.
       *
       * DO NOT perform search here.
       */

      onQueryChange(value)
    }


  /*
   * =====================================================
   * ENTER
   * =====================================================
   */

  const handleEnter =
    () => {

      const value =
        inputValue.trim()

      if (!value) {
        return
      }


      /*
       * First Enter:
       * perform search.
       */

      if (
        !hasSearchedRef.current
      ) {

        hasSearchedRef.current =
          true

        onSearch(value)

        return
      }


      /*
       * Search already performed:
       *
       * Enter       -> next
       * Shift+Enter -> previous
       */

      onNext()
    }


  /*
   * =====================================================
   * KEYBOARD
   * =====================================================
   */

  const handleKeyDown =
    (
      event: React.KeyboardEvent<HTMLInputElement>,
    ) => {

      if (
        event.key === 'Enter'
      ) {

        event.preventDefault()

        if (
          event.shiftKey &&
          hasSearchedRef.current
        ) {

          onPrevious()

        } else {

          handleEnter()

        }

        return
      }


      if (
        event.key === 'Escape'
      ) {

        event.preventDefault()

        onClose()

      }

    }


  /*
   * =====================================================
   * RESULT LABEL
   * =====================================================
   */

  let resultLabel = ''


  if (
    isSearching
  ) {

    resultLabel =
      'Searching...'

  } else if (
    hasSearchedRef.current &&
    inputValue.trim()
  ) {

    if (
      matches.length > 0
    ) {

      resultLabel =
        `${currentMatchIndex + 1} / ${matches.length}`

    } else {

      resultLabel =
        'No results'

    }

  }


  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <div
      className="pdf-search"
    >

      <input
        ref={inputRef}

        type="text"

        value={inputValue}

        onChange={
          handleChange
        }

        onKeyDown={
          handleKeyDown
        }

        placeholder="Find in document"

        aria-label="Find in document"

        autoComplete="off"
      />


      <span
        className="pdf-search-results"
      >
        {resultLabel}
      </span>


      <button
        type="button"

        className="pdf-search-button"

        onClick={
          onPrevious
        }

        disabled={
          matches.length === 0
        }

        aria-label="Previous match"

        title="Previous match"
      >
        ↑
      </button>


      <button
        type="button"

        className="pdf-search-button"

        onClick={
          onNext
        }

        disabled={
          matches.length === 0
        }

        aria-label="Next match"

        title="Next match"
      >
        ↓
      </button>


      <button
        type="button"

        className="pdf-search-button"

        onClick={
          onClose
        }

        aria-label="Close search"

        title="Close search"
      >
        ×
      </button>

    </div>
  )
}