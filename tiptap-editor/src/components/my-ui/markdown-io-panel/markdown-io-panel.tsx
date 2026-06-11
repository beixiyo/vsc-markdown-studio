'use client'

import type { Editor } from '@tiptap/react'
import { Button, Textarea } from 'comps'
import { useLatestCallback } from 'hooks'
import { memo, useState } from 'react'
import { cn } from 'utils'
import { MD_PRESETS, useMarkdownIOPanel } from './use-markdown-io-panel'

/**
 * Markdown 导入导出测试面板
 *
 * 验证图片节点的 markdown 序列化策略：
 * 富属性图片 ⇄ `<img ... />`，纯净图片 ⇄ `![alt](src)`，含 6 轮往返幂等检测
 */
export const MarkdownIOPanel = memo<MarkdownIOPanelProps>(({ editor, className }) => {
  const [open, setOpen] = useState(false)
  const panel = useMarkdownIOPanel(editor)

  const toggleOpen = useLatestCallback(() => setOpen(prev => !prev))

  if (!open) {
    return (
      <Button
        size="sm"
        onClick={ toggleOpen }
        className={ cn('fixed bottom-16 right-4 z-50', className) }
        tooltip="Markdown 导入导出测试（图片富属性）"
        aria-label="打开 Markdown 测试面板"
      >
        MD I/O
      </Button>
    )
  }

  return (
    <aside
      className={ cn(
        'fixed top-16 bottom-4 right-4 z-50 w-96 flex flex-col gap-3 p-4',
        'bg-background border border-border rounded-xl shadow-lg overflow-hidden',
        className,
      ) }
    >
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">Markdown 导入导出</h3>
        <Button size="sm" variant="ghost" onClick={ toggleOpen } aria-label="收起面板">
          ✕
        </Button>
      </header>

      {/* 预置样例 */ }
      <div className="flex gap-2">
        { MD_PRESETS.map(preset => (
          <Button
            key={ preset.key }
            size="sm"
            variant="ghost"
            onClick={ () => panel.fillPreset(preset.key) }
          >
            { preset.label }
          </Button>
        )) }
      </div>

      <Textarea
        className="h-48 flex-1 font-mono text-xs"
        placeholder="输入 markdown，支持 <img ... /> 富属性图片"
        value={ panel.mdText }
        onChange={ panel.setMdText }
      />

      { panel.notice && (
        <p
          className={ cn(
            'text-xs',
            panel.notice.tone === 'ok'
              ? 'text-text2'
              : 'text-systemOrange',
          ) }
        >
          { panel.notice.text }
        </p>
      ) }

      <div className="flex gap-2">
        <Button size="sm" onClick={ panel.importMd } disabled={ !panel.ready || !panel.mdText }>
          导入编辑器
        </Button>
        <Button size="sm" variant="ghost" onClick={ panel.exportMd } disabled={ !panel.ready }>
          从编辑器导出
        </Button>
        <Button size="sm" variant="ghost" onClick={ panel.checkRoundtrip } disabled={ !panel.ready || !panel.mdText }>
          往返检测
        </Button>
      </div>
    </aside>
  )
})

MarkdownIOPanel.displayName = 'MarkdownIOPanel'

export type MarkdownIOPanelProps = {
  /** 编辑器实例 */
  editor: Editor | null
  className?: string
}
