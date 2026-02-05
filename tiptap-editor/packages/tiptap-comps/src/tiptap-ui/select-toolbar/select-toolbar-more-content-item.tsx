import type { ReactElement } from 'react'

import { cloneElement, isValidElement, memo } from 'react'
import { cn } from 'utils'
import { TIPTAP_UI_STYLES } from '../constants'

/** moreContent 子项的统一样式封装，避免外部重复传 className */
export const SelectToolbarMoreContentItem = memo<SelectToolbarMoreContentItemProps>(({
  children,
  className,
  labelClassName,
  showLabel = true,
  showTooltip = false,
}) => {
  if (!isValidElement(children)) {
    return null
  }

  const childProps = children.props as SelectToolbarMoreContentCompatibleProps

  return cloneElement(children, {
    showLabel: childProps.showLabel ?? showLabel,
    showTooltip: childProps.showTooltip ?? showTooltip,
    className: cn(TIPTAP_UI_STYLES.moreContentTrigger, childProps.className, className),
    labelClassName: cn(TIPTAP_UI_STYLES.moreContentLabel, childProps.labelClassName, labelClassName),
  })
})

SelectToolbarMoreContentItem.displayName = 'SelectToolbarMoreContentItem'

/** SelectToolbarMoreContentItem 的 props */
export interface SelectToolbarMoreContentItemProps {
  /** moreContent 子项，需支持 className、labelClassName、showLabel、showTooltip */
  children: ReactElement<SelectToolbarMoreContentCompatibleProps>
  /** 额外追加到子项的 className */
  className?: string
  /** 额外追加到子项 label 的 className */
  labelClassName?: string
  /**
   * 是否强制显示文案
   * @default true
   */
  showLabel?: boolean
  /**
   * 是否强制隐藏 tooltip
   * @default false
   */
  showTooltip?: boolean
}

/** moreContent 子项需支持的最小 props 集合 */
export interface SelectToolbarMoreContentCompatibleProps {
  className?: string
  labelClassName?: string
  showLabel?: boolean
  showTooltip?: boolean
}
