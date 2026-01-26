import type { PreviewController } from '../PreviewController'
import type { PreviewStatus } from '../PreviewStateMachine'
import { memo, useEffect, useState } from 'react'
import { Button } from 'tiptap-comps'
import { CheckIcon, XIcon } from 'tiptap-comps/icons'
import { cn } from 'utils'

/**
 * AI 操作面板的属性
 */
export type AIActionPanelProps = {
  controller: PreviewController | null
  className?: string
  onClose?: () => void
}

/**
 * AI 操作面板组件，显示接受/拒绝按钮
 */
export const AIActionPanel = memo<AIActionPanelProps>(
  ({ controller, className, onClose }) => {
    const [status, setStatus] = useState<PreviewStatus>('idle')
    const [previewText, setPreviewText] = useState<string>('')

    useEffect(() => {
      if (!controller)
        return

      const unsubscribe = controller.subscribe((state) => {
        setStatus(state.status)
        if (state.preview?.text) {
          setPreviewText(state.preview.text)
        }
        else {
          setPreviewText('')
        }
      })

      return unsubscribe
    }, [controller])

    if (
      status === 'idle'
      || status === 'error'
      || status === 'accepted'
      || status === 'rejected'
      || status === 'cancelled'
    ) {
      return null
    }

    const handleAccept = () => {
      controller?.accept()
      onClose?.()
    }

    const handleReject = () => {
      controller?.reject()
      onClose?.()
    }

    return (
      <div
        className={ cn(
          'flex min-w-[12rem] items-center gap-2 rounded-[var(--tt-radius-lg)] border border-[var(--tt-border-color)] bg-[var(--tt-card-bg-color)] px-3 py-2 text-[var(--text-color-primary)] shadow-[var(--tt-shadow-elevated-md)] dark:bg-[var(--bg-color-primary)] dark:text-[var(--text-color-primary)]',
          className,
        ) }
      >
        { status === 'processing' && (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--tt-brand-color-500)] border-t-transparent" />
            <span className="text-sm text-[var(--text-color-primary)] dark:text-[var(--text-color-primary)]">
              AI 处理中...
            </span>
          </div>
        ) }

        { status === 'preview' && (
          <>
            { previewText && (
              <div className="flex-1 max-w-[14rem] overflow-hidden text-ellipsis whitespace-nowrap text-sm text-[var(--tt-color-text-gray)]">
                { previewText }
              </div>
            ) }
            <div className="flex items-center gap-1">
              <Button
                type="button"
                onClick={ handleAccept }
                data-style="default"
                data-size="small"
                className="text-[var(--tt-color-green-base)]"
                aria-label="接受"
                tooltip="接受"
              >
                <CheckIcon className="tiptap-button-icon" />
              </Button>
              <Button
                type="button"
                onClick={ handleReject }
                data-style="ghost"
                data-size="small"
                className="text-[var(--tt-color-red-base)]"
                aria-label="拒绝"
                tooltip="拒绝"
              >
                <XIcon className="tiptap-button-icon" />
              </Button>
            </div>
          </>
        ) }
      </div>
    )
  },
)

AIActionPanel.displayName = 'AIActionPanel'
