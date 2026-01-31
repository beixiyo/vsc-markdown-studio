import type { EditorUIProps } from './types'
import { useCurrentEditor } from '@tiptap/react'

import { Button, Toolbar } from 'comps'
import { memo, useState } from 'react'
import { AIActionPanel, AIButton } from 'tiptap-ai/react'
import { unSelect } from 'tiptap-api'
import { CommentButton, CommentSidebar, InlineCommentPopover, useCommentSync, useInlineCommentPopover } from 'tiptap-comment/react'
import { LinkPopover, MarkButton, SelectToolbar } from 'tiptap-comps'

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
  readonly = false,
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
      { !readonly && (
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
          <Toolbar.Group>
            <OperateTestDropdownMenu
              suites={ operateTestSuites }
              portal={ isMobile }
              onRunAll={ runAllOperateTests }
              onRunSuite={ runOperateSuite }
              running={ operateRunning }
              disabled={ !editor }
            />
            <Button
              size="sm"
              onClick={ () => {
                if (editor) {
                  const markdown = `\`\`\`mermaid
sequenceDiagram
    Alice->>Bob: Hello Bob!
    Bob-->>Alice: Hello Alice!
    Alice->>Bob: How are you?
    Bob-->>Alice: I'm fine, thanks!
\`\`\``
                  editor.commands.setContent(markdown, { contentType: 'markdown' })
                  unSelect(editor)
                }
              } }
              disabled={ !editor }
              title="插入 Mermaid 时序图"
            >
              Mermaid
            </Button>
            <SelectionTestButton />
            <ScrollTestButton />
          </Toolbar.Group>
        </BaseEditorUI>
      ) }

      {/* 测试 HoverTooltip */ }
      <EditorHoverTooltip editor={ editor } enabled={ false } />

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
                link: false,
                underline: false,
                superscript: false,
                subscript: false,
                image: false,
              } }
              moreContent={ [
                {
                  value: 'link',
                  label: (
                    <LinkPopover
                      editor={ editor }
                      showLabel
                      showTooltip={ false }
                      hideWhenUnavailable
                      className="hover:bg-transparent"
                      labelClassName="ml-4 text-base text-textSecondary"
                    />
                  ),
                },
                {
                  value: 'strike',
                  label: (
                    <MarkButton
                      type="strike"
                      showLabel
                      showTooltip={ false }
                      hideWhenUnavailable
                      className="hover:bg-transparent"
                      labelClassName="ml-4 text-base text-textSecondary"
                    />
                  ),
                },
                {
                  value: 'underline',
                  label: (
                    <MarkButton
                      type="underline"
                      showLabel
                      showTooltip={ false }
                      hideWhenUnavailable
                      className="hover:bg-transparent"
                      labelClassName="ml-4 text-base text-textSecondary"
                    />
                  ),
                },
                {
                  value: 'superscript',
                  label: (
                    <MarkButton
                      type="superscript"
                      showLabel
                      showTooltip={ false }
                      hideWhenUnavailable
                      className="hover:bg-transparent"
                      labelClassName="ml-4 text-base text-textSecondary"
                    />
                  ),
                },
                {
                  value: 'subscript',
                  label: (
                    <MarkButton
                      type="subscript"
                      showLabel
                      showTooltip={ false }
                      hideWhenUnavailable
                      className="hover:bg-transparent"
                      labelClassName="ml-4 text-base text-textSecondary"
                    />
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

          {/* Slash Suggestion 菜单 */ }
          <SuggestionMenu
            { ...suggestion }
            onActiveIndexChange={ suggestion.setActiveIndex }
            onSelect={ suggestion.selectItem }
          />

          {/* AI 操作面板 */ }
          <AIActionPanel editor={ editor } controller={ aiController } className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50" />
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
