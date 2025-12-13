'use client'

import type { Editor } from '@tiptap/react'
import { memo, useCallback } from 'react'
import { useSelection, useTiptapEditor } from 'tiptap-api/react'
import { Button } from 'tiptap-styles/ui'

export interface SelectionTestButtonProps {
  /**
   * 可选的编辑器实例，如果不提供则从上下文获取
   */
  editor?: Editor | null
  /**
   * 自定义类名
   */
  className?: string
}

/**
 * 测试按钮组件，用于测试获取选中文本功能
 */
export const SelectionTestButton = memo<SelectionTestButtonProps>(
  ({ editor: providedEditor, className }) => {
    const { editor } = useTiptapEditor(providedEditor)
    const { getSelection } = useSelection({ editor })
    const handleClick = useCallback(() => {
      const selectedText = getSelection()
      alert(`选中的文本：\n\n${selectedText}\n\n字符数：${selectedText.length}`)
    }, [getSelection])

    return (
      <Button
        onClick={ handleClick }
        className={ className }
        tooltip="获取选中文本（测试功能）"
        aria-label="获取选中文本"
      >
        选中文本
      </Button>
    )
  },
)

SelectionTestButton.displayName = 'SelectionTestButton'
