'use client'

import type { Editor } from '@tiptap/react'
import type { PopoverRef } from 'comps'
import type { ButtonHTMLAttributes } from 'react'
import type { UseLinkPopoverConfig } from './use-link-popover'
import { Popover } from 'comps'

import { forwardRef, useCallback, useEffect, useRef } from 'react'
import { useTiptapEditor } from 'tiptap-api/react'

import { SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'
import { TIPTAP_UI_STYLES } from '../constants'
import { LinkButton } from './link-button'
import { LinkMain } from './link-main'
import { useLinkPopover } from './use-link-popover'

/** 链接弹层：设置/编辑/移除链接 */
export const LinkPopover = forwardRef<HTMLButtonElement, LinkPopoverProps>((
  {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onSetLink,
    onOpenChange,
    autoOpenOnLinkActive = true,
    showLabel = false,
    showTooltip = true,
    labelClassName,
    onClick,
    children,
    ...buttonProps
  },
  ref,
) => {
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

  useEffect(() => {
    if (autoOpenOnLinkActive && isActive) {
      popoverRef.current?.open()
    }
  }, [autoOpenOnLinkActive, isActive])

  const handleOpen = useCallback(() => {
    onOpenChange?.(true)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
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
      onClose={ () => onOpenChange?.(false) }
      restoreFocusOnOpen={ true }
      content={
        <div { ...{ [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true' } }>
          <LinkMain
            url={ url }
            setUrl={ setUrl }
            setLink={ handleSetLink }
            removeLink={ removeLink }
            openLink={ openLink }
            isActive={ isActive }
            inputRef={ inputRef }
          />
        </div>
      }
    >
      <LinkButton
        disabled={ !canSet }
        data-active-state={
          isActive
            ? 'on'
            : 'off'
        }
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
})

LinkPopover.displayName = 'LinkPopover'

export interface LinkPopoverProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
  UseLinkPopoverConfig {
  /** Popover 打开/关闭状态变化回调 */
  onOpenChange?: (isOpen: boolean) => void
  /** 当选区命中链接时，是否自动打开弹层（默认 true） */
  autoOpenOnLinkActive?: boolean
  /** 为 true 时，使用组件内 tooltip（label）作为按钮旁文案显示 */
  showLabel?: boolean
  /** 为 false 时不显示悬停 tooltip */
  showTooltip?: boolean
  /** 文案（label）的 class，用于 showLabel 时的 span */
  labelClassName?: string
  editor?: Editor | null
}

export { LinkButton } from './link-button'
export { LinkContent } from './link-content'
export type { LinkMainProps } from './link-main'
