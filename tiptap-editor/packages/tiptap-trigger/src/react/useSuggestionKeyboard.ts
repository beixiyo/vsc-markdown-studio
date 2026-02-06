import type { Editor } from '@tiptap/core'
import { useShortCutKey } from 'hooks'
import { getEditorElement } from 'tiptap-utils'

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
    ? getEditorElement(editor)
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
    /** 焦点在编辑器 contenteditable 内，必须响应键盘导航 */
    ignoreWhenEditable: false,
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
    ignoreWhenEditable: false,
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
    ignoreWhenEditable: false,
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
    ignoreWhenEditable: false,
  })
}
