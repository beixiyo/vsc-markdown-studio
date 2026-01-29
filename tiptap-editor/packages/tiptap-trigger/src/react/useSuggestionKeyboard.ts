import type { Editor } from '@tiptap/core'
import { useEffect } from 'react'

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
  useEffect(() => {
    if (!editor || !active || itemsCount === 0) {
      return
    }

    let viewDom: HTMLElement | null = null
    try {
      if (!editor.view) {
        return
      }
      viewDom = editor.view.dom
    }
    catch (e) {
      return
    }

    if (!viewDom) {
      return
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        event.stopPropagation()
        setActiveIndex(prev => (prev + 1) % itemsCount)
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        event.stopPropagation()
        setActiveIndex(prev => (prev - 1 + itemsCount) % itemsCount)
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        event.stopPropagation()
        onSelect(activeIndex)
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose()
      }
    }

    viewDom.addEventListener('keydown', handleKeydown, true)

    return () => {
      viewDom?.removeEventListener('keydown', handleKeydown, true)
    }
  }, [editor, active, itemsCount, activeIndex, setActiveIndex, onSelect, onClose])
}
