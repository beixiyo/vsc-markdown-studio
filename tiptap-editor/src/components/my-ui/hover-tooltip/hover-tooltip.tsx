"use client"

import { useMemo, useEffect, useRef } from "react"
import {
  FloatingPortal,
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
  type Placement,
} from "@floating-ui/react"

export interface GenericHoverTooltipProps {
  /** 是否启用 tooltip */
  enabled?: boolean
  /** tooltip 内容 */
  content?: string | React.ReactNode
  /** 鼠标位置 */
  mousePosition?: { x: number; y: number } | null
  /** 自定义格式化函数 */
  formatContent?: (rawContent: unknown) => string | React.ReactNode
  /** tooltip 偏移量 */
  offsetDistance?: number
  /** tooltip 位置 */
  placement?: Placement
  /** 是否显示箭头 */
  showArrow?: boolean
  /** 自定义样式 */
  className?: string
  /** 最大宽度 */
  maxWidth?: number | string
}

/**
 * 通用 Hover Tooltip 组件
 * 接收外部传入的数据和鼠标位置，显示浮动提示
 */
export function HoverTooltip({
  enabled = true,
  content,
  mousePosition,
  formatContent,
  offsetDistance = 8,
  placement = "top-start",
  showArrow = true,
  className = "",
  maxWidth = 300,
}: GenericHoverTooltipProps) {
  const arrowRef = useRef<HTMLDivElement>(null)

  // 使用 Floating UI 进行智能定位
  const { refs, floatingStyles, middlewareData } = useFloating({
    placement,
    open: !!content && enabled,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(offsetDistance),
      flip({
        crossAxis: placement.includes("-"),
        fallbackAxisSideDirection: "start",
        padding: 8,
      }),
      shift({ padding: 8 }),
      ...(showArrow ? [arrow({ element: arrowRef })] : []),
    ],
  })

  // 监听鼠标位置变化，更新虚拟参考元素
  useEffect(() => {
    if (!enabled || !mousePosition) {
      return
    }

    // 创建虚拟元素作为参考点
    const virtualElement = {
      getBoundingClientRect: () => ({
        width: 0,
        height: 0,
        x: mousePosition.x,
        y: mousePosition.y,
        top: mousePosition.y,
        right: mousePosition.x,
        bottom: mousePosition.y,
        left: mousePosition.x,
      }),
      contextElement: document.body,
    }

    refs.setReference(virtualElement)
  }, [enabled, mousePosition, refs])

  // 格式化显示内容
  const displayContent = useMemo(() => {
    if (!content) {
      return null
    }

    if (formatContent) {
      return formatContent(content)
    }

    if (typeof content === "string") {
      return content
    }

    return content
  }, [content, formatContent])

  // 如果没有内容或未启用，不显示 tooltip
  if (!content || !enabled || !mousePosition) {
    return null
  }

  // 计算箭头位置
  const arrowStyle = showArrow && middlewareData.arrow
    ? {
        left: middlewareData.arrow.x != null ? `${middlewareData.arrow.x}px` : "",
        top: middlewareData.arrow.y != null ? `${middlewareData.arrow.y}px` : "",
      }
    : {}

  const style = {
    ...floatingStyles,
    maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
  }

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        className={`fixed py-2 px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs leading-tight text-gray-800 dark:text-gray-200 break-words shadow-md z-50 pointer-events-none ${className}`}
        style={style}
      >
        {displayContent}
        {showArrow && (
          <div
            ref={arrowRef}
            className="absolute w-2 h-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rotate-45 -translate-x-1/2 -translate-y-1/2"
            style={{
              ...arrowStyle,
              clipPath: "polygon(0% 0%, 100% 100%, 0% 100%)",
            }}
          />
        )}
      </div>
    </FloatingPortal>
  )
}
