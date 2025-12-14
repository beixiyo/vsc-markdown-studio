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

export function createExtensions() {
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

    /** Markdown 扩展：支持 Markdown 输入和复制粘贴转换 */
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
    /** Placeholder 扩展：为空节点显示占位符 */
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
  ]
}
