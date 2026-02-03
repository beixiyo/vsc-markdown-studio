import { RefObject, useEffect } from "react"
import { PopoverRef } from "comps"
import { SELECT_TOOLBAR_EVENTS } from "../constants"

export function useEvent(enabled: boolean, popoverRef: RefObject<PopoverRef | null>) {
  useEffect(() => {
    if (!enabled) {
      return
    }

    const handler = () => {
      popoverRef.current?.close()
    }

    window.addEventListener(SELECT_TOOLBAR_EVENTS.CLOSE, handler)
    return () => {
      window.removeEventListener(SELECT_TOOLBAR_EVENTS.CLOSE, handler)
    }
  }, [enabled])
}
