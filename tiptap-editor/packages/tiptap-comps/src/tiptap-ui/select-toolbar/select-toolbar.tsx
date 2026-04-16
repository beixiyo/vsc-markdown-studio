'use client'

import type { SelectToolbarProps, SelectToolbarRef, SelectToolbarShouldShow } from './types'
import { Popover } from 'comps'
import { forwardRef, memo, useImperativeHandle } from 'react'
import { useTiptapEditor } from 'tiptap-api/react'
import { isNodeTypeSelected, SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'
import { cn } from 'utils'
import { useSelectToolbar } from './hooks/use-select-toolbar'
import { useEvent } from './hooks/useEvent'

/** 默认判断：选中位于 table 祖先链上时不显示（由 TableControls 接管） */
const defaultShouldShow: SelectToolbarShouldShow = ({ editor }) =>
  !isNodeTypeSelected(editor, ['table'], true)

const InnerSelectToolbar = forwardRef<SelectToolbarRef, SelectToolbarProps>((props, ref) => {
  const {
    editor: providedEditor,
    enabled = true,
    children,
    offsetDistance = 8,
    placement = 'top-start',
    className = '',
    shouldShow = defaultShouldShow,
  } = props

  const { editor } = useTiptapEditor(providedEditor)
  const { selectionRect, isInteractingRef, popoverRef } = useSelectToolbar({ editor, enabled, shouldShow })

  useEvent(enabled, popoverRef)
  useImperativeHandle(ref, () => ({
    close: () => {
      popoverRef.current?.close()
    },
  }), [])

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
      exitSetMode
      restoreFocusOnOpen
      position={ (placement?.split('-')[0] as any) || 'top' }
      offset={ offsetDistance }
      virtualReferenceRect={ selectionRect }
      clickOutsideIgnoreSelector={ `[${SELECTION_TOOLBAR_KEEP_OPEN_ATTR}="true"]` }
      content={
        <div
          { ...{ [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true' } }
          className={ cn(
            'bn-toolbar flex items-center gap-1 px-1.5 py-1 max-w-[100vw] bg-background text-text2 rounded-lg shadow-lg z-50',
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

InnerSelectToolbar.displayName = 'InnerSelectToolbar'

export const SelectToolbar = memo(InnerSelectToolbar) as typeof InnerSelectToolbar
