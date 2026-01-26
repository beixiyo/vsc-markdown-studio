'use client'

import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import { memo, useCallback } from 'react'
import { Button } from 'tiptap-comps'
import { CheckIcon, EditIcon, XIcon } from 'tiptap-comps/icons'
import { cn } from 'utils'
import { useMermaidEditor } from './hooks/use-mermaid-editor'
import { useMermaidRenderer } from './hooks/use-mermaid-renderer'
import { useMermaidTransform } from './hooks/use-mermaid-transform'

export const MermaidNodeComponent = memo<NodeViewProps>(({ node, selected, updateAttributes, editor }) => {
  const code = node.attrs.code || ''
  const x = node.attrs.x ?? 0
  const y = node.attrs.y ?? 0
  const scale = node.attrs.scale ?? 1

  const {
    isEditing,
    editCode,
    textareaRef,
    handleEdit,
    handleSave,
    handleCancel,
    handleKeyDown,
    setEditCode,
  } = useMermaidEditor({
    code,
    updateAttributes,
  })

  /** 使用渲染 Hook（仅在非编辑模式下渲染） */
  const {
    renderContainerRef,
    isRendering,
    error,
    retryRender,
  } = useMermaidRenderer({
    code,
    node,
    isEditing,
  })

  /** 处理变换更新 */
  const handleTransformChange = useCallback((newX: number, newY: number, newScale: number) => {
    updateAttributes({
      x: newX,
      y: newY,
      scale: newScale,
    })
  }, [updateAttributes])

  /** 使用变换 Hook（拖拽和缩放） */
  const {
    containerRef,
    isDragging,
    handleMouseDown,
    transform,
  } = useMermaidTransform({
    x,
    y,
    scale,
    onTransformChange: handleTransformChange,
    enabled: !isEditing && !!code,
  })

  return (
    <NodeViewWrapper
      className={ cn('mermaid-node-wrapper overflow-hidden', selected && 'selected') }
      data-mermaid="true"
    >
      <div
        ref={ containerRef }
        className={ cn(
          'mermaid-container min-h-[100px] p-4 relative rounded-lg',
          'bg-backgroundSecondary',
          'transition-colors',
          selected
            ? 'border border-brand'
            : 'border border-border',
          !isEditing && !!code && 'cursor-move',
          isDragging && 'cursor-grabbing',
        ) }
        onMouseDown={ handleMouseDown }
        data-editing={ isEditing }
      >
        {/** 编辑按钮工具栏 */ }
        { !isEditing && editor?.isEditable && (
          <div className="absolute top-2 right-2 flex gap-1 z-10" data-no-drag>
            <Button
              type="button"
              onClick={ handleEdit }
              tooltip="编辑 Mermaid 代码"
              className="p-1.5"
              data-style="ghost"
            >
              <EditIcon className="w-4 h-4" />
            </Button>
          </div>
        ) }

        { isEditing
          ? (
              <div className="flex flex-col gap-2">
                <textarea
                  ref={ textareaRef }
                  value={ editCode }
                  onChange={ e => setEditCode(e.target.value) }
                  onKeyDown={ handleKeyDown }
                  placeholder="请输入 Mermaid 代码..."
                  className={ cn(
                    'w-full min-h-[200px] p-3',
                    'border border-border',
                    'rounded-lg',
                    'font-mono text-sm leading-normal resize-none',
                    'bg-background',
                    'text-textPrimary',
                    'transition-colors',
                    'placeholder:text-textDisabled',
                    'focus:border-brand',
                  ) }
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    onClick={ handleCancel }
                    data-style="ghost"
                    className="flex items-center gap-1.5"
                  >
                    <XIcon className="w-4 h-4" />
                    取消
                  </Button>
                  <Button
                    type="button"
                    onClick={ handleSave }
                    data-appearance="emphasized"
                    className="flex items-center gap-1.5"
                  >
                    <CheckIcon className="w-4 h-4" />
                    保存
                  </Button>
                </div>
              </div>
            )
          : (
              <>
                { isRendering && (
                  <div className="text-center text-[var(--tt-gray-light-500)] dark:text-[var(--tt-gray-dark-500)]">
                    正在渲染图表...
                  </div>
                ) }
                { error && (
                  <div
                    className={ cn(
                      'p-3 rounded-[var(--tt-radius-xs)]',
                      'bg-[var(--tt-color-red-inc-5)] dark:bg-[var(--tt-color-red-dec-5)]',
                      'border border-[var(--tt-color-red-inc-2)] dark:border-[var(--tt-color-red-dec-3)]',
                      'text-[var(--tt-color-red-dec-3)] dark:text-[var(--tt-color-red-inc-2)]',
                    ) }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <strong>渲染错误：</strong>
                        { error }
                      </div>
                      <Button
                        type="button"
                        onClick={ retryRender }
                        data-style="ghost"
                        className="text-xs px-2 py-1"
                      >
                        重试
                      </Button>
                    </div>
                  </div>
                ) }
                { !code && (
                  <div
                    onClick={ editor?.isEditable
                      ? handleEdit
                      : undefined }
                    className={ cn(
                      'text-center text-[var(--tt-gray-light-400)] dark:text-[var(--tt-gray-dark-400)] py-5',
                      editor?.isEditable && 'cursor-pointer hover:text-[var(--tt-gray-light-500)] dark:hover:text-[var(--tt-gray-dark-500)] transition-colors',
                    ) }
                  >
                    请输入 Mermaid 代码
                  </div>
                ) }
                {/** 专门用于渲染 Mermaid SVG 的容器，与 React 管理的 UI 分离 */ }
                <div
                  ref={ renderContainerRef }
                  style={ {
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                    transformOrigin: '0 0',
                    transition: isDragging
                      ? 'none'
                      : 'transform 0.1s ease-out',
                  } }
                />
              </>
            ) }
      </div>
    </NodeViewWrapper>
  )
})
