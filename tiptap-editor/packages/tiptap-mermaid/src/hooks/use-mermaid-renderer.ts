/**
 * Mermaid 渲染逻辑 Hook
 */
import { renderMermaidSVGAsync } from 'beautiful-mermaid'
import { useTheme } from 'hooks'
import { useEffect, useRef, useState } from 'react'
import { getMermaidThemeColors } from '../utils/mermaid-theme'

interface UseMermaidRendererOptions {
  code: string
  isEditing: boolean
}

/**
 * Mermaid 渲染 Hook
 */
export function useMermaidRenderer({
  code,
  isEditing,
}: UseMermaidRendererOptions) {
  const renderContainerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  /** 获取当前主题 */
  const [theme] = useTheme()
  const isDarkMode = theme === 'dark'

  /** 渲染 Mermaid 图表 */
  useEffect(() => {
    if (isEditing || !code || !renderContainerRef.current) {
      return
    }

    let cancelled = false

    const doRender = async () => {
      if (!renderContainerRef.current || cancelled) {
        return
      }

      setIsRendering(true)
      setError(null)

      if (renderContainerRef.current) {
        renderContainerRef.current.innerHTML = ''
      }

      try {
        /** 使用 beautiful-mermaid 渲染 */
        const svg = await renderMermaidSVGAsync(code, getMermaidThemeColors(isDarkMode))

        if (renderContainerRef.current && !cancelled) {
          renderContainerRef.current.innerHTML = svg
          setError(null)
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

    doRender()

    return () => {
      cancelled = true
      /** 清理时清空渲染容器，避免 React 清理时找不到节点 */
      if (renderContainerRef.current) {
        renderContainerRef.current.innerHTML = ''
      }
    }
  }, [code, isEditing, isDarkMode, retryKey])

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
