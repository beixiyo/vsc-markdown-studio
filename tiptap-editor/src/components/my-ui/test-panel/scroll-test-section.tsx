'use client'

import type { Editor } from '@tiptap/react'
import { Button, Input, Modal } from 'comps'
import { useLatestCallback } from 'hooks'
import { memo, useState } from 'react'
import {
  scrollToMark,
  scrollToRange,
  scrollToRangeSelection,
  scrollToText,
  selectAndScrollToText,
} from 'tiptap-api'
import { useTiptapEditor } from 'tiptap-api/react'
import { TestSection } from './test-section'

const PRECISE_TESTS: { type: PreciseTestType, label: string }[] = [
  { type: 'scrollToRange', label: '指定位置' },
  { type: 'scrollToRangeSelection', label: '指定范围' },
  { type: 'scrollToMark', label: '指定 Mark' },
  { type: 'selectAndScrollToText', label: '选择并滚动到文本' },
  { type: 'scrollToText', label: '滚动到文本' },
]

const TEST_TITLES: Record<PreciseTestType, string> = {
  scrollToRange: '滚动到指定位置',
  scrollToRangeSelection: '滚动到指定范围',
  scrollToMark: '滚动到指定 Mark',
  selectAndScrollToText: '选择并滚动到文本',
  scrollToText: '滚动到文本（不选择）',
}

/**
 * 滚动 API 测试区：快捷滚动直接执行，精确测试弹 Modal 输入参数
 */
export const ScrollTestSection = memo<ScrollTestSectionProps>(({ editor: providedEditor }) => {
  const { editor } = useTiptapEditor(providedEditor)
  const [testType, setTestType] = useState<PreciseTestType | null>(null)

  const [posInput, setPosInput] = useState('')
  const [fromInput, setFromInput] = useState('')
  const [toInput, setToInput] = useState('')
  const [markIdInput, setMarkIdInput] = useState('')
  const [markTypeInput, setMarkTypeInput] = useState('comment')
  const [textInput, setTextInput] = useState('')

  const handleCancel = useLatestCallback(() => {
    setTestType(null)
    setPosInput('')
    setFromInput('')
    setToInput('')
    setMarkIdInput('')
    setMarkTypeInput('comment')
    setTextInput('')
  })

  const handleScrollToStart = useLatestCallback(() => {
    if (!editor)
      return
    scrollToRange(editor, 0, { behavior: 'smooth', block: 'center', setSelection: true })
  })

  const handleScrollToEnd = useLatestCallback(() => {
    if (!editor)
      return
    scrollToRange(editor, editor.state.doc.content.size, { behavior: 'smooth', block: 'center', setSelection: true })
  })

  const handleExecute = useLatestCallback(() => {
    if (!editor || !testType)
      return

    let success = false

    switch (testType) {
      case 'scrollToRange': {
        const pos = Number.parseInt(posInput, 10)
        if (Number.isNaN(pos)) {
          alert('请输入有效的数字位置')
          return
        }
        success = scrollToRange(editor, pos, { behavior: 'smooth', block: 'center', setSelection: true })
        break
      }
      case 'scrollToRangeSelection': {
        const from = Number.parseInt(fromInput, 10)
        const to = Number.parseInt(toInput, 10)
        if (Number.isNaN(from) || Number.isNaN(to)) {
          alert('请输入有效的数字范围')
          return
        }
        success = scrollToRangeSelection(editor, from, to, { behavior: 'smooth', block: 'center', setSelection: true })
        break
      }
      case 'scrollToMark': {
        if (!markIdInput.trim()) {
          alert('请输入 mark ID')
          return
        }
        success = scrollToMark(editor, markIdInput, markTypeInput, { behavior: 'smooth', block: 'center', setSelection: true })
        break
      }
      case 'selectAndScrollToText': {
        if (!textInput.trim()) {
          alert('请输入要搜索的文本')
          return
        }
        success = selectAndScrollToText(editor, textInput, { behavior: 'smooth', block: 'center', setSelection: true })
        break
      }
      case 'scrollToText': {
        if (!textInput.trim()) {
          alert('请输入要搜索的文本')
          return
        }
        success = scrollToText(editor, textInput, { behavior: 'smooth', block: 'center', setSelection: false })
        break
      }
    }

    if (success) {
      handleCancel()
    }
    else {
      alert('执行失败，请检查参数是否有效')
    }
  })

  const handleKeyDown = useLatestCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleExecute()
    }
  })

  return (
    <TestSection title="滚动">
      <Button size="sm" variant="ghost" onClick={ handleScrollToStart } disabled={ !editor }>
        文档开头
      </Button>
      <Button size="sm" variant="ghost" onClick={ handleScrollToEnd } disabled={ !editor }>
        文档末尾
      </Button>

      { PRECISE_TESTS.map(test => (
        <Button
          key={ test.type }
          size="sm"
          variant="ghost"
          onClick={ () => setTestType(test.type) }
          disabled={ !editor }
        >
          { test.label }
        </Button>
      )) }

      <Modal
        isOpen={ !!testType }
        onClose={ handleCancel }
        titleText={ testType
          ? TEST_TITLES[testType]
          : '滚动测试' }
        onOk={ handleExecute }
        width="400px"
        center
      >
        <div className="flex flex-col gap-4 py-2">
          { testType === 'scrollToRange' && (
            <Input
              type="number"
              placeholder="输入位置（数字）"
              value={ posInput }
              onChange={ v => setPosInput(v) }
              onKeyDown={ handleKeyDown }
              autoFocus
              label="位置"
            />
          ) }

          { testType === 'scrollToRangeSelection' && (
            <>
              <Input
                type="number"
                placeholder="起始位置"
                value={ fromInput }
                onChange={ v => setFromInput(v) }
                onKeyDown={ handleKeyDown }
                autoFocus
                label="起始位置"
              />
              <Input
                type="number"
                placeholder="结束位置"
                value={ toInput }
                onChange={ v => setToInput(v) }
                onKeyDown={ handleKeyDown }
                label="结束位置"
              />
            </>
          ) }

          { testType === 'scrollToMark' && (
            <>
              <Input
                type="text"
                placeholder="Mark ID"
                value={ markIdInput }
                onChange={ v => setMarkIdInput(v) }
                onKeyDown={ handleKeyDown }
                autoFocus
                label="Mark ID"
              />
              <Input
                type="text"
                placeholder="Mark 类型（默认: comment）"
                value={ markTypeInput }
                onChange={ v => setMarkTypeInput(v) }
                onKeyDown={ handleKeyDown }
                label="Mark 类型"
              />
            </>
          ) }

          { (testType === 'selectAndScrollToText' || testType === 'scrollToText') && (
            <Input
              type="text"
              placeholder="输入要搜索的文本"
              value={ textInput }
              onChange={ v => setTextInput(v) }
              onKeyDown={ handleKeyDown }
              autoFocus
              label="搜索文本"
            />
          ) }
        </div>
      </Modal>
    </TestSection>
  )
})

ScrollTestSection.displayName = 'ScrollTestSection'

type PreciseTestType =
  | 'scrollToRange'
  | 'scrollToRangeSelection'
  | 'scrollToMark'
  | 'selectAndScrollToText'
  | 'scrollToText'

export type ScrollTestSectionProps = {
  /** 可选的编辑器实例，不提供则从上下文获取 */
  editor?: Editor | null
}
