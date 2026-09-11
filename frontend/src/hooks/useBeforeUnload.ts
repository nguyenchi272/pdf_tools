import { useEffect } from 'react'

export default function useBeforeUnload(
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) {
      return
    }

    const handleBeforeUnload = (
      event: BeforeUnloadEvent,
    ) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener(
      'beforeunload',
      handleBeforeUnload,
    )

    return () => {
      window.removeEventListener(
        'beforeunload',
        handleBeforeUnload,
      )
    }
  }, [enabled])
}