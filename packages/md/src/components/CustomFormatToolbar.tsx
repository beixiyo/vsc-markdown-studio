import { FormattingToolbar, getFormattingToolbarItems } from '@blocknote/react'
import { memo } from 'react'
import {
  MermaidCopyButton,
  MermaidDeleteButton,
  MermaidEditButton,
} from '@/blocknoteExts/mermaid/MermaidToolbarBtns'
import { GradientDropdown } from './GradientDropdown'

/**
 * 自定义 FormattingToolbar，包含 Mermaid 专用按钮
 */
export const CustomFormatToolbar = memo(() => {
  return (
    <FormattingToolbar>
      {/* 默认的工具栏按钮 */ }
      { getFormattingToolbarItems([]) }

      {/* 渐变样式下拉菜单 */ }
      <GradientDropdown />

      {/* Mermaid 专用按钮 */ }
      <MermaidEditButton />
      <MermaidCopyButton />
      <MermaidDeleteButton />
    </FormattingToolbar>
  )
})

CustomFormatToolbar.displayName = 'CustomFormattingToolbar'
