import type { ElementType, HTMLAttributes, ReactNode } from 'react'

import { memo } from 'react'
import { cn } from 'utils'
import { TIPTAP_UI_STYLES } from '../constants'

/** 菜单项文案与图标布局，用于下拉选项和 moreContent 保持一致 */
export const ToolbarMenuItem = memo<ToolbarMenuItemProps>(({
  icon: Icon,
  label,
  className,
  labelClassName,
  iconClassName,
  ...rest
}) => {
  return (
    <div
      className={ cn(TIPTAP_UI_STYLES.moreContentTrigger, className) }
      { ...rest }
    >
      { Icon && <Icon className={ cn(TIPTAP_UI_STYLES.iconSecondary, iconClassName) } /> }
      { label !== undefined && label !== null && (
        <span className={ cn(TIPTAP_UI_STYLES.moreContentLabel, labelClassName) }>
          { label }
        </span>
      ) }
    </div>
  )
})

ToolbarMenuItem.displayName = 'ToolbarMenuItem'

/** ToolbarMenuItem 的 props */
export interface ToolbarMenuItemProps
  extends HTMLAttributes<HTMLDivElement> {
  /** 图标组件 */
  icon?: ElementType
  /** 菜单项文案 */
  label?: ReactNode
  /** 图标 className */
  iconClassName?: string
  /** 文案 className */
  labelClassName?: string
}
