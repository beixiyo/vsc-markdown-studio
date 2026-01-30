import type { Editor } from '@tiptap/core'
import { useShortCutKey } from 'hooks'

function getEditorViewDom(editor: Editor | null | undefined): HTMLElement | null {
  if (!editor)
    return null
  try {
    return editor.view?.dom ?? null
  }
  catch {
    return null
  }
}

interface UseSuggestionKeyboardProps {
  editor: Editor | null | undefined
  active: boolean
  itemsCount: number
  activeIndex: number
  setActiveIndex: (index: number | ((prev: number) => number)) => void
  onSelect: (index: number) => void
  onClose: () => void
}

export function useSuggestionKeyboard({
  editor,
  active,
  itemsCount,
  activeIndex,
  setActiveIndex,
  onSelect,
  onClose,
}: UseSuggestionKeyboardProps) {
  const viewDom = active && itemsCount > 0
    ? getEditorViewDom(editor)
    : null
  const el = viewDom as HTMLElement | null

  useShortCutKey({
    key: 'ArrowDown',
    fn: (e) => {
      e.preventDefault()
      e.stopPropagation()
      setActiveIndex(prev => (prev + 1) % itemsCount)
    },
    el,
    capture: true,
  })

  useShortCutKey({
    key: 'ArrowUp',
    fn: (e) => {
      e.preventDefault()
      e.stopPropagation()
      setActiveIndex(prev => (prev - 1 + itemsCount) % itemsCount)
    },
    el,
    capture: true,
  })

  useShortCutKey({
    key: 'Enter',
    fn: (e) => {
      e.preventDefault()
      e.stopPropagation()
      onSelect(activeIndex)
    },
    el,
    capture: true,
  })

  useShortCutKey({
    key: 'Escape',
    fn: (e) => {
      e.preventDefault()
      e.stopPropagation()
      onClose()
    },
    el,
    capture: true,
  })
}
