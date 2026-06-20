'use client'

import type { Editor } from '@tiptap/react'
import type { OperateTestSuite } from '@/features/operate-tests'
import { Button, Drawer, SafePortal, Tabs } from 'comps'
import { useLatestCallback } from 'hooks'
import { FlaskConical, X } from 'lucide-react'
import { memo, useState } from 'react'
import { cn } from 'utils'
import { BlockSyncPanel } from '../block-sync-panel'
import { MarkdownIOPanel } from '../markdown-io-panel'
import { RegionEditPanel } from '../region-edit-panel'
import { GeneralTestSection } from './general-test-section'
import { ImageTestSection } from './image-test-section'

type TestTab = 'general' | 'image' | 'region' | 'markdown' | 'sync'

/**
 * Playground 测试面板：右侧可收起的抽屉，收纳所有测试功能
 *
 * 无遮罩（overlay=false），打开时仍可与编辑器交互（选区 / 滚动类测试依赖这一点）
 */
export const TestPanel = memo<TestPanelProps>((props) => {
  const {
    editor,
    suites,
    onAiInsert,
    canAiInsert,
    className,
  } = props

  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TestTab>('general')

  const toggleOpen = useLatestCallback(() => setOpen(prev => !prev))

  return (
    <>
      { !open && (
        <Button
          size="sm"
          onClick={ toggleOpen }
          className={ cn('fixed bottom-4 right-20 z-50 gap-1.5', className) }
          tooltip="打开测试面板"
          aria-label="打开测试面板"
        >
          <FlaskConical className="size-3.5" />
          测试面板
        </Button>
      ) }

      <SafePortal>
        <Drawer
          open={ open }
          onClose={ toggleOpen }
          position="right"
          overlay={ false }
          closeButton={ false }
          className="fixed! w-96 max-w-[90vw] flex flex-col border-l border-border"
        >
          <header className="shrink-0 flex items-center justify-between h-12 px-4 border-b border-border">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
              <FlaskConical className="size-4 text-text2" />
              测试面板
            </h3>
            <Button size="sm" variant="ghost" onClick={ toggleOpen } aria-label="收起测试面板">
              <X className="size-4" />
            </Button>
          </header>

          <Tabs
            className="flex-1 min-h-0"
            contentClassName="flex-1 min-h-0 overflow-y-auto"
            tabHeight={ 40 }
            activeKey={ activeTab }
            onChange={ item => setActiveTab(item.value as TestTab) }
            items={ [
              {
                value: 'general',
                label: '通用',
                children: (
                  <GeneralTestSection
                    editor={ editor }
                    suites={ suites }
                    onAiInsert={ onAiInsert }
                    canAiInsert={ canAiInsert }
                  />
                ),
              },
              {
                value: 'image',
                label: '图片',
                children: <ImageTestSection editor={ editor } />,
              },
              {
                value: 'region',
                label: '区域编辑',
                children: <RegionEditPanel editor={ editor } />,
              },
              {
                value: 'markdown',
                label: 'MD I/O',
                children: <MarkdownIOPanel editor={ editor } />,
              },
              {
                value: 'sync',
                label: '块同步',
                children: <BlockSyncPanel editor={ editor } />,
              },
            ].map(item => ({
              ...item,
              // h-full：让每个面板撑满抽屉高度（Tabs 是滑动容器、外层 overflow 被裁剪，
              /** 各面板需自行用 flex + overflow-auto 管理内部滚动） */
              children: <div className="h-full p-4">{ item.children }</div>,
            })) }
          />
        </Drawer>
      </SafePortal>
    </>
  )
})

TestPanel.displayName = 'TestPanel'

export type TestPanelProps = {
  /** 编辑器实例 */
  editor: Editor | null
  /** 操作测试套件 */
  suites: OperateTestSuite[]
  /** AI 光标插入回调 */
  onAiInsert?: () => void
  /** AI 光标插入是否可用 */
  canAiInsert?: boolean
  className?: string
}
