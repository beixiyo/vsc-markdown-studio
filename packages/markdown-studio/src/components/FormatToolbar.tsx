import { FormattingToolbar, getFormattingToolbarItems } from '@blocknote/react'
import { memo } from 'react'
import {
  MermaidCopyButton,
  MermaidDeleteButton,
  MermaidEditButton,
} from '@/blocknoteExts/blocks/mermaid'

/**
 * 自定义 FormattingToolbar，包含 Mermaid 专用按钮
 */
export const FormatToolbar = memo(() => {
  return (
    <FormattingToolbar>
      {/* 默认的工具栏按钮 */ }
      { getFormattingToolbarItems([]) }

      {/* Mermaid 专用按钮 */ }
      <MermaidEditButton />
      <MermaidCopyButton />
      <MermaidDeleteButton />
    </FormattingToolbar>
  )
})

FormatToolbar.displayName = 'FormattingToolbar'
