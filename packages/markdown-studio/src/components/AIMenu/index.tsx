import type { KeyboardEvent } from 'react'
import type { MyAIMenuProps } from './types'
import { useBlockNoteEditor } from '@blocknote/react'
import { getAIExtension } from 'custom-blocknote-ai'
import { AlertTriangle, Check, Loader2, Sparkles, X } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from 'utils'
import { useSnapshot } from 'valtio'

/**
 * 右下角 AI 菜单
 */
export const AIMenu = memo<MyAIMenuProps>((props) => {
  const {
    style,
    className,
  } = props

  const editor = useBlockNoteEditor<any, any, any>()
  const aiExtension = getAIExtension(editor)
  const snap = useSnapshot(aiExtension.state)
  const [prompt, setPrompt] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (snap.aiMenuState === 'closed') {
      setPrompt('')
    }
    else if (snap.aiMenuState.status === 'user-input') {
      /** 弹出时自动聚焦到输入框 */
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 50)
    }
  }, [snap.aiMenuState])

  const menuState = snap.aiMenuState
  const isClosed = menuState === 'closed'
  const openedState = isClosed
    ? null
    : menuState
  const status = openedState?.status ?? 'closed'

  const isBusy = status === 'thinking' || status === 'ai-writing'
  const canReview = status === 'user-reviewing'
  const isError = status === 'error'

  const statusTextMap = {
    'thinking': 'AI 正在思考',
    'ai-writing': 'AI 正在续写',
    'user-reviewing': '请审核 AI 建议',
    'error': '生成失败',
    'closed': '输入提示词，让 AI 协助撰写',
  }

  const helperTextMap = {
    'thinking': '正在整理上下文，请稍候',
    'ai-writing': '正在写入建议文本',
    'user-reviewing': '查看预览后选择接受或拒绝',
    'error': '请检查提示词或稍后重试',
    'closed': '描述要生成的内容，支持中文或英文',
  }

  const statusText = statusTextMap[status as keyof typeof statusTextMap] || statusTextMap.closed
  const helperText = helperTextMap[status as keyof typeof helperTextMap] || helperTextMap.closed

  const handleSubmit = useCallback(async () => {
    if (isClosed || isBusy) {
      return
    }

    const trimmed = prompt.trim()

    await aiExtension.callLLM(trimmed || undefined)
  }, [aiExtension, isBusy, isClosed, prompt])

  const handleAccept = useCallback(async () => {
    if (!canReview) {
      return
    }

    await aiExtension.acceptChanges()
  }, [aiExtension, canReview])

  const handleReject = useCallback(async () => {
    if (!canReview) {
      return
    }

    await aiExtension.rejectChanges()
  }, [aiExtension, canReview])

  const handleClose = useCallback(() => {
    void aiExtension.closeAIMenu()
  }, [aiExtension])

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      void handleSubmit()
    }
  }, [handleSubmit])

  const errorValue = status === 'error' && openedState?.status === 'error'
    ? openedState.error
    : undefined
  const errorMessage = useMemo(() => {
    if (errorValue instanceof Error) {
      return errorValue.message
    }

    if (typeof errorValue === 'string') {
      return errorValue
    }

    if (errorValue) {
      return JSON.stringify(errorValue)
    }

    return '未知错误'
  }, [errorValue])

  if (isClosed) {
    return null
  }

  return <div
    className={ cn(
      'fixed bottom-6 right-6 z-50 w-[348px] rounded-3xl border border-border bg-white/90 p-5 shadow-2xl backdrop-blur dark:bg-neutral-900/85 transition-transform duration-200',
      className,
    ) }
    style={ style }
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2 text-textPrimary dark:text-white">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-base font-semibold">AI 助手</span>
      </div>

      <button
        type="button"
        onClick={ handleClose }
        className="h-8 w-8 flex items-center justify-center rounded-full text-textSecondary transition-colors hover:bg-backgroundSubtle dark:hover:bg-neutral-800"
      >
        <X className="h-4 w-4" />
      </button>
    </div>

    <div className="mt-4 space-y-3">
      <div className={ cn(
        'flex items-center gap-2 text-sm',
        isError
          ? 'text-danger'
          : 'text-textSecondary dark:text-neutral-400',
      ) }>
        {
          isBusy
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : isError
              ? <AlertTriangle className="h-4 w-4" />
              : <Sparkles className="h-4 w-4 text-primary" />
        }
        <span>{ statusText }</span>
      </div>

      <p className={ cn(
        'text-xs leading-relaxed text-textSecondary dark:text-neutral-500',
        isError
          ? 'text-danger'
          : undefined,
      ) }>
        { isError
          ? errorMessage
          : helperText }
      </p>

      {
        status === 'user-input' && <div className="space-y-3">
          <textarea
            ref={ textareaRef }
            value={ prompt }
            onChange={ event => setPrompt(event.target.value) }
            onKeyDown={ handleKeyDown }
            placeholder="请描述你想生成的内容，例如总结当前段落"
            className="min-h-[110px] w-full resize-none rounded-2xl border border-border bg-backgroundSubtle px-4 py-3 text-sm text-textPrimary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:bg-neutral-800 dark:text-neutral-50"
          />

          <div className="flex items-center justify-between text-xs text-textSecondary dark:text-neutral-500">
            <span>按 Ctrl 或 ⌘ + Enter 快速提交</span>
            <span>
              { prompt.trim().length }
              { ' ' }
              字符
            </span>
          </div>

          <button
            type="button"
            onClick={ handleSubmit }
            className="w-full rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primaryHover disabled:cursor-not-allowed disabled:bg-border disabled:text-textDisabled"
            disabled={ isBusy }
          >
            生成建议
          </button>
        </div>
      }

      {
        isBusy && <div className="rounded-2xl border border-dashed border-border bg-backgroundSubtle px-4 py-6 text-center text-sm text-textSecondary dark:bg-neutral-800 dark:text-neutral-400">
          正在同步内容到 AI...
        </div>
      }

      {
        canReview && <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-backgroundSubtle px-4 py-3 text-sm text-textPrimary dark:bg-neutral-800 dark:text-neutral-50">
            建议已写入文档中，请在编辑器中检查标记区域
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={ handleReject }
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-textSecondary transition-colors hover:bg-backgroundSubtle dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              拒绝
            </button>
            <button
              type="button"
              onClick={ handleAccept }
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primaryHover"
            >
              <Check className="h-4 w-4" />
              接受
            </button>
          </div>
        </div>
      }

      {
        isError && <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={ handleClose }
            className="rounded-full border border-danger px-4 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
          >
            关闭
          </button>
        </div>
      }
    </div>
  </div>
})

AIMenu.displayName = 'MyAIMenu'
