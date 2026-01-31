'use client'

import type { SelectToolbarProps } from './types'
import { Popover } from 'comps'
import { memo } from 'react'
import { useTiptapEditor } from 'tiptap-api/react'
import { SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'
import { cn } from 'utils'
import { useSelectToolbar } from './use-select-toolbar'

export const SelectToolbar = memo<SelectToolbarProps>((props) => {
  const {
    editor: providedEditor,
    enabled = true,
    children,
    offsetDistance = 8,
    placement = 'top-start',
    className = '',
  } = props

  const { editor } = useTiptapEditor(providedEditor)
  const { selectionRect, isInteractingRef, popoverRef } = useSelectToolbar({ editor, enabled })

  /** 如果没有选中或未启用，不显示工具栏 */
  if (!enabled || (!selectionRect && !isInteractingRef.current)) {
    return null
  }

  /** 如果没有 children，不渲染任何内容 */
  if (!children) {
    return null
  }

  return (
    <Popover
      ref={ popoverRef }
      trigger="command"
      followScroll
      position={ (placement?.split('-')[0] as any) || 'top' }
      offset={ offsetDistance }
      virtualReferenceRect={ selectionRect }
      clickOutsideIgnoreSelector={ `[${SELECTION_TOOLBAR_KEEP_OPEN_ATTR}="true"]` }
      content={
        <div
          { ...{ [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true' } }
          className={ cn(
            'bn-toolbar flex items-center gap-1 px-1.5 py-1 max-w-[100vw] bg-background text-textSecondary rounded-lg shadow-lg z-50',
            className,
          ) }
        >
          { children }
        </div>
      }
      contentClassName="p-0"
    >
      <div className="hidden" />
    </Popover>
  )
})

SelectToolbar.displayName = 'SelectToolbar'
