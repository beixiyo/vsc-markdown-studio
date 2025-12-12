import { Highlight } from '@tiptap/extension-highlight'
import { Image } from '@tiptap/extension-image'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import Placeholder from '@tiptap/extension-placeholder'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { TextAlign } from '@tiptap/extension-text-align'
import { Typography } from '@tiptap/extension-typography'
import { Selection } from '@tiptap/extensions'
import { Markdown } from '@tiptap/markdown'
import { StarterKit } from '@tiptap/starter-kit'
import { AI } from 'tiptap-ai'

import { CommentMark } from 'tiptap-comment'
import { type SpeakerAttributes, type SpeakerMapValue, SpeakerNode } from 'tiptap-speaker-node'
import { HorizontalRule, ImageUploadNode } from 'tiptap-styles/tiptap-node'
import {
  handleImageUpload,
  MAX_FILE_SIZE,
} from 'tiptap-styles/utils'
import { SuggestionTrigger } from 'tiptap-trigger'

import 'tiptap-comment/index.css'
import 'tiptap-trigger/index.css'

export function createExtensions(options: ExtensionsOptions) {
  const { speakerMap, onSpeakerClick } = options
  return [
    // StarterKit：Tiptap 的基础扩展包，包含常用功能
    StarterKit.configure({
      /** 禁用内置的水平线扩展，使用自定义的 HorizontalRule */
      horizontalRule: false,
      /** 链接扩展配置 */
      link: {
        /** 点击链接自动打开 */
        openOnClick: false,
        /** 允许点击选中链接文本 */
        enableClickSelection: true,
      },
    }),
    /** 自定义水平线节点 */
    HorizontalRule,
    // Markdown 扩展：支持 Markdown 输入和复制粘贴转换
    Markdown.configure({
      /** 缩进配置：列表与代码块的缩进风格 */
      indentation: {
        /** 使用空格缩进（可选值：'space' | 'tab'） */
        style: 'space',
        /** 每级缩进 2 个空格 */
        size: 2,
      },
      /** 启用 GFM，表格、任务列表等语法可用 */
      markedOptions: {
        gfm: true,
        /** 单行换行直接渲染为 <br /> */
        breaks: true,
        /**
         * 如需智能排版（引号、破折号替换），可在支持时启用 smartypants: true
         * 更接近原始 Markdown 行为（与 GFM 同时开启时，GFM 规则优先）
         */
        pedantic: true,
      },
    }),
    /** 文本对齐扩展：仅对标题和段落生效 */
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    /** 任务列表扩展 */
    TaskList,
    /** 任务项扩展：支持嵌套任务 */
    TaskItem.configure({ nested: true }),
    /** 高亮扩展：支持多种颜色高亮 */
    Highlight.configure({ multicolor: true }),
    /** 图片节点扩展 */
    Image,
    /** 排版扩展：自动转换标点符号（如 -- 转换为 —） */
    Typography,
    /** 上标扩展 */
    Superscript,
    /** 下标扩展 */
    Subscript,
    /** 选择扩展：增强选择功能 */
    Selection,
    // AI 预览装饰扩展
    AI,
    // Placeholder 扩展：为空节点显示占位符
    Placeholder.configure({
      placeholder: ({ node }) => {
        /** 根据节点类型返回不同的占位符文本 */
        if (node.type.name === 'heading') {
          const level = node.attrs.level
          return level === 1
            ? '输入标题 1…'
            : level === 2
              ? '输入标题 2…'
              : level === 3
                ? '输入标题 3…'
                : '输入标题…'
        }
        if (node.type.name === 'blockquote') {
          return '输入引用内容…'
        }
        if (node.type.name === 'codeBlock') {
          return '输入代码…'
        }
        /** 默认占位符（段落等） */
        return '输入内容，或输入 / 查看命令…'
      },
      emptyEditorClass: 'is-editor-empty',
      emptyNodeClass: 'is-empty',
    }),
    // Slash / Suggestion 扩展
    SuggestionTrigger.configure(),
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
    // Speaker 自定义节点：解析 [speaker:X]，附带 data-speaker-* 属性
    SpeakerNode.configure({
      className: 'font-semibold cursor-pointer',
      speakerMap: speakerMap || {},
      onClick: onSpeakerClick,
    }),
  ]
}

export type SpeakerMap = Record<string, SpeakerMapValue>
export type SpeakerClick = (attrs: SpeakerAttributes, event: MouseEvent) => void

export type ExtensionsOptions = {
  speakerMap?: SpeakerMap
  onSpeakerClick?: SpeakerClick
}
