import type { RefObject } from "react"
import { useEffect, useState } from "react"

/**
 * 滚动目标类型，可以是 React ref、Window 对象或 null/undefined
 */
type ScrollTarget = RefObject<HTMLElement> | Window | null | undefined

/**
 * 支持滚动事件的目标类型
 */
type EventTargetWithScroll = Window | HTMLElement | Document

interface UseScrollingOptions {
  /**
   * 滚动结束检测的防抖延迟（毫秒）
   * @default 150
   */
  debounce?: number
  /**
   * 当目标为 window 时是否回退到 document
   * 用于移动端兼容性
   * @default true
   */
  fallbackToDocument?: boolean
}

/**
 * 检测元素是否正在滚动的自定义 Hook
 * 
 * 实时监控指定元素的滚动状态，返回一个布尔值表示当前是否正在滚动。
 * 支持多种滚动目标（Window、DOM 元素、React ref）。
 * 自动处理滚动结束检测，支持现代浏览器的 scrollend 事件和传统防抖方式。
 * 
 * @example
 * ```tsx
 * // 检测窗口滚动
 * const isWindowScrolling = useScrolling(window);
 * 
 * // 检测特定元素滚动
 * const ref = useRef<HTMLDivElement>(null);
 * const isElementScrolling = useScrolling(ref);
 * 
 * // 自定义配置
 * const isScrolling = useScrolling(window, {
 *   debounce: 200,
 *   fallbackToDocument: false
 * });
 * 
 * // 条件渲染
 * return (
 *   <div>
 *     {isScrolling && <div className="scrolling-indicator">滚动中...</div>}
 *   </div>
 * );
 * ```
 * 
 * @param target - 要检测的滚动目标
 *   - Window 对象：检测窗口滚动
 *   - React.RefObject：检测 ref 指向的 DOM 元素滚动
 *   - null/undefined：默认检测窗口滚动
 * @param options - 配置选项
 * @param options.debounce - 滚动结束检测的防抖延迟（毫秒），默认为 150
 * @param options.fallbackToDocument - 当目标为 window 时是否回退到 document，用于移动端兼容性，默认为 true
 * @returns 如果目标正在滚动返回 true，否则返回 false
 * 
 * @note
 * - 现代浏览器使用 scrollend 事件进行精确检测
 * - 不支持 scrollend 的浏览器使用防抖方式检测滚动结束
 * - 移动端建议启用 fallbackToDocument 以获得更好的兼容性
 * - 监听器使用 capture 模式（true）确保能捕获所有滚动事件
 */
export function useScrolling(
  target?: ScrollTarget,
  options: UseScrollingOptions = {}
): boolean {
  const { debounce = 150, fallbackToDocument = true } = options
  const [isScrolling, setIsScrolling] = useState(false)

  useEffect(() => {
    // 解析元素或窗口
    const element: EventTargetWithScroll =
      target && typeof Window !== "undefined" && target instanceof Window
        ? target
        : ((target as RefObject<HTMLElement>)?.current ?? window)

    // 移动端：使用 window 时回退到 document
    const eventTarget: EventTargetWithScroll =
      fallbackToDocument &&
      element === window &&
      typeof document !== "undefined"
        ? document
        : element

    const on = (
      el: EventTargetWithScroll,
      event: string,
      handler: EventListener
    ) => el.addEventListener(event, handler, true)

    const off = (
      el: EventTargetWithScroll,
      event: string,
      handler: EventListener
    ) => el.removeEventListener(event, handler)

    let timeout: ReturnType<typeof setTimeout>
    const supportsScrollEnd = element === window && "onscrollend" in window

    const handleScroll: EventListener = () => {
      if (!isScrolling) setIsScrolling(true)

      if (!supportsScrollEnd) {
        clearTimeout(timeout)
        timeout = setTimeout(() => setIsScrolling(false), debounce)
      }
    }

    const handleScrollEnd: EventListener = () => setIsScrolling(false)

    on(eventTarget, "scroll", handleScroll)
    if (supportsScrollEnd) {
      on(eventTarget, "scrollend", handleScrollEnd)
    }

    return () => {
      off(eventTarget, "scroll", handleScroll)
      if (supportsScrollEnd) {
        off(eventTarget, "scrollend", handleScrollEnd)
      }
      clearTimeout(timeout)
    }
  }, [target, debounce, fallbackToDocument, isScrolling])

  return isScrolling
}
