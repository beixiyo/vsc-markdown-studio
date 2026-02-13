import { Button, Popover, type PopoverRef, Textarea } from 'comps'
import { useT } from 'i18n/react'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { SparklesIcon } from 'tiptap-comps/icons'
import { SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'
import { cn } from 'utils'
import { AI_LABELS } from '../constants'

/**
 * AI 输入弹窗属性
 */
export type AIInputPopoverProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSubmit?: (prompt: string) => void
  onCancel?: () => void
  disabled?: boolean
  placeholder?: string
  children?: React.ReactNode
  className?: string
}

/**
 * AI 输入弹窗组件，用于输入 AI 需求描述
 */
export const AIInputPopover = memo<AIInputPopoverProps>(
  ({
    open: controlledOpen,
    onOpenChange,
    onSubmit,
    onCancel,
    disabled = false,
    placeholder,
    children,
    className,
  }) => {
    const t = useT()
    const [prompt, setPrompt] = useState('')
    const popoverRef = useRef<PopoverRef>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const isControlled = controlledOpen !== undefined

    const handleOpenChange = useCallback(
      (newOpen: boolean) => {
        onOpenChange?.(newOpen)
        if (!newOpen) {
          setPrompt('')
        }
      },
      [onOpenChange],
    )

    const focusTextarea = useCallback(() => {
      /** 延迟聚焦确保 Popover 动画完成后能够成功获取焦点 */
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }, [])

    useEffect(() => {
      if (isControlled) {
        if (controlledOpen) {
          popoverRef.current?.open()
        }
        else {
          popoverRef.current?.close()
        }
      }
    }, [isControlled, controlledOpen])

    const handleSubmit = useCallback(() => {
      if (!prompt.trim() || disabled)
        return
      onSubmit?.(prompt.trim())
      setPrompt('')
      handleOpenChange(false)
    }, [prompt, disabled, onSubmit, handleOpenChange])

    const handleCancel = useCallback(() => {
      setPrompt('')
      handleOpenChange(false)
      onCancel?.()
    }, [handleOpenChange, onCancel])

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          handleCancel()
        }
      },
      [handleCancel],
    )

    const handlePressEnter = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!e.shiftKey) {
          e.preventDefault()
          handleSubmit()
        }
      },
      [handleSubmit],
    )

    return (
      <Popover
        ref={ popoverRef }
        trigger={ isControlled
          ? 'command'
          : 'click' }
        onOpen={ () => {
          if (!isControlled) {
            handleOpenChange(true)
          }
          focusTextarea()
        } }
        onClose={ () => !isControlled && handleOpenChange(false) }
        content={
          <div
            className={ cn(
              'w-80 flex flex-col gap-3 p-3',
              className,
            ) }
            { ...{ [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true' } }
          >
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-brand" />
              <span className="text-sm font-semibold text-text2">
                { t(AI_LABELS.IDLE) }
              </span>
            </div>
            <Textarea
              ref={ textareaRef }
              className="w-full"
              placeholder={ placeholder || t(AI_LABELS.INPUT_PLACEHOLDER) }
              value={ prompt }
              onChange={ setPrompt }
              onPressEnter={ handlePressEnter }
              onKeyDown={ handleKeyDown }
              disabled={ disabled }
              autoFocus
              size="sm"
              autoResize
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-text3">
                { t(AI_LABELS.HINT) }
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={ handleCancel }
                  variant="ghost"
                  size="sm"
                  disabled={ disabled }
                >
                  { t(AI_LABELS.CANCEL) }
                </Button>
                <Button
                  type="button"
                  onClick={ handleSubmit }
                  variant="primary"
                  size="sm"
                  disabled={ !prompt.trim() || disabled }
                >
                  { t(AI_LABELS.SUBMIT) }
                </Button>
              </div>
            </div>
          </div>
        }
        contentClassName="p-0 backdrop-blur-[12px] bg-background/80"
      >
        { children }
      </Popover>
    )
  },
)

AIInputPopover.displayName = 'AIInputPopover'
