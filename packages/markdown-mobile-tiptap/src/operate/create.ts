import type { Editor } from '@tiptap/core'
import type { GradientStyleType } from 'tiptap-nodes/gradient-highlight'
import { createMarkdownOperate } from 'tiptap-api'
import { isGradientType } from 'tiptap-nodes/gradient-highlight'

/** BlockNote 风格的 style key → Tiptap mark 名映射（只处理真正能落到 mark 的 key） */
const STYLE_KEY_TO_MARK: Record<string, string> = {
  bold: 'bold',
  italic: 'italic',
  underline: 'underline',
  strike: 'strike',
  strikethrough: 'strike',
  code: 'code',
  highlight: 'highlight',
  subscript: 'subscript',
  superscript: 'superscript',
  /** 渐变也借道 highlight mark，实现见 GradientHighlight */
  gradient: 'highlight',
}

/** 光标位置返回类型 */
export type TextCursorPosition = {
  /** ProseMirror 文档位置 */
  pos: number
  /** 选区起点 */
  from: number
  /** 选区终点（若为光标则 === from） */
  to: number
  /** 当前所在块的节点类型名（paragraph / heading / bulletList ...） */
  nodeType: string
  /** Native 约定的块类型字符串（h1 / paragraph / unordered_list ...） */
  blockType: string
  /** 标题级别，仅 heading 块有值 */
  level?: number
}

/**
 * 将 BlockNote 风格的 `{ key: value }` 展开为一组 `(markName, attrs)` 对
 * - `{ bold: true }` → `('bold', undefined)`
 * - `{ gradient: 'mysticPurpleBlue' }` → `('highlight', { color: 'mysticPurpleBlue' })`
 */
function expandStyles(styles: Record<string, any>): Array<[string, Record<string, any> | undefined]> {
  const result: Array<[string, Record<string, any> | undefined]> = []
  for (const [key, value] of Object.entries(styles || {})) {
    const mark = STYLE_KEY_TO_MARK[key]
    if (!mark)
      continue
    if (key === 'gradient' && typeof value === 'string' && isGradientType(value)) {
      result.push([mark, { color: value }])
    }
    else if (key === 'highlight' && typeof value === 'string' && value) {
      result.push([mark, { color: value }])
    }
    else {
      result.push([mark, undefined])
    }
  }
  return result
}

/** 已知的内联 mark 名称集合，用于 getActiveStyles 聚合 */
const INLINE_MARKS = ['bold', 'italic', 'underline', 'strike', 'code', 'highlight', 'subscript', 'superscript', 'link'] as const

/** 当前光标所在块类型 → Native 约定字符串 */
export function resolveBlockTypeString(editor: Editor): string {
  const { $from } = editor.state.selection
  const node = $from.parent
  const typeName = node.type.name

  if (typeName === 'heading') {
    const level = node.attrs?.level ?? 1
    return `h${level}`
  }

  const map: Record<string, string> = {
    bulletList: 'unordered_list',
    orderedList: 'ordered_list',
    taskList: 'check_list',
    listItem: 'unordered_list',
    taskItem: 'check_list',
    codeBlock: 'code',
    blockquote: 'blockquote',
    paragraph: 'paragraph',
  }

  /** 对 list item 的父节点做二次判定 */
  if (typeName === 'listItem' || typeName === 'taskItem' || typeName === 'paragraph') {
    for (let depth = $from.depth; depth >= 0; depth--) {
      const name = $from.node(depth).type.name
      if (name === 'bulletList')
        return 'unordered_list'
      if (name === 'orderedList')
        return 'ordered_list'
      if (name === 'taskList')
        return 'check_list'
    }
  }

  return map[typeName] ?? typeName
}

/**
 * 基于 tiptap-api 的 createMarkdownOperate 构建 mobile 操作集
 *
 * 复用 tiptap-api 的通用能力（文本、选区、链接、状态、历史、格式化命令），
 * 仅扩展 mobile 特有的方法（样式批量操作、列表嵌套、块类型、事件订阅、渐变等）
 */
export function createTiptapOperate(editor: Editor) {
  const base = createMarkdownOperate(editor)

  return {
    ...base,

    // ====== 内容：覆盖返回类型（mobile 不返回 null） ======
    getJSON: () => editor.getJSON(),
    getHTML: () => editor.getHTML(),
    getMarkdown: (): string => base.getMarkdown() ?? editor.getHTML(),
    setHTML: (html: string) => {
      editor.commands.setContent(html, { contentType: 'html' })
    },
    setMarkdown: (markdown: string) => {
      editor.commands.setContent(markdown, { contentType: 'markdown' })
    },

    // ====== 样式（Mobile 独有） ======
    getActiveStyles: (): Record<string, boolean | string> => {
      const active: Record<string, boolean | string> = {}
      for (const name of INLINE_MARKS) {
        if (editor.isActive(name))
          active[name] = true
      }
      if (active.highlight) {
        const { color } = editor.getAttributes('highlight') ?? {}
        if (typeof color === 'string' && isGradientType(color)) {
          active.gradient = color
          delete active.highlight
        }
      }
      return active
    },

    toggleStyles: (styles: Record<string, any>) => {
      const chain = editor.chain().focus()
      for (const [mark, attrs] of expandStyles(styles)) {
        chain.toggleMark(mark, attrs)
      }
      chain.run()
    },

    removeStyles: (styles: Record<string, any>) => {
      const chain = editor.chain().focus()
      for (const [mark] of expandStyles(styles)) {
        chain.unsetMark(mark)
      }
      chain.run()
    },

    addStyles: (styles: Record<string, any>) => {
      const chain = editor.chain().focus()
      for (const [mark, attrs] of expandStyles(styles)) {
        chain.setMark(mark, attrs)
      }
      chain.run()
    },

    // ====== 光标（覆盖：mobile 返回丰富对象） ======
    getTextCursorPosition: (): TextCursorPosition => {
      const { from, to, $from } = editor.state.selection
      const parent = $from.parent
      return {
        pos: from,
        from,
        to,
        nodeType: parent.type.name,
        blockType: resolveBlockTypeString(editor),
        level: parent.type.name === 'heading'
          ? (parent.attrs?.level as number | undefined)
          : undefined,
      }
    },

    // ====== 事件订阅（Mobile 独有） ======
    onUpdate: (cb: () => void) => {
      editor.on('update', cb)
      return () => editor.off('update', cb)
    },

    // ====== 链接（覆盖：mobile 用结构化 content 插入文本链接） ======
    createLink: (url: string, text?: string) => {
      if (text) {
        editor.chain().focus().insertContent({
          type: 'text',
          text,
          marks: [{ type: 'link', attrs: { href: url } }],
        }).run()
        return
      }
      editor.chain().focus().extendMarkRange('link').setMark('link', { href: url }).run()
    },

    // ====== 列表嵌套（Mobile 独有） ======
    canNestBlock: () => editor.can().sinkListItem('listItem') || editor.can().sinkListItem('taskItem'),
    nestBlock: () => {
      if (editor.can().sinkListItem('listItem'))
        editor.chain().focus().sinkListItem('listItem').run()
      else if (editor.can().sinkListItem('taskItem'))
        editor.chain().focus().sinkListItem('taskItem').run()
    },
    canUnnestBlock: () => editor.can().liftListItem('listItem') || editor.can().liftListItem('taskItem'),
    unnestBlock: () => {
      if (editor.can().liftListItem('listItem'))
        editor.chain().focus().liftListItem('listItem').run()
      else if (editor.can().liftListItem('taskItem'))
        editor.chain().focus().liftListItem('taskItem').run()
    },

    // ====== 块类型（Mobile 独有） ======
    getBlockTypeString: () => resolveBlockTypeString(editor),

    // ====== 格式化命令：复用 base + mobile 扩展 ======
    command: {
      ...base.command,
      toggleBold: () => { editor.chain().focus().toggleMark('bold').run() },
      toggleItalic: () => { editor.chain().focus().toggleMark('italic').run() },
      toggleUnderline: () => { editor.chain().focus().toggleMark('underline').run() },

      setGradient: (type: GradientStyleType) => {
        editor.chain().focus().setMark('highlight', { color: type }).run()
      },
      unsetGradient: () => {
        editor.chain().focus().unsetMark('highlight').run()
      },
    },
  }
}

export type TiptapOperate = ReturnType<typeof createTiptapOperate>
