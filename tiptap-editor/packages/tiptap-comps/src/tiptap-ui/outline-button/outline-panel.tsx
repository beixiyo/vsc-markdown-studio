import type { Editor } from '@tiptap/core'
import { memo, useCallback } from 'react'
import { scrollToRange } from 'tiptap-api'
import { useMarkdownOutline } from 'tiptap-api/react'

export type OutlinePanelProps = {
  editor: Editor | null
}

export const OutlinePanel = memo<OutlinePanelProps>(({ editor }) => {
  const { outline } = useMarkdownOutline(editor)

  const handleJump = useCallback((position: number) => {
    if (!editor)
      return
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
          className="cursor-pointer rounded px-2 py-1 text-sm transition-colors text-textSecondary hover:bg-backgroundSecondary"
          onClick={ () => handleJump(item.position) }
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-textTertiary">
              H
              { item.level }
            </span>
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
      <div className="w-64 shrink-0 rounded-xl border border-border bg-background p-3 text-sm shadow-sm text-textDisabled">
        暂无标题
      </div>
    )
  }

  return (
    <div className="w-56 shrink-0 rounded-xl border border-border bg-background p-2 shadow-sm">
      <div className="max-h-[70vh] overflow-auto pr-1">
        { renderItems(outline) }
      </div>
    </div>
  )
})

OutlinePanel.displayName = 'OutlinePanel'
