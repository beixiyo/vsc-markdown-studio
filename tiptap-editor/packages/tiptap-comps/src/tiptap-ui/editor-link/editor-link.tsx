'use client'

import type { Editor } from '@tiptap/react'
import type { PopoverRef } from 'comps'
import type { ButtonHTMLAttributes } from 'react'
import type { UseLinkPopoverConfig } from './use-link-popover'
import { Popover } from 'comps'
import { forwardRef, memo, useCallback, useRef } from 'react'
import { useTiptapEditor } from 'tiptap-api/react'
import { TIPTAP_UI_STYLES } from '../constants'
import { EditorLinkPanel } from './editor-link-panel'
import { LinkButton } from './link-button'
import { useLinkPopover } from './use-link-popover'

export const EditorLink = memo(forwardRef<HTMLButtonElement, EditorLinkProps>(({
  editor: providedEditor,
  hideWhenUnavailable = false,
  onSetLink,
  onOpenChange,
  showLabel = false,
  showTooltip = true,
  labelClassName,
  onClick,
  children,
  ...buttonProps
}, ref) => {
  const { editor } = useTiptapEditor(providedEditor)
  const popoverRef = useRef<PopoverRef>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    isVisible,
    canSet,
    isActive,
    url,
    setUrl,
    setLink,
    removeLink,
    openLink,
    label,
    Icon,
  } = useLinkPopover({
    editor,
    hideWhenUnavailable,
    onSetLink,
  })

  const handleSetLink = useCallback(() => {
    setLink()
    popoverRef.current?.close()
  }, [setLink])

  const handleOpen = useCallback(() => {
    onOpenChange?.(true)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [onOpenChange])

  const handleClose = useCallback(() => {
    onOpenChange?.(false)
  }, [onOpenChange])

  if (!isVisible) {
    return null
  }

  return (
    <Popover
      ref={ popoverRef }
      contentClassName="p-0"
      trigger="click"
      onOpen={ handleOpen }
      onClose={ handleClose }
      restoreFocusOnOpen
      content={
        <EditorLinkPanel
          url={ url }
          setUrl={ setUrl }
          applyLink={ handleSetLink }
          removeLink={ removeLink }
          openLink={ openLink }
          isActive={ isActive }
          inputRef={ inputRef }
        />
      }
    >
      <LinkButton
        disabled={ !canSet }
        data-active-state={ isActive ? 'on' : 'off' }
        data-disabled={ !canSet }
        aria-label={ label }
        aria-pressed={ isActive }
        tooltip={ showTooltip
          ? label
          : undefined }
        onClick={ onClick }
        { ...buttonProps }
        ref={ ref }
      >
        { children ?? (
          <>
            <Icon className={ TIPTAP_UI_STYLES.iconSecondary } />
            { showLabel && (
              <span className={ labelClassName ?? TIPTAP_UI_STYLES.cascaderOptionLabelWithIcon }>
                { label }
              </span>
            ) }
          </>
        ) }
      </LinkButton>
    </Popover>
  )
}))

EditorLink.displayName = 'EditorLink'

export interface EditorLinkProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
  UseLinkPopoverConfig {
  /** Popover 打开/关闭状态变化回调 */
  onOpenChange?: (isOpen: boolean) => void
  /**
   * 为 true 时，使用组件内 tooltip（label）作为按钮旁文案显示
   * @default false
   */
  showLabel?: boolean
  /**
   * 为 false 时不显示悬停 tooltip
   * @default true
   */
  showTooltip?: boolean
  /** 文案（label）的 class，用于 showLabel 时的 span */
  labelClassName?: string
  /** Tiptap 编辑器实例 */
  editor?: Editor | null
}
