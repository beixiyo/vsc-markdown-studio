import type { LabelInputRendererProps } from './types'
import { memo, useCallback, useEffect, useRef } from 'react'
import { cn } from 'utils'
import { notifyNative } from '@/utils/notify'

/**
 * LabelInput 块渲染组件 - 专为多人语音对话设计
 * 标签用于标识说话人，输入区域提供完整的编辑器功能
 */
export const LabelInputRenderer = memo<LabelInputRendererProps>((props) => {
  const { block, editor } = props
  const contentRef = useRef<HTMLDivElement>(null)

  const handleLabelClick = useCallback(() => {
    /** 通知 webview 标签被点击 */
    notifyNative('labelClicked', {
      blockId: block.id,
      label: block.props.label,
    })
  }, [block.id, block.props.label])

  const handleLabelDoubleClick = useCallback(() => {
    /** 双击标签可以编辑说话人名称 */
    const newLabel = prompt('请输入说话人姓名:', block.props.label)
    if (newLabel !== null && newLabel.trim() !== '') {
      editor.updateBlock(block, {
        props: { ...block.props, label: newLabel.trim() },
      })
    }
  }, [block, editor])

  /** 初始化内容 */
  useEffect(() => {
    if (contentRef.current) {
      const text = block.content
        .filter(item => item.type === 'text')
        .map(item => (item as any).text)
        .join('')
      contentRef.current.textContent = text
    }
  }, [block.content])

  return (
    <div
      className={ cn(
        'my-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden',
        'hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors',
      ) }
    >
      {/* 说话人标签部分 */ }
      <div
        className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-neutral-200 dark:border-neutral-700 cursor-pointer hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all group"
        onClick={ handleLabelClick }
        onDoubleClick={ handleLabelDoubleClick }
        title="单击通知 webview，双击编辑说话人"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300 select-none">
            { block.props.label || '点击设置说话人' }
          </span>
          <span className="text-xs text-blue-500 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
            双击编辑
          </span>
        </div>
      </div>

      {/* 输入内容部分 - 提供完整的原生编辑体验 */ }
      <div className="p-4">
        <div
          ref={ contentRef }
          className="min-h-[40px] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-md transition-all cursor-text whitespace-pre-wrap empty:before:content-[attr(data-placeholder)] empty:before:text-neutral-400 empty:before:pointer-events-none"
          data-placeholder="在此输入对话内容..."
        />
      </div>
    </div>
  )
})

LabelInputRenderer.displayName = 'LabelInputRenderer'
