'use client'

import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import { Button, Textarea } from 'comps'
import { memo, useCallback } from 'react'
import { useMermaidLabels } from 'tiptap-api/react'
import { CheckIcon, EditIcon, XIcon } from 'tiptap-comps/icons'
import { cn } from 'utils'
import { useMermaidEditor } from './hooks/use-mermaid-editor'
import { useMermaidRenderer } from './hooks/use-mermaid-renderer'
import { useMermaidTransform } from './hooks/use-mermaid-transform'

export const MermaidNodeComponent = memo<NodeViewProps>(({ node, selected, updateAttributes, editor }) => {
  const labels = useMermaidLabels()
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
          'bg-background2',
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
              tooltip={ labels.editCode }
              className="p-1.5"
              variant="ghost"
              size="sm"
            >
              <EditIcon className="w-4 h-4" />
            </Button>
          </div>
        ) }

        { isEditing
          ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  ref={ textareaRef }
                  value={ editCode }
                  onChange={ setEditCode }
                  onKeyDown={ handleKeyDown }
                  placeholder={ labels.placeholder }
                  containerClassName="w-full min-h-[200px]"
                  className="font-mono"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    onClick={ handleCancel }
                    variant="ghost"
                    size="sm"
                    leftIcon={ <XIcon className="w-4 h-4" /> }
                  >
                    { labels.cancel }
                  </Button>
                  <Button
                    type="button"
                    onClick={ handleSave }
                    variant="primary"
                    size="sm"
                    leftIcon={ <CheckIcon className="w-4 h-4" /> }
                  >
                    { labels.save }
                  </Button>
                </div>
              </div>
            )
          : (
              <>
                { isRendering && (
                  <div className="text-center text-text2">
                    { labels.rendering }
                  </div>
                ) }
                { error && (
                  <div
                    className={ cn(
                      'p-3 rounded-xl',
                      'bg-danger/10',
                      'border border-danger/20',
                      'text-danger',
                    ) }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm">
                        <strong>{ labels.renderError }</strong>
                        { error }
                      </div>
                      <Button
                        type="button"
                        onClick={ retryRender }
                        variant="ghost"
                        size="sm"
                        className="text-xs px-2"
                      >
                        { labels.retry }
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
                      'text-center text-text4 py-5',
                      editor?.isEditable && 'cursor-pointer hover:text-text2 transition-colors',
                    ) }
                  >
                    { labels.emptyHint }
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
