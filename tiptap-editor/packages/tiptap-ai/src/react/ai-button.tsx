import type React from 'react'
import type { AIOrchestrator } from '../AIOrchestrator'
import type { PreviewController } from '../PreviewController'
import type { AIRequestMode } from '../types'
import { forwardRef, memo, useCallback, useState } from 'react'
import { useTiptapEditor } from 'tiptap-api/react'
import { Button } from 'comps'
import { SparklesIcon } from 'tiptap-comps/icons'
import { AIInputPopover } from './ai-input-popover'
import { useAI } from './hooks/use-ai'

/**
 * AI 按钮组件的属性
 */
export type AIButtonProps = {
  editor?: any
  controller?: PreviewController | null
  orchestrator?: AIOrchestrator | null
  mode?: AIRequestMode
  text?: string
  hideWhenUnavailable?: boolean
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  children?: React.ReactNode
} & React.ComponentPropsWithoutRef<'button'>

/**
 * AI 增强按钮组件
 */
export const AIButton = memo(
  forwardRef<HTMLButtonElement, AIButtonProps>(
    (
      {
        editor: providedEditor,
        controller,
        orchestrator: _orchestrator,
        mode = 'stream',
        text,
        hideWhenUnavailable = false,
        onClick,
        children,
        ...buttonProps
      },
      ref,
    ) => {
      const { editor } = useTiptapEditor(providedEditor)
      void _orchestrator
      const { canTrigger, isProcessing, handleTrigger, label } = useAI({
        editor,
        controller: controller ?? null,
        mode,
      })

      const [popoverOpen, setPopoverOpen] = useState(false)

      const handlePopoverSubmit = useCallback(
        (prompt: string) => {
          handleTrigger(prompt)
        },
        [handleTrigger],
      )

      const handleButtonClick = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(event)
          if (event.defaultPrevented)
            return
          setPopoverOpen(true)
        },
        [onClick],
      )

      if (hideWhenUnavailable && !canTrigger) {
        return null
      }

      return (
        <AIInputPopover
          open={ popoverOpen }
          onOpenChange={ setPopoverOpen }
          onSubmit={ handlePopoverSubmit }
          disabled={ !canTrigger || isProcessing }
        >
          <Button
            type="button"
            variant={ isProcessing ? 'primary' : 'ghost' }
            size="sm"
            disabled={ !canTrigger || isProcessing }
            role="button"
            tabIndex={ -1 }
            aria-label={ label }
            tooltip={ label }
            onClick={ handleButtonClick }
            { ...buttonProps }
            ref={ ref }
          >
            {children ?? (
              <>
                <SparklesIcon className="size-4" />
                {text && <span className="text-base text-textSecondary">{text}</span>}
              </>
            )}
          </Button>
        </AIInputPopover>
      )
    },
  ),
)

AIButton.displayName = 'AIButton'
