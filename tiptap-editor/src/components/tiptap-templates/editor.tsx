"use client"

import { memo, useEffect, useRef, useState } from 'react'
import { EditorContent, EditorContext } from '@tiptap/react'

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
import { useAiQuickSource, useSlashSuggestion } from './hooks/suggestion-hooks'
import { useAiSetup, useBindAi } from './hooks/ai-hooks'
import { useOperateTests } from './hooks/use-operate-tests'
import { useMobileView } from './hooks/use-mobile-view'
import type { EditorProps } from './types'
import {
  operateTestSuites,
} from '@/features/operate-tests'
import { useDefaultEditor } from './hooks/use-default-editor'


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
  const { aiOrchestrator, aiController } = useAiSetup()

  const { debouncedSave, markdown } = useAutoSave({ storageKey: 'tiptap-editor-content' })
  const data = initialMarkdown || content || markdown || ''
  const contentType = typeof data === 'string'
    ? 'markdown'
    : 'json'

  const editor = useDefaultEditor({
    speakerMap,
    onSpeakerClick,
    // 编辑器初始内容（从 JSON 文件导入或 Markdown 字符串）
    content: data,
    // 明确告诉 Tiptap 当前内容类型，Markdown 字符串会被正确解析
    contentType,
    // 监听编辑器内容更新，自动保存到 localStorage
    onUpdate: ({ editor }) => {
      debouncedSave(editor)
    },
  })

  const aiQuickSource = useAiQuickSource(editor, aiController)
  const suggestion = useSlashSuggestion(editor, aiQuickSource)

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  // 启用评论同步，检测评论范围状态
  useCommentSync(editor, commentStore, {
    enabled: true,
    syncOnUndoRedo: true,
    debounceMs: 100,
  })

  // 绑定 AI 集成
  useBindAi(editor, aiController, aiOrchestrator)

  useEffect(() => {
    if (!editor || !initialMarkdown) {
      return
    }
    editor.commands.setContent(
      initialMarkdown,
      { contentType: 'markdown' }
    )
  }, [editor, initialMarkdown])

  const {
    operateRunning,
    runAllOperateTests,
    runOperateSuite,
  } = useOperateTests(editor, operateTestSuites)


  return (
    <EditorContext.Provider value={ { editor } }>
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

      <EditorContent
        editor={ editor }
        role="presentation"
        className="max-w-3xl mx-auto"
      />

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
    </EditorContext.Provider>
  )
})

Editor.displayName = 'Editor'