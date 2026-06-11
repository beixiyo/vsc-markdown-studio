import type { EditorUIProps } from './types'
import { useCurrentEditor } from '@tiptap/react'

import { Toolbar } from 'comps'
import { useLatestCallback } from 'hooks'
import { memo, useState } from 'react'
import { AIActionPanel, AIButton, useAI } from 'tiptap-ai/react'
import { CommentButton, CommentSidebar, InlineCommentPopover, useCommentSync, useInlineCommentPopover } from 'tiptap-comment/react'
import { BlockActionMenu, EditorLinkHover, MarkButton, SelectToolbar, TableControls } from 'tiptap-comps'
import { HoverTooltip } from 'tiptap-hover/react'
import { SuggestionMenu } from 'tiptap-trigger/react'
import { TestPanel } from '@/components/my-ui/test-panel'

import { operateTestSuites } from '@/features/operate-tests'
import { BaseEditorUI } from './base-editor-ui'
import { useAiQuickSource, useAiSetup, useBindAi, useGetContext, useSlashSuggestion } from './hooks'

/**
 * 演示用编辑器 UI：使用通用的 BaseEditorUI，通过 children 传递额外的插件功能
 * 测试功能统一收纳在右侧 TestPanel 抽屉中，顶部工具栏只保留标准能力
 */
export const EditorUI = memo<EditorUIProps>(({
  isMobile,
  height,
  mobileView,
  setMobileView,
  commentStore,
  toolbarRef,
  readonly = false,
  showHeaderToolbar = false,
}) => {
  const { editor } = useCurrentEditor()
  const { aiOrchestrator, aiController } = useAiSetup()
  const [commentSidebarOpen, setCommentSidebarOpen] = useState(false)
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)

  const aiQuickSource = useAiQuickSource(editor, aiController)
  const suggestion = useSlashSuggestion(editor, aiQuickSource, {
    slashExcludeIds: ['mermaid'], // 不显示 Mermaid 项；可改为 [] 显示全部，或从设置读取
  })

  /** 启用评论同步，检测评论范围状态 */
  useCommentSync(editor, commentStore, {
    enabled: true,
    syncOnUndoRedo: true,
    debounceMs: 100,
  })

  /** 绑定 AI 集成 */
  useBindAi(editor, aiController, aiOrchestrator)

  const getContext = useGetContext()

  const {
    canTrigger: canInsert,
    handleTrigger: handleInsertTrigger,
  } = useAI({
    editor,
    controller: aiController,
    mode: 'stream',
    allowInsert: true,
    getContext,
  })

  const handleAiInsert = useLatestCallback(() => {
    handleInsertTrigger('在光标处插入')
  })

  const {
    inlineComment,
    inlineThread,
    inlineCommentRect,
    inlineCommentRange,
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
      { !readonly && showHeaderToolbar && (
        <BaseEditorUI
          isMobile={ isMobile }
          height={ height }
          mobileView={ mobileView }
          setMobileView={ setMobileView }
          toolbarRef={ toolbarRef }
        >
          <Toolbar.Group>
            { commentStore && (
              <CommentSidebar
                commentStore={ commentStore }
                editor={ editor }
                open={ commentSidebarOpen }
                onOpenChange={ (openPanel) => {
                  setCommentSidebarOpen(openPanel)
                } }
                activeCommentId={ activeCommentId ?? undefined }
              />
            ) }
          </Toolbar.Group>
        </BaseEditorUI>
      ) }

      {/* 测试 HoverTooltip */ }
      <HoverTooltip editor={ editor } enabled />

      {/* 块级操作悬浮菜单 */ }
      <BlockActionMenu editor={ editor } enabled={ !readonly } />

      {/* 表格悬浮控制（行列添加/删除按钮） */ }
      <TableControls editor={ editor } enabled={ !readonly } />

      { !readonly && (
        <>
          {/* 选中文本工具栏 */ }
          <SelectToolbar editor={ editor } enabled>
            <SelectToolbar.ToolbarContent
              isMobile={ isMobile }
              config={ {
                undo: false,
                redo: false,
                code: false,
                codeBlock: false,
                strike: false,
                underline: false,
                superscript: false,
                subscript: false,
                image: false,
              } }
              moreContent={ [
                {
                  value: 'strike',
                  label: (
                    <SelectToolbar.MoreContentItem>
                      <MarkButton
                        type="strike"
                        hideWhenUnavailable
                      />
                    </SelectToolbar.MoreContentItem>
                  ),
                },
                {
                  value: 'underline',
                  label: (
                    <SelectToolbar.MoreContentItem>
                      <MarkButton
                        type="underline"
                        hideWhenUnavailable
                      />
                    </SelectToolbar.MoreContentItem>
                  ),
                },
                {
                  value: 'superscript',
                  label: (
                    <SelectToolbar.MoreContentItem>
                      <MarkButton
                        type="superscript"
                        hideWhenUnavailable
                      />
                    </SelectToolbar.MoreContentItem>
                  ),
                },
                {
                  value: 'subscript',
                  label: (
                    <SelectToolbar.MoreContentItem>
                      <MarkButton
                        type="subscript"
                        hideWhenUnavailable
                      />
                    </SelectToolbar.MoreContentItem>
                  ),
                },
              ] }
            >
              <AIButton
                controller={ aiController }
                orchestrator={ aiOrchestrator }
                mode="stream"
                hideWhenUnavailable
              />
              <CommentButton commentStore={ commentStore } />
            </SelectToolbar.ToolbarContent>
          </SelectToolbar>

          {/* 链接 Hover 编辑层 */ }
          <EditorLinkHover editor={ editor } />

          {/* Slash Suggestion 菜单 */ }
          <SuggestionMenu
            { ...suggestion }
            onActiveIndexChange={ suggestion.setActiveIndex }
            onSelect={ suggestion.selectItem }
          />

          {/* AI 操作面板 */ }
          <AIActionPanel editor={ editor } controller={ aiController } className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50" />

          {/* 测试面板：右侧抽屉，收纳全部测试功能 */ }
          <TestPanel
            editor={ editor }
            suites={ operateTestSuites }
            onAiInsert={ handleAiInsert }
            canAiInsert={ canInsert }
          />
        </>
      ) }

      { !readonly && (
        <InlineCommentPopover
          inlineComment={ inlineComment }
          inlineThread={ inlineThread }
          inlineCommentRect={ inlineCommentRect }
          inlineCommentRange={ inlineCommentRange }
          closeInlineComment={ closeInlineComment }
          editor={ editor }
          commentStore={ commentStore }
        />
      ) }
    </>
  )
})

EditorUI.displayName = 'EditorUI'
