'use client'

import type { Editor } from '@tiptap/react'
import type { RegionEditState } from 'tiptap-ai'
import { Button, Textarea } from 'comps'
import { memo } from 'react'
import { cn } from 'utils'
import { useRegionEditPanel } from './use-region-edit-panel'

const STATE_STYLES: Record<RegionEditState, string> = {
  idle: 'bg-background2 text-text2',
  streaming: 'bg-systemBlue/10 text-systemBlue',
  preview: 'bg-systemOrange/10 text-systemOrange',
}

/**
 * 区域编辑（hash 锚点协议）测试面板内容
 *
 * 模拟移动端经 MDBridge 的调用路径：readBlocks → applyOperations / 流式三件套 → accept / reject
 * 自身不带容器壳，由测试面板（TestPanel）等宿主提供布局
 */
export const RegionEditPanel = memo<RegionEditPanelProps>(({ editor, className }) => {
  const panel = useRegionEditPanel(editor)

  return (
    <div className={ cn('flex flex-col gap-3', className) }>
      <header className="flex items-center justify-between">
        <span className={ cn('px-2 py-0.5 text-xs rounded-full', STATE_STYLES[panel.state]) }>
          { panel.state }
        </span>
      </header>

      { panel.notice && (
        <p className="text-xs text-systemOrange">{ panel.notice }</p>
      ) }

      {/* 读取 */ }
      <div className="flex gap-2">
        <Button size="sm" onClick={ panel.readBlocks } disabled={ !panel.ready }>
          读取块列表
        </Button>
        <Button size="sm" variant="ghost" onClick={ panel.fillExample } disabled={ !panel.blocks.length }>
          生成示例操作
        </Button>
      </div>

      {/* 块列表：点选目标 */ }
      <ul className="max-h-56 overflow-auto flex flex-col gap-1">
        { panel.blocks.map(block => (
          <li key={ block.hash }>
            <button
              type="button"
              onClick={ () => panel.setTargetHash(block.hash) }
              className={ cn(
                'w-full text-left px-2 py-1.5 rounded-md border text-xs transition-colors',
                panel.targetHash === block.hash
                  ? 'border-systemOrange bg-systemOrange/10'
                  : 'border-border bg-background2 hover:bg-background2/60',
              ) }
            >
              <span className="font-mono text-text2">
                { block.hash.slice(0, 10) }
                { block.lossy && <em className="ml-1 not-italic text-systemOrange">lossy</em> }
                <span className="ml-1">{ block.type }</span>
              </span>

              <span className="block truncate text-text">
                { block.markdown || '(空块)' }
              </span>
            </button>
          </li>
        )) }
      </ul>

      {/* 流式模拟 */ }
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={ () => panel.simulateStream('replace') }
          disabled={ !panel.targetHash || panel.streaming }
        >
          流式替换
        </Button>
        <Button
          size="sm"
          onClick={ () => panel.simulateStream('insertAfter') }
          disabled={ !panel.targetHash || panel.streaming }
        >
          流式后插
        </Button>
        <Button
          size="sm"
          onClick={ () => panel.simulateStream('append') }
          disabled={ panel.streaming }
        >
          流式追加
        </Button>
      </div>

      {/* operations JSON */ }
      <Textarea
        className="h-32 font-mono text-xs"
        placeholder='[{ "target": "...", "op": "replace", "content": { "format": "markdown", "value": "..." } }]'
        value={ panel.opsJson }
        onChange={ panel.setOpsJson }
      />

      <div className="flex gap-2">
        <Button size="sm" onClick={ () => panel.applyOps(true) } disabled={ !panel.opsJson }>
          预览应用
        </Button>
        <Button size="sm" variant="ghost" onClick={ () => panel.applyOps(false) } disabled={ !panel.opsJson }>
          直接应用
        </Button>
      </div>

      {/* 预览决策 */ }
      { panel.state === 'preview' && (
        <div className="flex gap-2">
          <Button size="sm" onClick={ panel.accept }>采纳</Button>
          <Button size="sm" variant="ghost" onClick={ panel.reject }>放弃</Button>
        </div>
      ) }

      {/* 结果 */ }
      { panel.results && (
        <pre className="max-h-32 overflow-auto p-2 text-xs font-mono bg-background2 rounded-md text-text2">
          { JSON.stringify(panel.results, null, 2) }
        </pre>
      ) }
    </div>
  )
})

RegionEditPanel.displayName = 'RegionEditPanel'

export type RegionEditPanelProps = {
  /** 编辑器实例 */
  editor: Editor | null
  className?: string
}
