'use client'

import type { Editor } from '@tiptap/react'
import { Button, Cascader, type CascaderOption, type CascaderRef, Input, Modal } from 'comps'
import { memo, useCallback, useMemo, useRef, useState } from 'react'
import {
  scrollToMark,
  scrollToRange,
  scrollToRangeSelection,
  scrollToText,
  selectAndScrollToText,
} from 'tiptap-api'
import { useTiptapEditor } from 'tiptap-api/react'
import { ChevronDownIcon } from 'tiptap-comps/icons'

export interface ScrollTestButtonProps {
  /**
   * 可选的编辑器实例，如果不提供则从上下文获取
   */
  editor?: Editor | null
  /**
   * 自定义类名
   */
  className?: string
  /**
   * 是否在 portal 中渲染下拉菜单
   * @default false
   */
  portal?: boolean
}

type TestType =
  | 'scrollToRange'
  | 'scrollToRangeSelection'
  | 'scrollToMark'
  | 'selectAndScrollToText'
  | 'scrollToText'

/**
 * 测试下拉菜单组件，用于测试所有滚动功能
 */
export const ScrollTestButton = memo<ScrollTestButtonProps>(
  ({ editor: providedEditor, className, portal: _portal = false }) => {
    const { editor } = useTiptapEditor(providedEditor)
    const cascaderRef = useRef<CascaderRef>(null)
    const [testType, setTestType] = useState<TestType | null>(null)

    /** 输入状态 */
    const [posInput, setPosInput] = useState('')
    const [fromInput, setFromInput] = useState('')
    const [toInput, setToInput] = useState('')
    const [markIdInput, setMarkIdInput] = useState('')
    const [markTypeInput, setMarkTypeInput] = useState('comment')
    const [textInput, setTextInput] = useState('')

    const handleCancel = useCallback(() => {
      setTestType(null)
      setPosInput('')
      setFromInput('')
      setToInput('')
      setMarkIdInput('')
      setMarkTypeInput('comment')
      setTextInput('')
    }, [])

    /** 快速测试：滚动到文档开头 */
    const handleScrollToStart = useCallback(() => {
      if (!editor)
        return

      scrollToRange(editor, 0, {
        behavior: 'smooth',
        block: 'center',
        setSelection: true,
      })
    }, [editor])

    /** 快速测试：滚动到文档末尾 */
    const handleScrollToEnd = useCallback(() => {
      if (!editor)
        return

      const docSize = editor.state.doc.content.size
      scrollToRange(editor, docSize, {
        behavior: 'smooth',
        block: 'center',
        setSelection: true,
      })
    }, [editor])

    const handleScrollToRange = useCallback(() => {
      if (!editor)
        return

      const pos = Number.parseInt(posInput, 10)
      if (Number.isNaN(pos)) {
        alert('请输入有效的数字位置')
        return
      }

      const success = scrollToRange(editor, pos, {
        behavior: 'smooth',
        block: 'center',
        setSelection: true,
      })

      if (success) {
        handleCancel()
      }
      else {
        alert('滚动失败，请检查位置是否有效')
      }
    }, [editor, posInput, handleCancel])

    const handleScrollToRangeSelection = useCallback(() => {
      if (!editor)
        return

      const from = Number.parseInt(fromInput, 10)
      const to = Number.parseInt(toInput, 10)
      if (Number.isNaN(from) || Number.isNaN(to)) {
        alert('请输入有效的数字范围')
        return
      }

      const success = scrollToRangeSelection(editor, from, to, {
        behavior: 'smooth',
        block: 'center',
        setSelection: true,
      })

      if (success) {
        handleCancel()
      }
      else {
        alert('滚动失败，请检查范围是否有效')
      }
    }, [editor, fromInput, toInput, handleCancel])

    const handleScrollToMark = useCallback(() => {
      if (!editor)
        return

      if (!markIdInput.trim()) {
        alert('请输入 mark ID')
        return
      }

      const success = scrollToMark(editor, markIdInput, markTypeInput, {
        behavior: 'smooth',
        block: 'center',
        setSelection: true,
      })

      if (success) {
        handleCancel()
      }
      else {
        alert('未找到指定的 mark')
      }
    }, [editor, markIdInput, markTypeInput, handleCancel])

    const handleSelectAndScrollToText = useCallback(() => {
      if (!editor)
        return

      if (!textInput.trim()) {
        alert('请输入要搜索的文本')
        return
      }

      const success = selectAndScrollToText(editor, textInput, {
        behavior: 'smooth',
        block: 'center',
        setSelection: true,
      })

      if (success) {
        handleCancel()
      }
      else {
        alert('未找到指定的文本')
      }
    }, [editor, textInput, handleCancel])

    const handleScrollToText = useCallback(() => {
      if (!editor)
        return

      if (!textInput.trim()) {
        alert('请输入要搜索的文本')
        return
      }

      const success = scrollToText(editor, textInput, {
        behavior: 'smooth',
        block: 'center',
        setSelection: false,
      })

      if (success) {
        handleCancel()
      }
      else {
        alert('未找到指定的文本')
      }
    }, [editor, textInput, handleCancel])

    const handleValueChange = useCallback((value: string) => {
      switch (value) {
        case 'start':
          handleScrollToStart()
          break
        case 'end':
          handleScrollToEnd()
          break
        default:
          setTestType(value as TestType)
          break
      }
    }, [handleScrollToStart, handleScrollToEnd])

    const options = useMemo<CascaderOption[]>(() => [
      { value: 'start', label: '滚动到文档开头' },
      { value: 'end', label: '滚动到文档末尾' },
      {
        value: 'precise',
        label: '精确测试',
        children: [
          { value: 'scrollToRange', label: '滚动到指定位置' },
          { value: 'scrollToRangeSelection', label: '滚动到指定范围' },
          { value: 'scrollToMark', label: '滚动到指定 Mark' },
          { value: 'selectAndScrollToText', label: '选择并滚动到文本' },
          { value: 'scrollToText', label: '滚动到文本（不选择）' },
        ],
      },
    ], [])

    const getTestTitle = () => {
      switch (testType) {
        case 'scrollToRange':
          return '滚动到指定位置'
        case 'scrollToRangeSelection':
          return '滚动到指定范围'
        case 'scrollToMark':
          return '滚动到指定 Mark'
        case 'selectAndScrollToText':
          return '选择并滚动到文本'
        case 'scrollToText':
          return '滚动到文本（不选择）'
        default:
          return '滚动测试'
      }
    }

    const getExecuteHandler = () => {
      switch (testType) {
        case 'scrollToRange':
          return handleScrollToRange
        case 'scrollToRangeSelection':
          return handleScrollToRangeSelection
        case 'scrollToMark':
          return handleScrollToMark
        case 'selectAndScrollToText':
          return handleSelectAndScrollToText
        case 'scrollToText':
          return handleScrollToText
        default:
          return () => { }
      }
    }

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          getExecuteHandler()()
        }
      },
      [getExecuteHandler],
    )

    return (
      <>
        <Cascader
          ref={ cascaderRef }
          options={ options }
          onChange={ handleValueChange }
          placement="bottom-start"
          dropdownHeight={ 400 }
          optionClassName="px-2 py-1.5 text-sm"
          trigger={
            <Button
              type="button"
              variant="ghost"
              className={ className }
              tooltip="滚动测试"
              aria-label="滚动测试"
              size="sm"
            >
              滚动测试
              <ChevronDownIcon className="size-4 text-icon" />
            </Button>
          }
        />

        <Modal
          isOpen={ !!testType }
          onClose={ handleCancel }
          titleText={ getTestTitle() }
          onOk={ getExecuteHandler() }
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
      </>
    )
  },
)

ScrollTestButton.displayName = 'ScrollTestButton'
