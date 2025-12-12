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
import { useTiptapEditor } from 'tiptap-react-hook'
import { ChevronDownIcon, CloseIcon, CornerDownLeftIcon } from 'tiptap-styles/icons'
import { Button, Card, CardBody, CardItemGroup, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Input, InputGroup, Separator } from 'tiptap-styles/ui'

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
  ({ editor: providedEditor, className, portal = false }) => {
    const { editor } = useTiptapEditor(providedEditor)
    const [isOpen, setIsOpen] = useState(false)
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
      setIsOpen(false)
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
      setIsOpen(false)
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
              <InputGroup
                className="w-full border border-[color:var(--tt-border-color)] rounded-md px-1 py-0.5 bg-[color:var(--tt-gray-light-a-50)] dark:bg-[color:var(--tt-gray-dark-a-50)] dark:border-[color:var(--tt-border-color-tint)]"
              >
                <Input
                  type="number"
                  placeholder="输入位置（数字）"
                  value={ posInput }
                  onChange={ e => setPosInput(e.target.value) }
                  onKeyDown={ handleKeyDown }
                  autoFocus
                  className="h-9 border-none bg-transparent text-[var(--tt-gray-light-800)] dark:text-[var(--tt-gray-dark-a-800)]"
                />
              </InputGroup>
            )

          case 'scrollToRangeSelection':
            return (
              <div className="flex flex-col gap-2">
                <InputGroup
                  className="w-full border border-[color:var(--tt-border-color)] rounded-md px-1 py-0.5 bg-[color:var(--tt-gray-light-a-50)] dark:bg-[color:var(--tt-gray-dark-a-50)] dark:border-[color:var(--tt-border-color-tint)]"
                >
                  <Input
                    type="number"
                    placeholder="起始位置"
                    value={ fromInput }
                    onChange={ e => setFromInput(e.target.value) }
                    onKeyDown={ handleKeyDown }
                    autoFocus
                    className="h-9 border-none bg-transparent text-[var(--tt-gray-light-800)] dark:text-[var(--tt-gray-dark-a-800)]"
                  />
                </InputGroup>
                <InputGroup
                  className="w-full border border-[color:var(--tt-border-color)] rounded-md px-1 py-0.5 bg-[color:var(--tt-gray-light-a-50)] dark:bg-[color:var(--tt-gray-dark-a-50)] dark:border-[color:var(--tt-border-color-tint)]"
                >
                  <Input
                    type="number"
                    placeholder="结束位置"
                    value={ toInput }
                    onChange={ e => setToInput(e.target.value) }
                    onKeyDown={ handleKeyDown }
                    className="h-9 border-none bg-transparent text-[var(--tt-gray-light-800)] dark:text-[var(--tt-gray-dark-a-800)]"
                  />
                </InputGroup>
              </div>
            )

          case 'scrollToMark':
            return (
              <div className="flex flex-col gap-2">
                <InputGroup
                  className="w-full border border-[color:var(--tt-border-color)] rounded-md px-1 py-0.5 bg-[color:var(--tt-gray-light-a-50)] dark:bg-[color:var(--tt-gray-dark-a-50)] dark:border-[color:var(--tt-border-color-tint)]"
                >
                  <Input
                    type="text"
                    placeholder="Mark ID"
                    value={ markIdInput }
                    onChange={ e => setMarkIdInput(e.target.value) }
                    onKeyDown={ handleKeyDown }
                    autoFocus
                    className="h-9 border-none bg-transparent text-[var(--tt-gray-light-800)] dark:text-[var(--tt-gray-dark-a-800)]"
                  />
                </InputGroup>
                <InputGroup
                  className="w-full border border-[color:var(--tt-border-color)] rounded-md px-1 py-0.5 bg-[color:var(--tt-gray-light-a-50)] dark:bg-[color:var(--tt-gray-dark-a-50)] dark:border-[color:var(--tt-border-color-tint)]"
                >
                  <Input
                    type="text"
                    placeholder="Mark 类型（默认: comment）"
                    value={ markTypeInput }
                    onChange={ e => setMarkTypeInput(e.target.value) }
                    onKeyDown={ handleKeyDown }
                    className="h-9 border-none bg-transparent text-[var(--tt-gray-light-800)] dark:text-[var(--tt-gray-dark-a-800)]"
                  />
                </InputGroup>
              </div>
            )

          case 'selectAndScrollToText':
          case 'scrollToText':
            return (
              <InputGroup
                className="w-full border border-[color:var(--tt-border-color)] rounded-md px-1 py-0.5 bg-[color:var(--tt-gray-light-a-50)] dark:bg-[color:var(--tt-gray-dark-a-50)] dark:border-[color:var(--tt-border-color-tint)]"
              >
                <Input
                  type="text"
                  placeholder="输入要搜索的文本"
                  value={ textInput }
                  onChange={ e => setTextInput(e.target.value) }
                  onKeyDown={ handleKeyDown }
                  autoFocus
                  className="h-9 border-none bg-transparent text-[var(--tt-gray-light-800)] dark:text-[var(--tt-gray-dark-a-800)]"
                />
              </InputGroup>
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
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-[color:var(--tt-border-color-tint)]">
            <span className="text-[0.95rem] font-semibold text-[var(--tt-gray-light-800)] dark:text-[var(--tt-gray-dark-a-800)]">
              { getTestTitle() }
            </span>
            <Button
              type="button"
              onClick={ handleCancel }
              data-style="ghost"
              data-size="small"
              title="取消"
              className="text-[var(--tt-gray-light-600)] dark:text-[var(--tt-gray-dark-a-600)]"
            >
              <CloseIcon className="tiptap-button-icon" />
            </Button>
          </div>

          { renderInputFields() }

          <div className="flex justify-end gap-2 mt-1">
            <Button
              type="button"
              onClick={ getExecuteHandler() }
              data-style="default"
              className="w-full justify-center"
              disabled={
                (testType === 'scrollToRange' && !posInput.trim())
                || (testType === 'scrollToRangeSelection' && (!fromInput.trim() || !toInput.trim()))
                || (testType === 'scrollToMark' && !markIdInput.trim())
                || ((testType === 'selectAndScrollToText' || testType === 'scrollToText') && !textInput.trim())
              }
            >
              <CornerDownLeftIcon className="tiptap-button-icon" />
              执行
            </Button>
          </div>
        </div>
      )
    }

    return (
      <DropdownMenu open={ isOpen } onOpenChange={ setIsOpen }>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            data-style="ghost"
            className={ className }
            tooltip="滚动测试"
            aria-label="滚动测试"
          >
            滚动测试
            <ChevronDownIcon className="tiptap-button-dropdown-small" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" portal={ portal }>
          <Card className="w-full">
            <CardBody className="flex flex-col gap-2 p-2">
              { !testType
                ? (
                  /** 主菜单视图 */
                    <CardItemGroup orientation="vertical" className="gap-1">
                      {/* 快速测试 */ }
                      <DropdownMenuItem asChild className="w-full">
                        <Button
                          type="button"
                          onClick={ handleScrollToStart }
                          data-style="ghost"
                          className="w-full justify-start px-2"
                        >
                          滚动到文档开头
                        </Button>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild className="w-full">
                        <Button
                          type="button"
                          onClick={ handleScrollToEnd }
                          data-style="ghost"
                          className="w-full justify-start px-2"
                        >
                          滚动到文档末尾
                        </Button>
                      </DropdownMenuItem>

                      <Separator />

                      {/* 精确测试 */ }
                      <div className="flex flex-col gap-1 py-0.5">
                        {/* 滚动到指定位置 */ }
                        <DropdownMenuItem asChild className="w-full">
                          <Button
                            type="button"
                            data-style="ghost"
                            className="w-full justify-start px-2"
                            onClick={ (e) => {
                              e.preventDefault()
                              setTestType('scrollToRange')
                            } }
                          >
                            滚动到指定位置
                          </Button>
                        </DropdownMenuItem>

                        {/* 滚动到指定范围 */ }
                        <DropdownMenuItem asChild className="w-full">
                          <Button
                            type="button"
                            data-style="ghost"
                            className="w-full justify-start px-2"
                            onClick={ (e) => {
                              e.preventDefault()
                              setTestType('scrollToRangeSelection')
                            } }
                          >
                            滚动到指定范围
                          </Button>
                        </DropdownMenuItem>

                        {/* 滚动到指定 mark */ }
                        <DropdownMenuItem asChild className="w-full">
                          <Button
                            type="button"
                            data-style="ghost"
                            className="w-full justify-start px-2"
                            onClick={ (e) => {
                              e.preventDefault()
                              setTestType('scrollToMark')
                            } }
                          >
                            滚动到指定 Mark
                          </Button>
                        </DropdownMenuItem>

                        {/* 选择并滚动到文本 */ }
                        <DropdownMenuItem asChild className="w-full">
                          <Button
                            type="button"
                            data-style="ghost"
                            className="w-full justify-start px-2"
                            onClick={ (e) => {
                              e.preventDefault()
                              setTestType('selectAndScrollToText')
                            } }
                          >
                            选择并滚动到文本
                          </Button>
                        </DropdownMenuItem>

                        {/* 滚动到文本（不选择） */ }
                        <DropdownMenuItem asChild className="w-full">
                          <Button
                            type="button"
                            data-style="ghost"
                            className="w-full justify-start px-2"
                            onClick={ (e) => {
                              e.preventDefault()
                              setTestType('scrollToText')
                            } }
                          >
                            滚动到文本（不选择）
                          </Button>
                        </DropdownMenuItem>
                      </div>
                    </CardItemGroup>
                  )
                : (
                  /** 输入视图 */
                    <CardItemGroup orientation="vertical" className="w-full">
                      { renderTestInput() }
                    </CardItemGroup>
                  ) }
            </CardBody>
          </Card>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
)

ScrollTestButton.displayName = 'ScrollTestButton'
