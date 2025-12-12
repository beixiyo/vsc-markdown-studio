import { memo, useCallback } from 'react'
import type { Editor } from '@tiptap/core'
import { scrollToRange } from 'tiptap-api'
import { useMarkdownOutline } from './hooks/use-markdown-outline'

type OutlinePanelProps = {
  editor: Editor | null
}

export const OutlinePanel = memo<OutlinePanelProps>(({ editor }) => {
  const { outline } = useMarkdownOutline(editor)

  const handleJump = useCallback((position: number) => {
    if (!editor) return
    scrollToRange(editor, position, {
      behavior: 'smooth',
      block: 'center',
      setSelection: true,
    })
  }, [editor])

  const renderItems = (items: ReturnType<typeof useMarkdownOutline>['outline'], depth = 0) => {
    return items.map(item => (
      <div key={ item.id } style={ { marginLeft: depth * 12 } }>
        <div
          className="cursor-pointer rounded px-2 py-1 text-sm transition-colors text-[var(--tt-gray-dark-500)] hover:bg-[var(--tt-sidebar-bg-color)]"
          onClick={ () => handleJump(item.position) }
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--tt-gray-dark-400)]">H{ item.level }</span>
            <span className="truncate">{ item.text }</span>
          </div>
        </div>
        { item.children.length > 0 && (
          <div className="mt-1">
            { renderItems(item.children, depth + 1) }
          </div>
        ) }
      </div>
    ))
  }

  if (outline.length === 0) {
    return (
      <div className="w-64 shrink-0 rounded-xl border border-[var(--tt-border-color)] bg-[var(--tt-card-bg-color)]/80 p-3 text-sm shadow-sm text-[var(--tt-gray-dark-400)]">
        暂无标题
      </div>
    )
  }

  return (
    <div className="w-64 shrink-0 rounded-xl border border-[var(--tt-border-color)] bg-[var(--tt-card-bg-color)]/80 p-3 shadow-sm">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--tt-gray-dark-500)]">
        大纲
      </div>
      <div className="max-h-[70vh] overflow-auto pr-1">
        { renderItems(outline) }
      </div>
    </div>
  )
})

OutlinePanel.displayName = 'OutlinePanel'

