'use client'

import type { NodeViewProps } from '@tiptap/react'
import { uniqueId } from '@jl-org/tool'
import { NodeViewWrapper } from '@tiptap/react'
import mermaid from 'mermaid'
import { useEffect, useRef, useState } from 'react'

/** 初始化 mermaid（只执行一次） */
let mermaidInitialized = false
if (typeof window !== 'undefined' && !mermaidInitialized) {
  mermaid.initialize({ startOnLoad: false })
  mermaidInitialized = true
}

export const MermaidNodeComponent: React.FC<NodeViewProps> = ({ node, selected }) => {
  /** 专门用于渲染 Mermaid SVG 的容器，避免与 React 管理的 DOM 冲突 */
  const renderContainerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const code = node.attrs.code || ''

  useEffect(() => {
    if (!code || !renderContainerRef.current) {
      return
    }

    let cancelled = false

    const renderMermaid = async () => {
      if (!renderContainerRef.current || cancelled) {
        return
      }

      setIsRendering(true)
      setError(null)

      try {
        /** 生成唯一的 ID */
        const id = `mermaid-${uniqueId()}`

        /** 使用 mermaid.render API（更安全，避免 DOM 时序问题） */
        if (typeof mermaid.render === 'function') {
          const { svg } = await mermaid.render(id, code)
          if (renderContainerRef.current && !cancelled) {
            renderContainerRef.current.innerHTML = svg
            setError(null)
          }
        }
        else if (typeof mermaid.run === 'function') {
          /** 使用 mermaid.run API（需要等待 DOM 更新） */
          renderContainerRef.current.innerHTML = ''
          const mermaidDiv = document.createElement('div')
          mermaidDiv.className = 'mermaid'
          mermaidDiv.id = id
          mermaidDiv.textContent = code
          renderContainerRef.current.appendChild(mermaidDiv)

          /** 等待下一个 tick 确保 DOM 已更新 */
          await new Promise(resolve => requestAnimationFrame(resolve))

          if (renderContainerRef.current && !cancelled) {
            await mermaid.run({
              nodes: [mermaidDiv],
              suppressErrors: false,
            })
          }
        }
        else {
          throw new TypeError('Mermaid API 不可用：需要 mermaid.render 或 mermaid.run')
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
  }, [code])

  return (
    <NodeViewWrapper
      className={ `mermaid-node-wrapper ${selected
        ? 'selected'
        : ''}` }
      data-mermaid="true"
    >
      <div
        className="mermaid-container"
        style={ {
          minHeight: '100px',
          padding: '16px',
          border: selected
            ? '2px solid #3b82f6'
            : '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#f9fafb',
        } }
      >
        {isRendering && (
          <div style={ { textAlign: 'center', color: '#6b7280' } }>
            正在渲染图表...
          </div>
        )}
        {error && (
          <div
            style={ {
              padding: '12px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '4px',
              color: '#991b1b',
            } }
          >
            <strong>渲染错误：</strong>
            {error}
          </div>
        )}
        {!code && (
          <div style={ { textAlign: 'center', color: '#9ca3af', padding: '20px' } }>
            请输入 Mermaid 代码
          </div>
        )}
        {/** 专门用于渲染 Mermaid SVG 的容器，与 React 管理的 UI 分离 */}
        <div ref={ renderContainerRef } />
      </div>
    </NodeViewWrapper>
  )
}
