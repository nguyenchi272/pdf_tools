import {
  useState,
} from 'react'

import {
  deletePages,
  rotatePages,
  duplicatePage,
  reorderPages,
  extractPages,
} from '../api/pdfApi'

interface UsePDFOperationsOptions {
  pdfFile: File | null

  numPages: number
  currentPage: number
  selectedPages: number[]

  setPdfFile: (
    file: File,
  ) => void

  setCurrentPage: (
    page: number,
  ) => void

  setSelectedPages: (
    pages: number[],
  ) => void

  setRotation: (
    rotation: number,
  ) => void,

  onChange: () => void
}

export default function usePDFOperations({
  pdfFile,
  numPages,
  currentPage,
  selectedPages,

  setPdfFile,
  setCurrentPage,
  setSelectedPages,
  setRotation,
  onChange,
}: UsePDFOperationsOptions) {
  const [processing, setProcessing] =
    useState(false)

  /*
   * Delete selected pages.
   */
  const handleDeletePages =
    async () => {
      if (!pdfFile) return

      if (
        selectedPages.length === 0
      ) {
        alert(
          'Select at least one page first.',
        )

        return
      }

      const confirmed =
        window.confirm(
          `Delete ${selectedPages.length} selected page(s)?`,
        )

      if (!confirmed) return

      try {
        setProcessing(true)

        const newFile =
          await deletePages(
            pdfFile,
            selectedPages,
          )

        const deletedCurrentPage =
          selectedPages.includes(
            currentPage,
          )

        const deletedBeforeCurrent =
          selectedPages.filter(
            (page) =>
              page < currentPage,
          ).length

        setPdfFile(newFile)

        setSelectedPages([])

        onChange()

        /*
         * Keep the same logical page
         * visible whenever possible.
         */
        if (deletedCurrentPage) {
          setCurrentPage(
            Math.min(
              currentPage -
                deletedBeforeCurrent,
              Math.max(
                1,
                numPages -
                  selectedPages.length,
              ),
            ),
          )
        } else {
          setCurrentPage(
            Math.max(
              1,
              currentPage -
                deletedBeforeCurrent,
            ),
          )
        }

        setRotation(0)
      } catch (error) {
        console.error(error)

        alert(
          error instanceof Error
            ? error.message
            : 'Failed to delete pages.',
        )
      } finally {
        setProcessing(false)
      }
    }

  /*
   * Rotate selected pages.
   */
  const handleRotatePages =
    async () => {
      if (!pdfFile) return

      if (
        selectedPages.length === 0
      ) {
        alert(
          'Select at least one page first.',
        )

        return
      }

      try {
        setProcessing(true)

        const newFile =
          await rotatePages(
            pdfFile,
            selectedPages,
            90,
          )

        setPdfFile(newFile)

        setSelectedPages([])

        onChange()

        setRotation(0)
      } catch (error) {
        console.error(error)

        alert(
          error instanceof Error
            ? error.message
            : 'Failed to rotate pages.',
        )
      } finally {
        setProcessing(false)
      }
    }

  /*
   * Duplicate selected page.
   */
  const handleDuplicatePage =
    async () => {
      if (!pdfFile) return

      if (
        selectedPages.length !== 1
      ) {
        alert(
          'Select exactly one page to duplicate.',
        )

        return
      }

      try {
        setProcessing(true)

        const selectedPage =
          selectedPages[0]

        const newFile =
          await duplicatePage(
            pdfFile,
            selectedPage,
          )

        setPdfFile(newFile)

        setSelectedPages([])

        onChange()

        setRotation(0)

        /*
         * The duplicated page is inserted
         * immediately after the original.
         */
        setCurrentPage(
          selectedPage + 1 <=
            numPages + 1
            ? selectedPage + 1
            : selectedPage,
        )
      } catch (error) {
        console.error(error)

        alert(
          error instanceof Error
            ? error.message
            : 'Failed to duplicate page.',
        )
      } finally {
        setProcessing(false)
      }
    }

  /*
   * Reorder pages using drag & drop.
   */
  const handleReorder = async (
    draggedPage: number,
    targetPage: number,
  ) => {
    if (!pdfFile) return

    if (
      draggedPage === targetPage
    ) {
      return
    }

    const order =
      Array.from(
        { length: numPages },
        (_, index) => index + 1,
      )

    const draggedIndex =
      order.indexOf(draggedPage)

    if (draggedIndex === -1) {
      return
    }

    order.splice(
      draggedIndex,
      1,
    )

    const targetIndex =
      order.indexOf(targetPage)

    if (targetIndex === -1) {
      return
    }

    order.splice(
      targetIndex,
      0,
      draggedPage,
    )

    const currentIndex =
      order.indexOf(currentPage)

    try {
      setProcessing(true)

      const newFile =
        await reorderPages(
          pdfFile,
          order,
        )

      setPdfFile(newFile)

      setSelectedPages([])

      onChange()

      setRotation(0)

      if (currentIndex !== -1) {
        setCurrentPage(
          currentIndex + 1,
        )
      }
    } catch (error) {
      console.error(error)

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to reorder pages.',
      )
    } finally {
      setProcessing(false)
    }
  }

  /*
   * Extract selected pages.
   */
  const handleExtractPages =
    async () => {
      if (!pdfFile) return

      if (
        selectedPages.length === 0
      ) {
        alert(
          'Select at least one page first.',
        )

        return
      }

      try {
        setProcessing(true)

        const newFile =
          await extractPages(
            pdfFile,
            selectedPages,
          )

        setPdfFile(newFile)

        setCurrentPage(1)

        setSelectedPages([])

        onChange()

        setRotation(0)
      } catch (error) {
        console.error(error)

        alert(
          error instanceof Error
            ? error.message
            : 'Failed to extract pages.',
        )
      } finally {
        setProcessing(false)
      }
    }

  return {
    processing,

    handleDeletePages,
    handleRotatePages,
    handleDuplicatePage,
    handleReorder,
    handleExtractPages,
  }
}