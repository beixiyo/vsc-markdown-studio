'use client'

import type { EditorProps } from './types'
import { isStr } from '@jl-org/tool'
import { memo, useEffect, useRef, useState } from 'react'
import { AI } from 'tiptap-ai'

import { useAutoSave, useIsBreakpoint, useWindowSize } from 'tiptap-api/react'
import { CommentMark, CommentStore } from 'tiptap-comment'
import { TiptapEditor, useDefaultEditor, useMobileView } from 'tiptap-editor-core'
import { MermaidNode } from 'tiptap-mermaid'

import { HorizontalRule, ImageUploadNode, preprocessSpeakerTags, SpeakerNode } from 'tiptap-nodes'
import { SuggestionTrigger } from 'tiptap-trigger'
import { handleImageUpload, MAX_FILE_SIZE } from 'tiptap-utils'
import content from './data/content.json' with { type: 'json' }
import { EditorUI } from './editor-ui'

/**
 * 演示版编辑器：集成所有 UI 能力，适合快速体验
 * 若需自定义组合，请直接使用 TiptapEditor + 各 UI 组件自行拼装
 */
export const Editor = memo<EditorProps>(({
  initialMarkdown,
  speakerMap,
  onSpeakerClick,
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
      AI,
      /** 自定义水平线节点 */
      HorizontalRule,
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
      CommentMark,
      /** Speaker 自定义节点：解析 [speaker:X]，附带 data-speaker-* 属性 */
      SpeakerNode.configure({
        className: 'font-semibold cursor-pointer',
        speakerMap: speakerMap || {},
        onClick: onSpeakerClick,
      }),
    ],
  })

  useEffect(() => {
    if (!editor || !data) {
      return
    }
    editor.commands.setContent(
      isStr(data)
        ? preprocessSpeakerTags(data)
        : data,
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
      />
    </TiptapEditor>
  )
})

Editor.displayName = 'Editor'
