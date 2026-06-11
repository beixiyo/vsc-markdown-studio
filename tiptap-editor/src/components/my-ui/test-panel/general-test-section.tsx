'use client'

import type { Editor } from '@tiptap/react'
import type { OperateTestSuite } from '@/features/operate-tests'
import { Button } from 'comps'
import { useLatestCallback } from 'hooks'
import { memo, useState } from 'react'
import { unSelect } from 'tiptap-api'
import { SectionTestButton } from '../section-test-button'
import { SelectionTestButton } from '../selection-test-button'
import { OperateTestSection } from './operate-test-section'
import { ScrollTestSection } from './scroll-test-section'
import { TestSection } from './test-section'

const MERMAID_MARKDOWN = `\`\`\`mermaid
sequenceDiagram
    Alice->>Bob: Hello Bob!
    Bob-->>Alice: Hello Alice!
    Alice->>Bob: How are you?
    Bob-->>Alice: I'm fine, thanks!
\`\`\``

const TEXT_DIRECTIONS = ['ltr', 'rtl', 'auto'] as const

type TextDirection = typeof TEXT_DIRECTIONS[number]

/**
 * 通用测试区：文档操作、选区获取、滚动 API、批量用例
 */
export const GeneralTestSection = memo<GeneralTestSectionProps>((props) => {
  const {
    editor,
    suites,
    onAiInsert,
    canAiInsert,
  } = props

  const [textDirection, setTextDirection] = useState<TextDirection>('ltr')

  const insertMermaid = useLatestCallback(() => {
    if (!editor)
      return
    editor.commands.setContent(MERMAID_MARKDOWN, { contentType: 'markdown' })
    unSelect(editor)
  })

  const cycleTextDirection = useLatestCallback(() => {
    const nextIndex = (TEXT_DIRECTIONS.indexOf(textDirection) + 1) % TEXT_DIRECTIONS.length
    const next = TEXT_DIRECTIONS[nextIndex]
    setTextDirection(next)
    if (editor) {
      editor.setOptions({ textDirection: next })
    }
    document.documentElement.setAttribute('dir', next === 'auto'
      ? ''
      : next)
  })

  return (
    <div className="flex flex-col gap-4">
      <TestSection title="文档">
        <Button
          size="sm"
          variant="ghost"
          onClick={ insertMermaid }
          disabled={ !editor }
          tooltip="插入 Mermaid 时序图"
        >
          Mermaid 时序图
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={ onAiInsert }
          disabled={ !canAiInsert }
          tooltip="在当前光标位置插入 AI 生成内容（无需选中文本）"
        >
          AI 光标插入
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={ cycleTextDirection }
          tooltip={ `文本方向：${textDirection.toUpperCase()}（点击切换）` }
        >
          Dir:
          {' '}
          { textDirection.toUpperCase() }
        </Button>
      </TestSection>

      <TestSection title="选区">
        <SelectionTestButton editor={ editor } />
        <SectionTestButton editor={ editor } />
      </TestSection>

      <ScrollTestSection editor={ editor } />

      <OperateTestSection editor={ editor } suites={ suites } />
    </div>
  )
})

GeneralTestSection.displayName = 'GeneralTestSection'

export type GeneralTestSectionProps = {
  /** 编辑器实例 */
  editor: Editor | null
  /** 操作测试套件 */
  suites: OperateTestSuite[]
  /** AI 光标插入回调 */
  onAiInsert?: () => void
  /** AI 光标插入是否可用 */
  canAiInsert?: boolean
}
