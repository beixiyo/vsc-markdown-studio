'use client'

import type { HTMLAttributes, RefObject } from 'react'
import { forwardRef, memo } from 'react'
import { cn } from 'utils'
import { LinkMain } from './link-main'

const InnerEditorLinkPanel = forwardRef<HTMLDivElement, EditorLinkPanelProps>(({
  url,
  setUrl,
  applyLink,
  removeLink,
  openLink,
  isActive,
  inputRef,
  className,
  style,
  ...rest
}, ref) => {
  return (
    <div
      ref={ ref }
      className={ cn(className) }
      style={ style }
      { ...rest }
    >
      <LinkMain
        url={ url }
        setUrl={ setUrl }
        setLink={ applyLink }
        removeLink={ removeLink }
        openLink={ openLink }
        isActive={ isActive }
        inputRef={ inputRef }
      />
    </div>
  )
})

InnerEditorLinkPanel.displayName = 'EditorLinkPanel'

export const EditorLinkPanel = memo(InnerEditorLinkPanel) as typeof InnerEditorLinkPanel

export interface EditorLinkPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** 链接地址 */
  url: string
  /** 更新链接地址 */
  setUrl: (url: string) => void
  /** 应用链接 */
  applyLink: () => void
  /** 移除链接 */
  removeLink: () => void
  /** 打开链接 */
  openLink: () => void
  /** 当前是否命中链接 */
  isActive: boolean
  /** 输入框引用 */
  inputRef?: RefObject<HTMLInputElement | null>
}
