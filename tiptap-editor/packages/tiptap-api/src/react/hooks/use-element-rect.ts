'use client'

import { useCallback, useEffect, useState } from 'react'
import { useThrottledCallback } from '../hooks'

/**
 * 元素边界矩形的状态类型，排除了 DOMRect 的 toJSON 方法
 */
export type RectState = Omit<DOMRect, 'toJSON'>

export interface ElementRectOptions {
  /**
   * 要跟踪的元素。可以是 Element、ref 或选择器字符串。
   * 如果未提供，默认为 document.body。
   */
  element?: Element | React.RefObject<Element> | string | null
  /**
   * 是否启用矩形跟踪
   */
  enabled?: boolean
  /**
   * 矩形更新的节流延迟（毫秒）
   */
  throttleMs?: number
  /**
   * 是否使用 ResizeObserver 进行更精确的跟踪
   */
  useResizeObserver?: boolean
}

const initialRect: RectState = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
}

const isSSR = typeof window === 'undefined'
const hasResizeObserver = !isSSR && typeof ResizeObserver !== 'undefined'

/**
 * 检查代码是否在客户端运行的辅助函数
 * @returns 如果代码在客户端运行返回 true，否则返回 false
 */
const isClientSide = (): boolean => !isSSR

/**
 * 跟踪元素边界矩形的自定义 Hook
 *
 * 实时监控元素的边界矩形变化，包括位置、尺寸等信息。
 * 支持多种元素选择方式（直接元素、React ref、CSS 选择器）。
 * 自动监听窗口滚动、调整大小以及元素自身尺寸变化。
 * 使用节流优化性能，避免频繁更新。
 *
 * @example
 * ```tsx
 * // 跟踪特定元素
 * const rect = useElementRect({ element: "#my-element" });
 *
 * // 跟踪 React ref
 * const ref = useRef<HTMLDivElement>(null);
 * const rect = useElementRect({ element: ref });
 *
 * // 跟踪 body 元素
 * const bodyRect = useBodyRect();
 * ```
 *
 * @param options - 元素矩形跟踪的配置选项
 * @param options.element - 要跟踪的元素，可以是 Element、React.RefObject 或 CSS 选择器字符串
 * @param options.enabled - 是否启用跟踪，默认为 true
 * @param options.throttleMs - 更新节流时间（毫秒），默认为 100
 * @param options.useResizeObserver - 是否使用 ResizeObserver 进行精确跟踪，默认为 true
 * @returns 元素的当前边界矩形状态
 */
export function useElementRect({
  element,
  enabled = true,
  throttleMs = 100,
  useResizeObserver = true,
}: ElementRectOptions = {}): RectState {
  const [rect, setRect] = useState<RectState>(initialRect)

  const getTargetElement = useCallback((): Element | null => {
    if (!enabled || !isClientSide())
      return null

    if (!element) {
      return document.body
    }

    if (typeof element === 'string') {
      return document.querySelector(element)
    }

    if ('current' in element) {
      return element.current
    }

    return element
  }, [element, enabled])

  const updateRect = useThrottledCallback(
    () => {
      if (!enabled || !isClientSide())
        return

      const targetElement = getTargetElement()
      if (!targetElement) {
        setRect(initialRect)
        return
      }

      const newRect = targetElement.getBoundingClientRect()
      setRect({
        x: newRect.x,
        y: newRect.y,
        width: newRect.width,
        height: newRect.height,
        top: newRect.top,
        right: newRect.right,
        bottom: newRect.bottom,
        left: newRect.left,
      })
    },
    throttleMs,
    [enabled, getTargetElement],
    { leading: true, trailing: true },
  )

  useEffect(() => {
    if (!enabled || !isClientSide()) {
      setRect(initialRect)
      return
    }

    const targetElement = getTargetElement()
    if (!targetElement)
      return

    updateRect()

    const cleanup: (() => void)[] = []

    if (useResizeObserver && hasResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        window.requestAnimationFrame(updateRect)
      })
      resizeObserver.observe(targetElement)
      cleanup.push(() => resizeObserver.disconnect())
    }

    const handleUpdate = () => updateRect()

    window.addEventListener('scroll', handleUpdate, true)
    window.addEventListener('resize', handleUpdate, true)

    cleanup.push(() => {
      window.removeEventListener('scroll', handleUpdate)
      window.removeEventListener('resize', handleUpdate)
    })

    return () => {
      cleanup.forEach(fn => fn())
      setRect(initialRect)
    }
  }, [enabled, getTargetElement, updateRect, useResizeObserver])

  return rect
}

/**
 * 跟踪 document.body 边界矩形的便捷 Hook
 *
 * 这是 useElementRect 的便捷封装，专门用于跟踪文档主体的边界矩形。
 * 常用于需要知道文档整体尺寸或位置的场景。
 *
 * @example
 * ```tsx
 * const bodyRect = useBodyRect({
 *   throttleMs: 200,
 *   useResizeObserver: true
 * });
 * ```
 *
 * @param options - 元素矩形跟踪的配置选项（排除 element 参数）
 * @returns 文档主体的当前边界矩形
 */
export function useBodyRect(
  options: Omit<ElementRectOptions, 'element'> = {},
): RectState {
  return useElementRect({
    ...options,
    element: isClientSide()
      ? document.body
      : null,
  })
}

/**
 * 跟踪 React ref 元素边界矩形的便捷 Hook
 *
 * 这是 useElementRect 的便捷封装，专门用于跟踪 React ref 指向的元素的边界矩形。
 * 适用于需要知道组件尺寸或位置的场景。
 *
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * const rect = useRefRect(ref, {
 *   throttleMs: 150,
 *   useResizeObserver: true
 * });
 * ```
 *
 * @template T - 元素类型，必须是 Element 的子类
 * @param ref - React ref 对象，指向要跟踪的元素
 * @param options - 元素矩形跟踪的配置选项（排除 element 参数）
 * @returns ref 指向元素的当前边界矩形
 */
export function useRefRect<T extends Element>(
  ref: React.RefObject<T>,
  options: Omit<ElementRectOptions, 'element'> = {},
): RectState {
  return useElementRect({ ...options, element: ref })
}
