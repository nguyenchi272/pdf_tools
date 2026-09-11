import { useState } from 'react'

export default function usePDFPages() {
  const [numPages, setNumPages] =
    useState(0)

  const [currentPage, setCurrentPage] =
    useState(1)

  const [selectedPages, setSelectedPages] =
    useState<number[]>([])

  /*
   * Previous page.
   */
  const previousPage = () => {
    setCurrentPage((page) =>
      Math.max(
        1,
        page - 1,
      ),
    )
  }

  /*
   * Next page.
   */
  const nextPage = () => {
    setCurrentPage((page) =>
      Math.min(
        numPages,
        page + 1,
      ),
    )
  }

  /*
   * Reset page state.
   */
  const resetPages = () => {
    setNumPages(0)
    setCurrentPage(1)
    setSelectedPages([])
  }

  return {
    numPages,
    setNumPages,

    currentPage,
    setCurrentPage,

    selectedPages,
    setSelectedPages,

    previousPage,
    nextPage,

    resetPages,
  }
}