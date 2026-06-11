'use client'

import type { Editor } from '@tiptap/react'
import { Button, Textarea } from 'comps'
import { memo } from 'react'
import { cn } from 'utils'
import { MD_PRESETS, useMarkdownIOPanel } from './use-markdown-io-panel'

/**
 * Markdown 导入导出测试面板内容
 *
 * 验证图片节点的 markdown 序列化策略：
 * 富属性图片 ⇄ `<img ... />`，纯净图片 ⇄ `![alt](src)`，含 6 轮往返幂等检测
 * 自身不带容器壳，由测试面板（TestPanel）等宿主提供布局
 */
export const MarkdownIOPanel = memo<MarkdownIOPanelProps>(({ editor, className }) => {
  const panel = useMarkdownIOPanel(editor)

  return (
    <div className={ cn('flex flex-col gap-3', className) }>
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
        className="h-48 font-mono text-xs"
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
    </div>
  )
})

MarkdownIOPanel.displayName = 'MarkdownIOPanel'

export type MarkdownIOPanelProps = {
  /** 编辑器实例 */
  editor: Editor | null
  className?: string
}
