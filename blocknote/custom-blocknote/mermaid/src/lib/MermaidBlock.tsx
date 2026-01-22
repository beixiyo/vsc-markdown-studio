/* eslint-disable react-hooks/rules-of-hooks */
import { defaultProps } from '@blocknote/core'
import { createReactBlockSpec } from '@blocknote/react'
/** 暂时删除这个包，需要用到再改 */
// import { Modal, Textarea } from 'comps'
import { useTheme } from 'hooks'
import mermaid from 'mermaid'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from 'utils'
import { mermaidEvents } from './constants'

/**
 * BlockNote Mermaid 块定义
 */
export const MermaidBlock = createReactBlockSpec(
  {
    type: 'mermaid',
    content: 'none',
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,

      /** Mermaid 源码字符串 */
      diagram: {
        default: 'graph TD\n  A[Start] --> B{Is it?}\n  B --> C[End]',
        type: 'string',
      },
    },
  },
  {
    toExternalHTML: ({ block }) => {
      return (
        <pre className="language-mermaid"><code>{ block.props.diagram }</code></pre>
      )
    },
    parse: (el) => {
      /** 从 <pre><code class="language-mermaid">...</code></pre> 解析回块 props */
      const pre = el.tagName === 'PRE'
        ? el
        : el.querySelector('pre')
      const codeEl = pre?.querySelector('code.language-mermaid') as HTMLElement | null
      if (codeEl && codeEl.textContent) {
        return { diagram: codeEl.textContent }
      }
      return undefined
    },

    render: (props) => {
      const { block, editor } = props
      const containerRef = useRef<HTMLDivElement | null>(null)

      const [code, setCode] = useState<string>(block.props.diagram)
      const [isEditing, setIsEditing] = useState(false)
      const [draft, setDraft] = useState<string>(block.props.diagram)

      const [theme] = useTheme()
      const isDarkMode = theme === 'dark'
      const [_renderError, setRenderError] = useState<string | null>(null)

      // ======================
      // * Fns
      // ======================
      const handleSave = useCallback(() => {
        setCode(draft)
        setIsEditing(false)
      }, [draft])

      const handleCancel = useCallback(() => {
        setIsEditing(false)
        setDraft(code)
      }, [code])

      /** 外部更新时同步本地 code（如协同/撤销等） */
      useEffect(() => {
        setCode(block.props.diagram)
      }, [block.props.diagram])

      /** 监听来自 FormattingToolbar 的编辑事件 */
      useEffect(() => {
        return mermaidEvents.on('change', ({ id, mode }) => {
          if (id === block.id && mode === 'edit') {
            setIsEditing(true)
            setDraft(code)
          }
        })
      }, [block.id, code])

      /** 防抖更新：渲染 + 写回 BlockNote 文档 */
      useEffect(() => {
        if (!containerRef.current)
          return

        let cancelled = false
        const timer = setTimeout(() => {
          if (cancelled)
            return

          try {
            /** 检测深色模式 */
            mermaid.initialize({
              startOnLoad: false,
              theme: isDarkMode
                ? 'dark'
                : 'default',
              themeVariables: isDarkMode
                ? {
                  /** 深色模式配色 */
                    primaryColor: '#3b82f6',
                    primaryTextColor: '#f3f4f6',
                    primaryBorderColor: '#2563eb',
                    lineColor: '#6b7280',
                    secondaryColor: '#374151',
                    tertiaryColor: '#1f2937',
                    background: '#111827',
                    mainBkg: '#374151',
                    secondBkg: '#4b5563',
                    tertiaryBkg: '#6b7280',
                  }
                : {
                  /** 浅色模式配色 */
                    primaryColor: '#3b82f6',
                    primaryTextColor: '#1f2937',
                    primaryBorderColor: '#2563eb',
                    lineColor: '#94a3b8',
                    secondaryColor: '#f3f4f6',
                    tertiaryColor: '#fef3c7',
                    background: '#ffffff',
                    mainBkg: '#ffffff',
                    secondBkg: '#f9fafb',
                    tertiaryBkg: '#f3f4f6',
                  },
            })

            const renderId = `mermaid-diagram-${block.id}-${Date.now()}`
            void mermaid
              .render(renderId, code)
              .then(({ svg }) => {
                if (containerRef.current && !cancelled) {
                  containerRef.current.innerHTML = svg
                  setRenderError(null)
                }
              })
              .catch(() => {
                if (containerRef.current && !cancelled) {
                  setRenderError('图表语法错误')
                  containerRef.current.innerHTML = `
                <div class="text-red-500 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div class="font-semibold mb-2">Mermaid 语法错误</div>
                  <pre class="text-sm whitespace-pre-wrap opacity-75">${code}</pre>
                </div>
              `
                }
              })
          }
          catch {
            if (containerRef.current && !cancelled) {
              setRenderError('渲染失败')
              containerRef.current.innerHTML = `
            <div class="text-red-500 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div class="font-semibold mb-2">渲染失败</div>
              <pre class="text-sm whitespace-pre-wrap opacity-75">${code}</pre>
            </div>
          `
            }
          }

          /** 将最新内容写回到块 props */
          if (!cancelled) {
            try {
              editor.updateBlock(block, {
                props: { diagram: code },
              })
            }
            catch { }
          }
        })

        return () => {
          clearTimeout(timer)
          cancelled = true
        }
      }, [code, block, editor, isDarkMode])

      return (<>
        <div
          className={ cn(
            'relative rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden my-4',
          ) }
        >
          {/* Mermaid 图表容器 */ }
          <div
            ref={ containerRef }
            className="min-h-[150px] p-4 flex items-center [&>svg]:max-w-full [&>svg]:h-auto"
            data-block-id={ block.id }
          />
        </div>

        {/* 编辑对话框：改用项目内置 Modal */ }
        {/* <Modal
          isOpen={ isEditing }
          onClose={ handleCancel }
          onOk={ handleSave }
          titleText="编辑 Mermaid 图表"
          okText="保存更改"
          cancelText="取消"
          width={ 800 }
          clickOutsideClose
        >
          <Textarea
            label="Mermaid 代码"
            value={ draft }
            onChange={ value => setDraft(value) }
            onKeyDown={ e => e.stopPropagation() }
            placeholder="graph TD&#10;  A[Start] --> B{Is it?}&#10;  B -->|Yes| C[OK]&#10;  B -->|No| D[End]"
            spellCheck={ false }
            className="min-h-[300px] font-mono text-sm leading-6"
            autoResize
            size="sm"
          />

          <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
            <p>支持的图表类型：flowchart、sequence、gantt、class、state、er、journey、git 等</p>
            <a
              href="https://mermaid.js.org/syntax/flowchart.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 underline inline-block"
            >
              查看 Mermaid 语法文档 →
            </a>
          </div>
        </Modal> */}
      </>)
    },
  },
)
