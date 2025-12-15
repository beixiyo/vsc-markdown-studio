import type { EditorUIProps } from './types'
import { useCurrentEditor } from '@tiptap/react'

import { memo, useState } from 'react'
import { AIActionPanel, AIButton } from 'tiptap-ai/react'
import { CommentButton, CommentItem, CommentSidebar, useCommentSync, useInlineCommentPopover } from 'tiptap-comment/react'
import { LinkPopover, SelectionToolbar, ToolbarGroup } from 'tiptap-comps'
import { CloseIcon } from 'tiptap-comps/icons'
import { SuggestionMenu } from 'tiptap-trigger/react'

import { EditorHoverTooltip } from '@/components/my-ui/hover-tooltip'
import { OperateTestDropdownMenu } from '@/components/my-ui/operate-test-dropdown-menu'
import { ScrollTestButton } from '@/components/my-ui/scroll-test-button'
import { SelectionTestButton } from '@/components/my-ui/selection-test-button'
import { operateTestSuites } from '@/features/operate-tests'

import { useOperateTests } from '../features/operate-tests/use-operate-tests'
import { BaseEditorUI } from './base-editor-ui'
import { useAiQuickSource, useAiSetup, useBindAi, useSlashSuggestion } from './hooks'

/**
 * 演示用编辑器 UI：使用通用的 BaseEditorUI，通过 children 传递额外的插件功能
 */
export const EditorUI = memo<EditorUIProps>(({
  isMobile,
  height,
  mobileView,
  setMobileView,
  commentStore,
  toolbarRef,
}) => {
  const { editor } = useCurrentEditor()
  const { aiOrchestrator, aiController } = useAiSetup()
  const [commentSidebarOpen, setCommentSidebarOpen] = useState(false)
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)

  const {
    operateRunning,
    runAllOperateTests,
    runOperateSuite,
  } = useOperateTests(editor || null, operateTestSuites)

  const aiQuickSource = useAiQuickSource(editor, aiController)
  const suggestion = useSlashSuggestion(editor, aiQuickSource)

  /** 启用评论同步，检测评论范围状态 */
  useCommentSync(editor, commentStore, {
    enabled: true,
    syncOnUndoRedo: true,
    debounceMs: 100,
  })

  /** 绑定 AI 集成 */
  useBindAi(editor, aiController, aiOrchestrator)

  const {
    inlineComment,
    inlineThread,
    inlineCommentRect,
    closeInlineComment,
  } = useInlineCommentPopover({
    editor,
    commentStore,
    onInlineOpen: (commentId) => {
      setActiveCommentId(commentId)
      setCommentSidebarOpen(false)
    },
    onInlineClose: () => {
      setActiveCommentId(null)
    },
  })

  return (
    <>
      <BaseEditorUI
        isMobile={ isMobile }
        height={ height }
        mobileView={ mobileView }
        setMobileView={ setMobileView }
        toolbarRef={ toolbarRef }
      >
        <ToolbarGroup>
          { commentStore && (
            <CommentSidebar
              commentStore={ commentStore }
              editor={ editor }
              open={ commentSidebarOpen }
              onOpenChange={ (openPanel) => {
                setCommentSidebarOpen(openPanel)
                if (!openPanel) {
                  setActiveCommentId(null)
                  closeInlineComment()
                }
              } }
              activeCommentId={ activeCommentId ?? undefined }
            />
          ) }
        </ToolbarGroup>
        <ToolbarGroup>
          <OperateTestDropdownMenu
            suites={ operateTestSuites }
            portal={ isMobile }
            onRunAll={ runAllOperateTests }
            onRunSuite={ runOperateSuite }
            running={ operateRunning }
            disabled={ !editor }
          />
          <SelectionTestButton />
          <ScrollTestButton />
        </ToolbarGroup>
      </BaseEditorUI>

      {/* 测试 HoverTooltip */ }
      <EditorHoverTooltip editor={ editor } enabled={ false } />

      {/* 选中文本工具栏 */ }
      <SelectionToolbar editor={ editor } enabled>
        <LinkPopover editor={ editor } hideWhenUnavailable />
        <AIButton
          controller={ aiController }
          orchestrator={ aiOrchestrator }
          mode="stream"
          hideWhenUnavailable
        />
        <CommentButton commentStore={ commentStore } />
      </SelectionToolbar>

      {/* Slash Suggestion 菜单 */ }
      <SuggestionMenu
        { ...suggestion }
        onActiveIndexChange={ suggestion.setActiveIndex }
        onSelect={ suggestion.selectItem }
        onClose={ suggestion.close }
      />

      {/* AI 操作面板 */ }
      <AIActionPanel controller={ aiController } className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50" />

      { inlineComment && inlineCommentRect && typeof window !== 'undefined' && (
        <div
          className="fixed z-[1000] max-w-[360px]"
          style={ {
            left: Math.min(
              Math.max(12, inlineCommentRect.left),
              Math.max(12, window.innerWidth - 360),
            ),
            top: Math.min(
              inlineCommentRect.bottom + 8,
              window.innerHeight - 12,
            ),
          } }
        >
          <div className="rounded-2xl border border-[var(--tt-border-color)] bg-[var(--tt-card-bg-color)] shadow-[var(--tt-shadow-elevated-lg)]">
            <div className="flex items-center justify-between border-b border-[var(--tt-border-color)] px-3 py-2 text-xs text-[var(--tt-color-text-gray)]">
              <span>当前评论</span>
              <button
                type="button"
                onClick={ () => {
                  closeInlineComment()
                } }
                aria-label="关闭当前评论"
                className="flex size-6 items-center justify-center text-[var(--tt-color-text-gray)] transition hover:bg-[var(--tt-border-color-tint)] rounded-xl"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 space-y-3">
              { inlineThread.map(comment => (
                <CommentItem
                  key={ comment.id }
                  comment={ comment }
                  editor={ editor }
                  commentStore={ commentStore }
                  onUpdate={ () => {} }
                  isActive={ comment.id === inlineComment.id }
                />
              )) }
            </div>
          </div>
        </div>
      ) }
    </>
  )
})

EditorUI.displayName = 'EditorUI'
