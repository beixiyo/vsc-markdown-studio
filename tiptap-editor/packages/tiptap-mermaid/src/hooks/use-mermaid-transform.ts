import type React from 'react'
/**
 * Mermaid 变换（拖拽和缩放）Hook
 */
import { debounce } from '@jl-org/tool'

import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'

interface UseMermaidTransformOptions {
  x: number
  y: number
  scale: number
  onTransformChange: (x: number, y: number, scale: number) => void
  enabled: boolean
}

/**
 * Mermaid 变换 Hook
 * 处理拖拽移动和鼠标滚轮缩放
 */
export function useMermaidTransform({
  x,
  y,
  scale,
  onTransformChange,
  enabled,
}: UseMermaidTransformOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number, y: number, startX: number, startY: number } | null>(null)

  /** 本地变换状态，用于平滑渲染，避免频繁触发 Tiptap 的 updateAttributes */
  const [localTransform, setLocalTransform] = useState({ x, y, scale })
  const transformRef = useRef({ x, y, scale })

  const onTransformChangeEvent = useEffectEvent(onTransformChange)

  /** 当外部属性变化且不在拖拽时，同步本地状态 */
  useEffect(() => {
    if (!isDragging) {
      setLocalTransform({ x, y, scale })
      transformRef.current = { x, y, scale }
    }
  }, [x, y, scale, isDragging])

  /** 处理鼠标按下事件（开始拖拽） */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enabled || !containerRef.current)
      return

    /** 如果点击的是按钮或其他交互元素，不触发拖拽 */
    const target = e.target as HTMLElement
    if (
      target.closest('button')
      || target.closest('textarea')
      || target.closest('[data-no-drag]')
    ) {
      return
    }

    e.preventDefault()
    setIsDragging(true)
    const rect = containerRef.current.getBoundingClientRect()
    /** 记录鼠标按下时的位置（相对于视口）和当前元素位置 */
    dragStartRef.current = {
      x: localTransform.x,
      y: localTransform.y,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
    }
  }, [enabled, localTransform.x, localTransform.y])

  /** 处理鼠标移动事件（拖拽中） */
  useEffect(() => {
    if (!isDragging || !dragStartRef.current)
      return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !dragStartRef.current)
        return

      const rect = containerRef.current.getBoundingClientRect()
      /** 计算鼠标移动的偏移量 */
      const deltaX = e.clientX - rect.left - dragStartRef.current.startX
      const deltaY = e.clientY - rect.top - dragStartRef.current.startY

      /** 新位置 = 原始位置 + 偏移量 */
      const newX = dragStartRef.current.x + deltaX
      const newY = dragStartRef.current.y + deltaY

      const currentScale = transformRef.current.scale

      /** 仅更新本地状态，不触发 Tiptap 更新 */
      setLocalTransform({
        x: newX,
        y: newY,
        scale: currentScale,
      })
      transformRef.current.x = newX
      transformRef.current.y = newY
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      /** 拖拽结束时，一次性提交更新到 Tiptap */
      onTransformChangeEvent(
        transformRef.current.x,
        transformRef.current.y,
        transformRef.current.scale,
      )
      dragStartRef.current = null
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: false })
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  /** 处理鼠标滚轮事件（缩放） */
  useEffect(() => {
    if (!enabled || !containerRef.current)
      return

    /** 使用工具库的 debounce 提交更新，保持 undo 历史干净 */
    const debouncedTransformChange = debounce((nx: number, ny: number, ns: number) => {
      onTransformChangeEvent(nx, ny, ns)
    }, 300)

    const handleWheel = (e: WheelEvent) => {
      if (!containerRef.current)
        return

      /** 如果正在编辑，不触发缩放 */
      if (containerRef.current.closest('[data-editing="true"]')) {
        return
      }

      e.preventDefault()
      e.stopPropagation()

      /** 使用 ref 中的最新值 */
      const currentTransform = transformRef.current
      const delta = e.deltaY > 0
        ? -0.1
        : 0.1
      const newScale = Math.max(0.1, Math.min(3, currentTransform.scale + delta))

      /** 计算缩放中心点（鼠标位置） */
      const rect = containerRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      /** 计算缩放后的新位置，使鼠标指向的点保持不变 */
      const scaleRatio = newScale / currentTransform.scale
      const newX = mouseX - (mouseX - currentTransform.x) * scaleRatio
      const newY = mouseY - (mouseY - currentTransform.y) * scaleRatio

      /** 更新本地状态和 ref */
      setLocalTransform({ x: newX, y: newY, scale: newScale })
      transformRef.current = { x: newX, y: newY, scale: newScale }

      /** 提交更新 */
      debouncedTransformChange(newX, newY, newScale)
    }

    const container = containerRef.current
    container.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      container.removeEventListener('wheel', handleWheel)
    }
  }, [enabled])

  return {
    containerRef,
    isDragging,
    handleMouseDown,
    transform: localTransform,
  }
}
