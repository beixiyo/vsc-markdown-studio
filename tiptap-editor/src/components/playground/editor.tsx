"use client"

import { memo, useRef, useState } from 'react'
import { useCurrentEditor } from '@tiptap/react'

// --- UI Primitives ---
import { Toolbar } from 'tiptap-styles/ui'

// --- Tiptap UI ---
import { LinkPopover } from '@/components/tiptap-ui/link-popover'
import { EditorHoverTooltip } from '@/components/my-ui/hover-tooltip'
import { CommentButton } from 'tiptap-comment/react'
import { AIButton } from 'tiptap-ai/react'
import { AIActionPanel } from 'tiptap-ai/react'

// --- Hooks ---
import { useIsBreakpoint } from '@/hooks/use-is-breakpoint'
import { useWindowSize } from '@/hooks/use-window-size'
import { useCursorVisibility } from '@/hooks/use-cursor-visibility'
import { useCommentSync } from 'tiptap-comment/react'

// --- Components ---
import { SelectionToolbar } from 'tiptap-comps'
import { SuggestionMenu } from 'tiptap-trigger/react'

// --- API ---
import { CommentStore } from 'tiptap-comment'

import content from './data/content.json' with { type: 'json' }
import { useAutoSave } from 'tiptap-react-hook'
import { HeaderToolbar } from './header-toolbar'
import { MobileToolbarContent } from './toolbar-mobile-content'
import { useOperateTests } from './hooks/use-operate-tests'
import { useMobileView } from './hooks/use-mobile-view'
import { useAiQuickSource, useSlashSuggestion } from './hooks/suggestion-hooks'
import { useAiSetup, useBindAi } from './hooks/ai-hooks'
import type { EditorProps } from './types'
import {
  operateTestSuites,
} from '@/features/operate-tests'
import { TiptapEditor } from './tiptap-editor'

/**
 * 内部组件：使用 EditorContext 获取 editor 实例，渲染所有 UI 组件
 */
const EditorUI = memo<{
  isMobile: boolean
  height: number
  mobileView: 'main' | 'highlighter' | 'link'
  setMobileView: (view: 'main' | 'highlighter' | 'link') => void
  commentStore: CommentStore
  toolbarRef: React.RefObject<HTMLDivElement | null>
}>(({
  isMobile,
  height,
  mobileView,
  setMobileView,
  commentStore,
  toolbarRef,
}) => {
  const { editor } = useCurrentEditor()
  const { aiOrchestrator, aiController } = useAiSetup()

  const rect = useCursorVisibility({
    editor: editor || null,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  const {
    operateRunning,
    runAllOperateTests,
    runOperateSuite,
  } = useOperateTests(editor || null, operateTestSuites)

  const aiQuickSource = useAiQuickSource(editor, aiController)
  const suggestion = useSlashSuggestion(editor, aiQuickSource)

  // 启用评论同步，检测评论范围状态
  useCommentSync(editor, commentStore, {
    enabled: true,
    syncOnUndoRedo: true,
    debounceMs: 100,
  })

  // 绑定 AI 集成
  useBindAi(editor, aiController, aiOrchestrator)

  return (
    <>
      <Toolbar
        ref={ toolbarRef }
        style={ {
          ...(isMobile
            ? {
              bottom: `calc(100% - ${height - rect.y}px)`,
            }
            : {}),
        } }
      >
        { mobileView === "main" ? (
          <HeaderToolbar
            onHighlighterClick={ () => setMobileView("highlighter") }
            onLinkClick={ () => setMobileView("link") }
            isMobile={ isMobile }
            commentStore={ commentStore }
            operateSuites={ operateTestSuites }
            onRunAllOperateTests={ runAllOperateTests }
            onRunOperateSuite={ runOperateSuite }
            operateTestsRunning={ operateRunning }
            operateTestsDisabled={ !editor }
          />
        ) : (
          <MobileToolbarContent
            type={ mobileView === "highlighter" ? "highlighter" : "link" }
            onBack={ () => setMobileView("main") }
          />
        ) }
      </Toolbar>

      {/* 测试通用 HoverTooltip */ }
      <EditorHoverTooltip editor={ editor } enabled={ false } />

      {/* 选中文本工具栏 */ }
      <SelectionToolbar editor={ editor } enabled={ true }>
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
      <AIActionPanel controller={ aiController } className='fixed bottom-4 left-1/2 -translate-x-1/2 z-50' />
    </>
  )
})

EditorUI.displayName = 'EditorUI'

export const Editor = memo<EditorProps>(({
  initialMarkdown,
  speakerMap,
  onSpeakerClick,
}) => {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const { mobileView, setMobileView } = useMobileView(isMobile)

  const toolbarRef = useRef<HTMLDivElement>(null)
  const [commentStore] = useState(() => new CommentStore())

  const { debouncedSave, markdown } = useAutoSave({ storageKey: 'tiptap-editor-content' })
  const data = initialMarkdown || content || markdown || ''

  return (
    <TiptapEditor
      data={ data }
      speakerMap={ speakerMap }
      onSpeakerClick={ onSpeakerClick }
      className="max-w-3xl mx-auto"
      onUpdate={ ({ editor }) => {
        debouncedSave(editor)
      } }
    >
      <EditorUI
        isMobile={ isMobile }
        height={ height }
        mobileView={ mobileView }
        setMobileView={ setMobileView }
        commentStore={ commentStore }
        toolbarRef={ toolbarRef }
      />
    </TiptapEditor>
  )
})

Editor.displayName = 'Editor'