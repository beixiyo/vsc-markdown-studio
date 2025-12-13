'use client'

import { useEffect, useState } from 'react'
import { useThrottledCallback } from '../hooks'

export interface WindowSizeState {
  /**
   * 窗口视觉视口的宽度（像素）
   */
  width: number
  /**
   * 窗口视觉视口的高度（像素）
   */
  height: number
  /**
   * 视觉视口顶部到布局视口顶部的距离
   * 特别适用于处理移动端键盘出现的情况
   */
  offsetTop: number
  /**
   * 视觉视口左侧到布局视口左侧的距离
   */
  offsetLeft: number
  /**
   * 视觉视口的缩放因子
   * 用于根据当前缩放级别缩放元素
   */
  scale: number
}

/**
 * 跟踪窗口视觉视口尺寸、位置和缩放状态的自定义 Hook
 *
 * 使用现代浏览器的 Visual Viewport API 获取精确的视口测量值，
 * 这对于移动设备尤其重要，因为虚拟键盘、手势缩放等会改变可见区域。
 * 提供完整的视口信息，包括尺寸、位置偏移和缩放因子。
 * 使用节流优化性能，仅在值实际发生变化时更新状态。
 *
 * @example
 * ```tsx
 * // 基本使用
 * const { width, height, offsetTop, offsetLeft, scale } = useWindowSize();
 *
 * // 响应式设计
 * const isMobile = width < 768;
 * const isTablet = width >= 768 && width < 1024;
 *
 * // 处理移动端键盘
 * const hasKeyboard = offsetTop > 0;
 *
 * // 根据缩放调整布局
 * const scaledWidth = width * scale;
 * const scaledHeight = height * scale;
 * ```
 *
 * @returns 包含视口属性的对象
 *   - width: 视觉视口宽度（像素）
 *   - height: 视觉视口高度（像素）
 *   - offsetTop: 视觉视口顶部到布局视口顶部的距离（像素）
 *   - offsetLeft: 视觉视口左侧到布局视口左侧的距离（像素）
 *   - scale: 视觉视口的缩放因子（例如 1.0 表示无缩放，2.0 表示 200% 缩放）
 *
 * @note
 * - 使用 Visual Viewport API，需要现代浏览器支持
 * - 对于不支持 Visual Viewport API 的浏览器，部分值可能为 0
 * - 更新频率受节流控制（默认 200ms），避免频繁重渲染
 * - 特别适用于：
 *   - 移动端响应式设计
 *   - 处理虚拟键盘显示/隐藏
 *   - 手势缩放适配
 *   - 精确的元素定位
 *   - 视口变化时的布局调整
 */
export function useWindowSize(): WindowSizeState {
  const [windowSize, setWindowSize] = useState<WindowSizeState>({
    width: 0,
    height: 0,
    offsetTop: 0,
    offsetLeft: 0,
    scale: 0,
  })

  const handleViewportChange = useThrottledCallback(() => {
    if (typeof window === 'undefined')
      return

    const vp = window.visualViewport
    if (!vp)
      return

    const {
      width = 0,
      height = 0,
      offsetTop = 0,
      offsetLeft = 0,
      scale = 0,
    } = vp

    setWindowSize((prevState) => {
      if (
        width === prevState.width
        && height === prevState.height
        && offsetTop === prevState.offsetTop
        && offsetLeft === prevState.offsetLeft
        && scale === prevState.scale
      ) {
        return prevState
      }

      return { width, height, offsetTop, offsetLeft, scale }
    })
  }, 200)

  useEffect(() => {
    const visualViewport = window.visualViewport
    if (!visualViewport)
      return

    visualViewport.addEventListener('resize', handleViewportChange)

    handleViewportChange()

    return () => {
      visualViewport.removeEventListener('resize', handleViewportChange)
    }
  }, [handleViewportChange])

  return windowSize
}
