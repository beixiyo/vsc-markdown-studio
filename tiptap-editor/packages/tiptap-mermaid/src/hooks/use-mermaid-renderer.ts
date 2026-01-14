/**
 * Mermaid 渲染逻辑 Hook
 */
import type { NodeViewProps } from '@tiptap/react'
import { useTheme } from 'hooks'
import mermaid from 'mermaid'
import { useEffect, useId, useRef, useState } from 'react'
import { getMermaidThemeConfig } from '../utils/mermaid-theme'

interface UseMermaidRendererOptions {
  code: string
  node: NodeViewProps['node']
  isEditing: boolean
}

/**
 * Mermaid 渲染 Hook
 */
export function useMermaidRenderer({
  code,
  node,
  isEditing,
}: UseMermaidRendererOptions) {
  const renderContainerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  /** 获取当前主题 */
  const [theme] = useTheme()
  const isDarkMode = theme === 'dark'

  /** 优先使用节点 ID，否则使用 React 19 的 useId 生成稳定 ID */
  const stableId = useId()
  const renderId = node.attrs.id || `mermaid-${stableId}`

  /** 渲染 Mermaid 图表 */
  useEffect(() => {
    if (isEditing || !code || !renderContainerRef.current) {
      return
    }

    let cancelled = false

    const renderMermaid = async () => {
      if (!renderContainerRef.current || cancelled) {
        return
      }

      setIsRendering(true)
      setError(null)

      if (renderContainerRef.current) {
        renderContainerRef.current.innerHTML = ''
      }

      try {
        /** 根据主题配置 mermaid */
        mermaid.initialize(getMermaidThemeConfig(isDarkMode))

        /** 使用 mermaid.render API（mermaid v11+ 推荐方式） */
        if (typeof mermaid.render === 'function') {
          const { svg } = await mermaid.render(renderId, code)
          if (renderContainerRef.current && !cancelled) {
            renderContainerRef.current.innerHTML = svg
            setError(null)
          }
        }
        else {
          /** 降级方案：使用 mermaid.run API（旧版本兼容） */
          if (typeof mermaid.run !== 'function') {
            throw new TypeError('Mermaid API 不可用：需要 mermaid.render 或 mermaid.run')
          }

          const mermaidDiv = document.createElement('div')
          mermaidDiv.className = 'mermaid'
          mermaidDiv.id = renderId
          mermaidDiv.textContent = code
          renderContainerRef.current.appendChild(mermaidDiv)

          /** 等待下一个 tick 确保 DOM 已更新 */
          await new Promise(resolve => requestAnimationFrame(resolve))

          if (renderContainerRef.current && !cancelled) {
            await mermaid.run({
              nodes: [mermaidDiv],
              suppressErrors: true,
            })
          }
        }
      }
      catch (err) {
        const errorMessage = err instanceof Error
          ? err.message
          : '渲染失败'
        setError(errorMessage)

        console.error('Mermaid render error:', err)
      }
      finally {
        if (!cancelled) {
          setIsRendering(false)
        }
      }
    }

    renderMermaid()

    return () => {
      cancelled = true
      /** 清理时清空渲染容器，避免 React 清理时找不到节点 */
      if (renderContainerRef.current) {
        renderContainerRef.current.innerHTML = ''
      }
    }
  }, [code, isEditing, isDarkMode, renderId, retryKey])

  /** 重试渲染 */
  const retryRender = () => {
    setRetryKey(prev => prev + 1)
  }

  return {
    renderContainerRef,
    isRendering,
    error,
    retryRender,
  }
}
