'use client'

import type { EditorProps } from './types'
import { memo, useEffect, useRef, useState } from 'react'
import { AI } from 'tiptap-ai'

import { useAutoSave, useIsBreakpoint, useWindowSize } from 'tiptap-api/react'
import { CommentMark, CommentStore } from 'tiptap-comment'
import { BlockId } from 'tiptap-diff'
import { TiptapEditor, useDefaultEditor, useMobileView } from 'tiptap-editor-core'
import { MermaidNode } from 'tiptap-mermaid'
import { CtxRefNode, HtmlCommentNode, ImageUploadNode, SpeakerNode } from 'tiptap-nodes'

import { RegionEdit } from 'tiptap-region'
import { leafTextFromRenderText, Search } from 'tiptap-search'
import { SuggestionTrigger } from 'tiptap-trigger'
import { handleImageUpload, MAX_FILE_SIZE } from 'tiptap-utils'
import content from './data/content.json' with { type: 'json' }
import { EditorUI } from './editor-ui'
import { REGION_LOADING_FRAME_CLASSES } from './region-loading-frame'

/**
 * 演示版编辑器：集成所有 UI 能力，适合快速体验
 * 若需自定义组合，请直接使用 TiptapEditor + 各 UI 组件自行拼装
 */
export const Editor = memo<EditorProps>(({
  initialMarkdown,
  readonly = false,
}) => {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const { mobileView, setMobileView } = useMobileView(isMobile)

  const toolbarRef = useRef<HTMLDivElement>(null)
  const [commentStore] = useState(() => new CommentStore())

  const { debouncedSave, content: savedContent } = useAutoSave({ storageKey: 'tiptap-editor-content' })
  const data = initialMarkdown || content || savedContent || ''
  const contentType = typeof data === 'string'
    ? 'markdown'
    : 'json'

  const editor = useDefaultEditor({
    /** 编辑器初始内容（从 JSON 文件导入或 Markdown 字符串） */
    content: data || '',
    /** 明确告诉 Tiptap 当前内容类型，Markdown 字符串会被正确解析 */
    contentType,
    /** 是否可编辑：只读模式下为 false */
    editable: !readonly,
    onUpdate(props) {
      debouncedSave(props.editor)
    },
    extensions: [
      /** AI 预览装饰扩展 */
      AI.configure(),
      /** 区域编辑（hash 锚点协议）装饰扩展 */
      RegionEdit.configure({ loadingFrameClasses: REGION_LOADING_FRAME_CLASSES }),
      /** Headless 文本搜索；高亮样式由宿主通过 Tailwind 类控制 */
      Search.configure({
        matchClass: 'text-brand',
        currentMatchClass: 'bg-brand !text-white',
        /** 让 speaker 等原子节点的展示文本（renderText）也能被 Cmd+F 搜到 */
        leafText: leafTextFromRenderText,
      }),
      /**
       * 说话人标签（示例原子节点）：演示「atom ⇄ renderText ⇄ 搜索」
       * speaker:1/2 已给名字，speaker:3 留空以展示 i18n 缺省名随语言切换刷新
       */
      SpeakerNode.configure({
        speakerMap: {
          1: { name: '张三' },
          2: { name: '李四' },
        },
        onClick: attrs => console.warn('[speaker] clicked:', attrs),
      }),
      /**
       * 上下文引用锚点（示例原子节点）：演示「HTML comment marker ⇄ atom ⇄ 无损往返」
       * 点击小圆点，控制台会打印 refType/refId 与紧邻的加粗斜体句
       */
      CtxRefNode.configure({
        onClick: payload => console.warn('[ctx-ref] clicked:', payload),
      }),
      /**
       * 注释兜底节点：把「非」ctx-ref 的行内 <!--...--> 也吞成不可见 atom，
       * 否则通用 HTML 解析会产出非法 doc、后续 transaction 崩文档（与 ctx-ref 配套）
       */
      HtmlCommentNode.configure(),
      /** 块级 id-diff 同步：给顶层块挂稳定 id（块同步测试面板依赖它） */
      BlockId.configure(),
      /** Slash / Suggestion 扩展 */
      SuggestionTrigger.configure(),
      /** Mermaid 图表节点扩展 */
      MermaidNode.configure(),
      /** 图片上传节点扩展 */
      ImageUploadNode.configure({
        /** 仅接受图片文件 */
        accept: 'image/*',
        /** 最大文件大小限制 */
        maxSize: MAX_FILE_SIZE,
        /** 最多上传 3 个文件 */
        limit: 3,
        /** 上传处理函数 */
        upload: handleImageUpload,
        /** 上传失败时的错误处理 */
        onError: error => console.error('Upload failed:', error),
      }),
      /** 评论系统扩展（包含 Mark 和 Plugin） */
      CommentMark.configure(),
    ],
  })

  useEffect(() => {
    if (!editor || !data) {
      return
    }
    editor.commands.setContent(
      data,
      { contentType },
    )
  }, [editor, data, contentType])

  /** 动态切换只读状态 */
  useEffect(() => {
    if (!editor) {
      return
    }
    editor.setEditable(!readonly)
  }, [editor, readonly])

  /**
   * DEV 调试：把 editor 实例暴露到 window.__editor
   * 便于在控制台手动跑 markdown 往返（getMarkdown → setMarkdown）验证序列化幂等性
   */
  useEffect(() => {
    if (!import.meta.env.DEV || !editor) {
      return
    }
    ;(window as any).__editor = editor
    return () => {
      if ((window as any).__editor === editor) {
        delete (window as any).__editor
      }
    }
  }, [editor])

  return (
    <TiptapEditor
      editor={ editor }
      className="max-w-3xl mx-auto p-10"
    >
      <EditorUI
        isMobile={ isMobile }
        height={ height }
        mobileView={ mobileView }
        setMobileView={ setMobileView }
        commentStore={ commentStore }
        toolbarRef={ toolbarRef }
        readonly={ readonly }
        showHeaderToolbar
      />
    </TiptapEditor>
  )
})

Editor.displayName = 'Editor'
