import type { Annotation } from '../types/annotation'

const API_BASE = 'http://localhost:8090'

/**
 * Send a PDF to the backend for processing and
 * return the modified PDF as a File.
 */
async function processPDF(
  endpoint: string,
  file: File,
  fields: Record<string, string>,
  outputFilename = 'modified.pdf',
): Promise<File> {
  const formData = new FormData()

  formData.append('file', file)

  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value)
  })

  const response = await fetch(
    `${API_BASE}${endpoint}`,
    {
      method: 'POST',
      body: formData,
    },
  )

  if (!response.ok) {
    let message = 'PDF processing failed.'

    try {
      const data = await response.json()

      if (data?.detail) {
        message = data.detail
      }
    } catch {
      // Response may not contain JSON.
    }

    throw new Error(message)
  }

  /*
   * Use ArrayBuffer instead of response.blob().
   *
   * This has proven more reliable for larger PDF responses
   * in the current local environment.
   */
  const buffer = await response.arrayBuffer()

  if (buffer.byteLength === 0) {
    throw new Error(
      'Backend returned an empty PDF.',
    )
  }

  const blob = new Blob(
    [buffer],
    {
      type: 'application/pdf',
    },
  )

  return new File(
    [blob],
    outputFilename,
    {
      type: 'application/pdf',
    },
  )
}


/**
 * Delete selected pages.
 */
export async function deletePages(
  file: File,
  pages: number[],
): Promise<File> {
  return processPDF(
    '/api/pdf/delete-pages',
    file,
    {
      pages: pages.join(','),
    },
  )
}


/**
 * Rotate selected pages.
 */
export async function rotatePages(
  file: File,
  pages: number[],
  angle: number,
): Promise<File> {
  return processPDF(
    '/api/pdf/rotate-pages',
    file,
    {
      pages: pages.join(','),
      angle: String(angle),
    },
  )
}


/**
 * Duplicate a page.
 */
export async function duplicatePage(
  file: File,
  page: number,
): Promise<File> {
  return processPDF(
    '/api/pdf/duplicate-page',
    file,
    {
      page: String(page),
    },
  )
}


/**
 * Reorder all pages.
 *
 * Example:
 * [3, 1, 2, 4]
 */
export async function reorderPages(
  file: File,
  order: number[],
): Promise<File> {
  return processPDF(
    '/api/pdf/reorder-pages',
    file,
    {
      order: order.join(','),
    },
  )
}


/**
 * Extract selected pages into a new PDF.
 */
export async function extractPages(
  file: File,
  pages: number[],
): Promise<File> {
  return processPDF(
    '/api/pdf/extract-pages',
    file,
    {
      pages: pages.join(','),
    },
    'extracted.pdf',
  )
}

/**
 * Load native annotations from the current PDF.
 */
export async function loadAnnotations(
  pdfUrl: string,
): Promise<Annotation[]> {
  const pdfResponse =
    await fetch(pdfUrl)

  if (!pdfResponse.ok) {
    throw new Error(
      `Failed to read current PDF: ${pdfResponse.status}`,
    )
  }

  const pdfBlob =
    await pdfResponse.blob()

  const formData =
    new FormData()

  formData.append(
    'file',
    pdfBlob,
    'document.pdf',
  )

  const response =
    await fetch(
      `${API_BASE}/api/pdf/annotations`,
      {
        method: 'POST',
        body: formData,
      },
    )

  if (!response.ok) {
    let message =
      `Load annotations failed: ${response.status}`

    try {
      const error =
        await response.json()

      if (error?.detail) {
        message = error.detail
      }
    } catch {
      // Ignore invalid error response.
    }

    throw new Error(message)
  }

  const data =
    await response.json()

  if (!Array.isArray(data)) {
    throw new Error(
      'Backend returned invalid annotation data.',
    )
  }

  return data as Annotation[]
}

export async function saveAnnotations(
  pdfUrl: string,
  annotations: Annotation[],
): Promise<File> {
  const pdfResponse =
    await fetch(pdfUrl)

  if (!pdfResponse.ok) {
    throw new Error(
      `Failed to read current PDF: ${pdfResponse.status}`,
    )
  }

  const pdfBlob =
    await pdfResponse.blob()

  const formData =
    new FormData()

  formData.append(
    'file',
    pdfBlob,
    'document.pdf',
  )

  formData.append(
    'annotations',
    JSON.stringify(
      annotations,
    ),
  )

  const response =
    await fetch(
      `${API_BASE}/api/pdf/save-annotations`,
      {
        method: 'POST',
        body: formData,
      },
    )

  if (!response.ok) {
    let message =
      `Save annotations failed: ${response.status}`

    try {
      const error =
        await response.json()

      if (error?.detail) {
        message = error.detail
      }
    } catch {
      // Ignore invalid error response.
    }

    throw new Error(message)
  }

  const buffer =
    await response.arrayBuffer()

  if (buffer.byteLength === 0) {
    throw new Error(
      'Backend returned an empty PDF.',
    )
  }

  const blob =
    new Blob(
      [buffer],
      {
        type: 'application/pdf',
      },
    )

  return new File(
    [blob],
    'annotated.pdf',
    {
      type: 'application/pdf',
    },
  )
}