import type React from 'react'
import { memo, useCallback, useState } from 'react'
import { Button, Input, Popover, PopoverContent, PopoverTrigger } from 'tiptap-comps'
import { CornerDownLeftIcon, SparklesIcon } from 'tiptap-comps/icons'
import { cn, SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-config'

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
    placeholder = '描述你的需求...',
    children,
    className,
  }) => {
    const [internalOpen, setInternalOpen] = useState(false)
    const [prompt, setPrompt] = useState('')

    const isControlled = controlledOpen !== undefined
    const open = isControlled
      ? controlledOpen
      : internalOpen

    const handleOpenChange = useCallback(
      (newOpen: boolean) => {
        if (!isControlled) {
          setInternalOpen(newOpen)
        }
        onOpenChange?.(newOpen)
        if (!newOpen) {
          setPrompt('')
        }
      },
      [isControlled, onOpenChange],
    )

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
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          handleSubmit()
        }
        else if (e.key === 'Escape') {
          e.preventDefault()
          handleCancel()
        }
      },
      [handleSubmit, handleCancel],
    )

    return (
      <Popover open={ open } onOpenChange={ handleOpenChange }>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          align="start"
          side="top"
          sideOffset={ 8 }
          className={ cn(
            'w-80 rounded-[var(--tt-radius-lg)] border border-[var(--tt-border-color)] bg-[var(--tt-card-bg-color)] p-0 shadow-[var(--tt-shadow-elevated-md)] backdrop-blur-[12px]',
            className,
          ) }
          onOpenAutoFocus={ e => e.preventDefault() }
          { ...{ [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true' } }
        >
          <div className="flex flex-col gap-3 p-3">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-[var(--tt-brand-color-500)]" />
              <span className="text-sm font-semibold text-[var(--tt-color-text-gray)]">
                AI 增强
              </span>
            </div>
            <Input
              className="min-h-10 w-full rounded-[var(--tt-radius-md)] border border-[var(--tt-border-color)] bg-[var(--tt-card-bg-color)] px-3 py-2.5 text-sm text-[var(--tt-color-text-gray)] transition-[border-color,box-shadow] duration-[var(--tt-transition-duration-default)] ease-[var(--tt-transition-easing-default)] placeholder:text-[var(--tiptap-input-placeholder)] focus:border-[var(--tt-brand-color-500)] focus:shadow-[0_0_0_3px_var(--tt-selection-color)] focus:outline-none"
              placeholder={ placeholder }
              value={ prompt }
              onChange={ e => setPrompt(e.target.value) }
              onKeyDown={ handleKeyDown }
              disabled={ disabled }
              autoFocus
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-[var(--tt-color-text-gray)]">
                按 Enter 提交，Esc 取消
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={ handleCancel }
                  data-style="ghost"
                  data-size="small"
                  disabled={ disabled }
                >
                  取消
                </Button>
                <Button
                  type="button"
                  onClick={ handleSubmit }
                  data-style="default"
                  data-size="small"
                  disabled={ !prompt.trim() || disabled }
                >
                  <CornerDownLeftIcon className="tiptap-button-icon" />
                  提交
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  },
)

AIInputPopover.displayName = 'AIInputPopover'
