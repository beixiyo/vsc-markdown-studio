import { useEffect, useState } from "react"

/**
 * 断点检测模式
 * - "min": 检测视口宽度是否大于等于断点值
 * - "max": 检测视口宽度是否小于断点值
 */
type BreakpointMode = "min" | "max"

/**
 * 检测当前视口是否匹配给定断点规则的自定义 Hook
 * 
 * 使用 CSS 媒体查询来检测视口宽度，支持响应式设计。
 * 当视口尺寸变化时自动更新匹配状态。
 * 
 * @example
 * ```tsx
 * // 检测移动设备（宽度小于 768px）
 * const isMobile = useIsBreakpoint("max", 768);
 * 
 * // 检测桌面设备（宽度大于等于 1024px）
 * const isDesktop = useIsBreakpoint("min", 1024);
 * 
 * // 条件渲染
 * return (
 *   <div>
 *     {isMobile && <MobileView />}
 *     {isDesktop && <DesktopView />}
 *   </div>
 * );
 * ```
 * 
 * @param mode - 断点检测模式，默认为 "max"
 *   - "min": 检测视口宽度是否大于等于断点值
 *   - "max": 检测视口宽度是否小于断点值
 * @param breakpoint - 断点值（像素），默认为 768
 * @returns 如果当前视口匹配断点规则返回 true，否则返回 false
 * 
 * @note
 * - 当 mode 为 "max" 时，实际检测的是 `max-width: ${breakpoint - 1}px`
 * - 当 mode 为 "min" 时，实际检测的是 `min-width: ${breakpoint}px`
 * - 初始值为 undefined，直到媒体查询完成初始化
 */
export function useIsBreakpoint(
  mode: BreakpointMode = "max",
  breakpoint = 768
) {
  const [matches, setMatches] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const query =
      mode === "min"
        ? `(min-width: ${breakpoint}px)`
        : `(max-width: ${breakpoint - 1}px)`

    const mql = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)

    // 设置初始值
    setMatches(mql.matches)

    // 添加监听器
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [mode, breakpoint])

  return !!matches
}
