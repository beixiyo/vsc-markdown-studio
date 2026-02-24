import type { PreviewController } from '../PreviewController'
import type { PreviewStatus } from '../PreviewStateMachine'
import { Button, LoadingIcon } from 'comps'
import { useT } from 'i18n/react'
import { memo, useEffect, useState } from 'react'
import { unSelect } from 'tiptap-api'
import { CheckIcon, XIcon } from 'tiptap-comps/icons'
import { cn } from 'utils'

import { AI_LABELS } from '../constants'

/**
 * AI 操作面板的属性
 */
export type AIActionPanelProps = {
  controller: PreviewController | null
  editor?: any
  className?: string
  onClose?: () => void
}

/**
 * AI 操作面板组件，显示接受/拒绝按钮
 */
export const AIActionPanel = memo<AIActionPanelProps>(
  ({ controller, editor, className, onClose }) => {
    const t = useT()
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
      if (editor) {
        unSelect(editor)
      }
      onClose?.()
    }

    const handleReject = () => {
      controller?.reject()
      if (editor) {
        unSelect(editor)
      }
      onClose?.()
    }

    return (
      <div
        className={ cn(
          'flex min-w-48 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-text shadow-card backdrop-blur-md',
          className,
        ) }
      >
        { status === 'processing' && (
          <div className="flex items-center gap-2">
            <LoadingIcon size="sm" />
            <span className="text-sm text-text">
              { t(AI_LABELS.PROCESSING) }
            </span>
          </div>
        ) }

        { status === 'preview' && (
          <>
            { previewText && (
              <div className="flex-1 max-w-56 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-text2">
                { previewText }
              </div>
            ) }
            <div className="flex items-center gap-1">
              <Button
                type="button"
                onClick={ handleAccept }
                variant="default"
                size="sm"
                className="text-systemGreen"
                aria-label={ t('ai.accept') }
                tooltip={ t('ai.accept') }
              >
                <CheckIcon className="size-4" />
              </Button>
              <Button
                type="button"
                onClick={ handleReject }
                variant="ghost"
                size="sm"
                className="text-systemRed"
                aria-label={ t('ai.reject') }
                tooltip={ t('ai.reject') }
              >
                <XIcon className="size-4" />
              </Button>
            </div>
          </>
        ) }
      </div>
    )
  },
)

AIActionPanel.displayName = 'AIActionPanel'
