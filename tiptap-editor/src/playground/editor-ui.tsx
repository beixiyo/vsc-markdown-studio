import type { EditorUIProps } from './types'
import { useCurrentEditor } from '@tiptap/react'

import { memo } from 'react'

import { AIActionPanel, AIButton } from 'tiptap-ai/react'
import { CommentButton, CommentSidebar, useCommentSync } from 'tiptap-comment/react'

import { LinkPopover, SelectionToolbar, ToolbarGroup } from 'tiptap-comps'
import { SuggestionMenu } from 'tiptap-trigger/react'

import { EditorHoverTooltip } from '@/components/my-ui/hover-tooltip'
import { OperateTestDropdownMenu } from '@/components/my-ui/operate-test-dropdown-menu'
import { ScrollTestButton } from '@/components/my-ui/scroll-test-button'
import { SelectionTestButton } from '@/components/my-ui/selection-test-button'

import { operateTestSuites } from '@/features/operate-tests'

import { EditorUI as BaseEditorUI } from '../editor/editor-ui'
import { useAiQuickSource, useAiSetup, useBindAi, useSlashSuggestion } from '../editor/hooks'
import { useOperateTests } from '../features/operate-tests/use-operate-tests'

import 'tiptap-comment/index.css'
import 'tiptap-trigger/index.css'

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
          { commentStore && <CommentSidebar commentStore={ commentStore } /> }
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
    </>
  )
})

EditorUI.displayName = 'EditorUI'
