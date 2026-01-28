'use client'

import type { Editor } from '@tiptap/react'
import { memo, useCallback, useState } from 'react'
import {
  scrollToMark,
  scrollToRange,
  scrollToRangeSelection,
  scrollToText,
  selectAndScrollToText,
} from 'tiptap-api'
import { useTiptapEditor } from 'tiptap-api/react'
import { Button, Card, Input, Popover, type PopoverRef, Separator } from 'comps'
import { ChevronDownIcon, CloseIcon, CornerDownLeftIcon } from 'tiptap-comps/icons'

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

/**
 * 测试下拉菜单组件，用于测试所有滚动功能
 */
export const ScrollTestButton = memo<ScrollTestButtonProps>(
  ({ editor: providedEditor, className, portal: _portal = false }) => {
    const { editor } = useTiptapEditor(providedEditor)
    const popoverRef = useRef<PopoverRef>(null)
    const [testType, setTestType] = useState<
      | 'scrollToRange'
      | 'scrollToRangeSelection'
      | 'scrollToMark'
      | 'selectAndScrollToText'
      | 'scrollToText'
      | null
    >(null)

    /** 输入状态 */
    const [posInput, setPosInput] = useState('')
    const [fromInput, setFromInput] = useState('')
    const [toInput, setToInput] = useState('')
    const [markIdInput, setMarkIdInput] = useState('')
    const [markTypeInput, setMarkTypeInput] = useState('comment')
    const [textInput, setTextInput] = useState('')

    /** 滚动到指定位置 */
    const handleCancel = useCallback(() => {
      setTestType(null)
      setPosInput('')
      setFromInput('')
      setToInput('')
      setMarkIdInput('')
      setMarkTypeInput('comment')
      setTextInput('')
    }, [])

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
        popoverRef.current?.close()
      }
      else {
        alert('滚动失败，请检查位置是否有效')
      }
    }, [editor, posInput, handleCancel])

    /** 滚动到指定范围 */
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
        popoverRef.current?.close()
      }
      else {
        alert('滚动失败，请检查范围是否有效')
      }
    }, [editor, fromInput, toInput, handleCancel])

    /** 滚动到指定 mark */
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
        popoverRef.current?.close()
      }
      else {
        alert('未找到指定的 mark')
      }
    }, [editor, markIdInput, markTypeInput, handleCancel])

    /** 选择并滚动到文本 */
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
        popoverRef.current?.close()
      }
      else {
        alert('未找到指定的文本')
      }
    }, [editor, textInput, handleCancel])

    /** 滚动到文本（不选择） */
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
        popoverRef.current?.close()
      }
      else {
        alert('未找到指定的文本')
      }
    }, [editor, textInput, handleCancel])

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
      popoverRef.current?.close()
    }, [editor])

    /** 快速测试：滚动到文档开头 */
    const handleScrollToStart = useCallback(() => {
      if (!editor)
        return

      scrollToRange(editor, 0, {
        behavior: 'smooth',
        block: 'center',
        setSelection: true,
      })
      popoverRef.current?.close()
    }, [editor])

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          switch (testType) {
            case 'scrollToRange':
              handleScrollToRange()
              break
            case 'scrollToRangeSelection':
              handleScrollToRangeSelection()
              break
            case 'scrollToMark':
              handleScrollToMark()
              break
            case 'selectAndScrollToText':
              handleSelectAndScrollToText()
              break
            case 'scrollToText':
              handleScrollToText()
              break
          }
        }
      },
      [
        testType,
        handleScrollToRange,
        handleScrollToRangeSelection,
        handleScrollToMark,
        handleSelectAndScrollToText,
        handleScrollToText,
      ],
    )

    const renderTestInput = () => {
      if (!testType)
        return null

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

      const renderInputFields = () => {
        switch (testType) {
          case 'scrollToRange':
            return (
              <Input
                type="number"
                placeholder="输入位置（数字）"
                value={ posInput }
                onChange={ v => setPosInput(v) }
                onKeyDown={ handleKeyDown }
                autoFocus
                className="h-9 border-none bg-transparent text-textPrimary"
                containerClassName="w-full border border-border rounded-md px-1 py-0.5 bg-background dark:bg-backgroundSecondary dark:border-borderSecondary"
              />
            )

          case 'scrollToRangeSelection':
            return (
              <div className="flex flex-col gap-2">
                <Input
                  type="number"
                  placeholder="起始位置"
                  value={ fromInput }
                  onChange={ v => setFromInput(v) }
                  onKeyDown={ handleKeyDown }
                  autoFocus
                  className="h-9 border-none bg-transparent text-textPrimary"
                  containerClassName="w-full border border-border rounded-md px-1 py-0.5 bg-background dark:bg-backgroundSecondary dark:border-borderSecondary"
                />
                <Input
                  type="number"
                  placeholder="结束位置"
                  value={ toInput }
                  onChange={ v => setToInput(v) }
                  onKeyDown={ handleKeyDown }
                  className="h-9 border-none bg-transparent text-textPrimary"
                  containerClassName="w-full border border-border rounded-md px-1 py-0.5 bg-background dark:bg-backgroundSecondary dark:border-borderSecondary"
                />
              </div>
            )

          case 'scrollToMark':
            return (
              <div className="flex flex-col gap-2">
                <Input
                  type="text"
                  placeholder="Mark ID"
                  value={ markIdInput }
                  onChange={ v => setMarkIdInput(v) }
                  onKeyDown={ handleKeyDown }
                  autoFocus
                  className="h-9 border-none bg-transparent text-textPrimary"
                  containerClassName="w-full border border-border rounded-md px-1 py-0.5 bg-background dark:bg-backgroundSecondary dark:border-borderSecondary"
                />
                <Input
                  type="text"
                  placeholder="Mark 类型（默认: comment）"
                  value={ markTypeInput }
                  onChange={ v => setMarkTypeInput(v) }
                  onKeyDown={ handleKeyDown }
                  className="h-9 border-none bg-transparent text-textPrimary"
                  containerClassName="w-full border border-border rounded-md px-1 py-0.5 bg-background dark:bg-backgroundSecondary dark:border-borderSecondary"
                />
              </div>
            )

          case 'selectAndScrollToText':
          case 'scrollToText':
            return (
              <Input
                type="text"
                placeholder="输入要搜索的文本"
                value={ textInput }
                onChange={ v => setTextInput(v) }
                onKeyDown={ handleKeyDown }
                autoFocus
                className="h-9 border-none bg-transparent text-textPrimary"
                containerClassName="w-full border border-border rounded-md px-1 py-0.5 bg-background dark:bg-backgroundSecondary dark:border-borderSecondary"
              />
            )

          default:
            return null
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

      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-borderSecondary">
            <span className="text-[0.95rem] font-semibold text-textPrimary">
              { getTestTitle() }
            </span>
            <Button
              type="button"
              onClick={ handleCancel }
              variant="ghost"
              size="sm"
              title="取消"
              className="text-textSecondary"
            >
              <CloseIcon className="size-4" />
            </Button>
          </div>

          { renderInputFields() }

          <div className="flex justify-end gap-2 mt-1">
            <Button
              type="button"
              onClick={ getExecuteHandler() }
              variant="default"
              className="w-full justify-center"
              disabled={
                (testType === 'scrollToRange' && !posInput.trim())
                || (testType === 'scrollToRangeSelection' && (!fromInput.trim() || !toInput.trim()))
                || (testType === 'scrollToMark' && !markIdInput.trim())
                || ((testType === 'selectAndScrollToText' || testType === 'scrollToText') && !textInput.trim())
              }
            >
              <CornerDownLeftIcon className="size-4" />
              执行
            </Button>
          </div>
        </div>
      )
    }

    return (
      <Popover
        ref={ popoverRef }
        trigger="click"
        position="bottom"
        content={
          <Card className="min-w-[12rem] p-1" shadow="md" padding="none">
            <div className="flex flex-col gap-2 p-2">
              { !testType
                ? (
                  /** 主菜单视图 */
                  <div className="flex flex-col gap-1">
                    {/* 快速测试 */ }
                    <Button
                      type="button"
                      onClick={ handleScrollToStart }
                      variant="ghost"
                      className="w-full justify-start px-2"
                      size="sm"
                    >
                      滚动到文档开头
                    </Button>

                    <Button
                      type="button"
                      onClick={ handleScrollToEnd }
                      variant="ghost"
                      className="w-full justify-start px-2"
                      size="sm"
                    >
                      滚动到文档末尾
                    </Button>

                    <Separator />

                    {/* 精确测试 */ }
                    <div className="flex flex-col gap-1 py-0.5">
                      {/* 滚动到指定位置 */ }
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-start px-2"
                        size="sm"
                        onClick={ (e) => {
                          e.preventDefault()
                          setTestType('scrollToRange')
                        } }
                      >
                        滚动到指定位置
                      </Button>

                      {/* 滚动到指定范围 */ }
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-start px-2"
                        size="sm"
                        onClick={ (e) => {
                          e.preventDefault()
                          setTestType('scrollToRangeSelection')
                        } }
                      >
                        滚动到指定范围
                      </Button>

                      {/* 滚动到指定 mark */ }
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-start px-2"
                        size="sm"
                        onClick={ (e) => {
                          e.preventDefault()
                          setTestType('scrollToMark')
                        } }
                      >
                        滚动到指定 Mark
                      </Button>

                      {/* 选择并滚动到文本 */ }
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-start px-2"
                        size="sm"
                        onClick={ (e) => {
                          e.preventDefault()
                          setTestType('selectAndScrollToText')
                        } }
                      >
                        选择并滚动到文本
                      </Button>

                      {/* 滚动到文本（不选择） */ }
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-start px-2"
                        size="sm"
                        onClick={ (e) => {
                          e.preventDefault()
                          setTestType('scrollToText')
                        } }
                      >
                        滚动到文本（不选择）
                      </Button>
                    </div>
                  </div>
                )
                : (
                  /** 输入视图 */
                  <div className="w-full">
                    { renderTestInput() }
                  </div>
                ) }
            </div>
          </Card>
        }
      >
        <Button
          type="button"
          variant="ghost"
          className={ className }
          tooltip="滚动测试"
          aria-label="滚动测试"
          size="sm"
        >
          滚动测试
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </Popover>
    )
  },
)

ScrollTestButton.displayName = 'ScrollTestButton'
