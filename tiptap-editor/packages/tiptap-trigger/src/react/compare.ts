import type { SuggestionState } from '../types'

export function isSameRect(prev: DOMRect | null, next: DOMRect | null) {
  if (prev === next) {
    return true
  }
  if (!prev || !next) {
    return false
  }
  return (
    prev.top === next.top &&
    prev.left === next.left &&
    prev.right === next.right &&
    prev.bottom === next.bottom &&
    prev.width === next.width &&
    prev.height === next.height
  )
}

export function isSameState(prev: SuggestionState, next: SuggestionState) {
  return prev.active === next.active &&
    prev.triggerId === next.triggerId &&
    prev.triggerCharacter === next.triggerCharacter &&
    prev.query === next.query &&
    prev.queryStartPos === next.queryStartPos &&
    isSameRect(prev.referenceRect, next.referenceRect) &&
    prev.ignoreQueryLength === next.ignoreQueryLength &&
    prev.decorationId === next.decorationId &&
    prev.deleteTriggerCharacter === next.deleteTriggerCharacter
}