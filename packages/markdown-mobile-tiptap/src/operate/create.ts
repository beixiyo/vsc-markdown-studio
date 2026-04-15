import type { Editor } from '@tiptap/core'
import type { GradientStyleType } from 'tiptap-nodes/gradient-highlight'
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
 * 基于 tiptap 的编辑器操作集合
 * 与老版 BlockNote `createMarkdownOperate` 在"无 blockId 语义"的方法上保持兼容
 */
export function createTiptapOperate(editor: Editor) {
  return {
    // ======================
    /** 内容 */
    // ======================
    getJSON: () => editor.getJSON(),
    getHTML: () => editor.getHTML(),
    setHTML: (html: string) => {
      editor.commands.setContent(html, { contentType: 'html' })
    },
    getMarkdown: (): string => {
      const storage = (editor.storage as any)?.markdown
      if (storage && typeof storage.getMarkdown === 'function') {
        return storage.getMarkdown()
      }
      /** 降级：HTML；单元测试环境可能无 markdown 存储 */
      return editor.getHTML()
    },
    setMarkdown: (markdown: string) => {
      editor.commands.setContent(markdown, { contentType: 'markdown' })
    },

    // ======================
    /** 文本 / 选区 */
    // ======================
    getSelectedText: () => {
      const { from, to } = editor.state.selection
      if (from === to)
        return ''
      return editor.state.doc.textBetween(from, to, '\n')
    },
    insertText: (text: string) => {
      editor.commands.insertContent(text)
    },

    // ======================
    /** 样式 */
    // ======================
    getActiveStyles: (): Record<string, boolean | string> => {
      const active: Record<string, boolean | string> = {}
      for (const name of INLINE_MARKS) {
        if (editor.isActive(name))
          active[name] = true
      }
      /** 把 highlight 的 color 展开：普通色仍记 highlight，渐变 key 额外记 gradient */
      if (active.highlight) {
        const { color } = editor.getAttributes('highlight') ?? {}
        if (typeof color === 'string' && isGradientType(color)) {
          active.gradient = color
          delete active.highlight
        }
      }
      return active
    },

    /**
     * 批量切换 mark
     * @param styles 形如 `{ bold: true, italic: true }` 或 `{ gradient: 'mysticPurpleBlue' }`
     */
    toggleStyles: (styles: Record<string, any>) => {
      const chain = editor.chain().focus()
      for (const [mark, attrs] of expandStyles(styles)) {
        chain.toggleMark(mark, attrs)
      }
      chain.run()
    },
    /**
     * 批量移除 mark
     */
    removeStyles: (styles: Record<string, any>) => {
      const chain = editor.chain().focus()
      for (const [mark] of expandStyles(styles)) {
        chain.unsetMark(mark)
      }
      chain.run()
    },
    /**
     * 批量应用 mark（已激活则保持激活）
     */
    addStyles: (styles: Record<string, any>) => {
      const chain = editor.chain().focus()
      for (const [mark, attrs] of expandStyles(styles)) {
        chain.setMark(mark, attrs)
      }
      chain.run()
    },

    /**
     * 获取文本光标位置 + 所在块信息
     * Tiptap 以 ProseMirror 位置（数字）为主，没有稳定 blockId
     */
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

    /**
     * 订阅内容更新
     * @returns 退订函数
     */
    onUpdate: (cb: () => void) => {
      editor.on('update', cb)
      return () => editor.off('update', cb)
    },

    // ======================
    /** 链接 */
    // ======================
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
    getSelectedLinkUrl: (): string | null => {
      const attrs = editor.getAttributes('link')
      return (attrs?.href as string | undefined) ?? null
    },

    // ======================
    /** 编辑器状态 */
    // ======================
    focus: () => editor.commands.focus(),
    isEditable: () => editor.isEditable,
    setEditable: (editable: boolean) => editor.setEditable(editable),
    isEmpty: () => editor.isEmpty,

    // ======================
    /** 历史 */
    // ======================
    undo: () => editor.commands.undo(),
    redo: () => editor.commands.redo(),

    // ======================
    /** 列表嵌套（仅 list/task item 有效） */
    // ======================
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

    // ======================
    /** 块类型 */
    // ======================
    getBlockTypeString: () => resolveBlockTypeString(editor),

    // ======================
    /** 格式化命令 */
    // ======================
    command: {
      setHeading: (level: 1 | 2 | 3) => {
        editor.chain().focus().setHeading({ level }).run()
      },
      setParagraph: () => {
        editor.chain().focus().setParagraph().run()
      },
      setOrderedList: () => {
        editor.chain().focus().toggleOrderedList().run()
      },
      setUnorderedList: () => {
        editor.chain().focus().toggleBulletList().run()
      },
      setCheckList: () => {
        editor.chain().focus().toggleTaskList().run()
      },
      setBold: () => { editor.chain().focus().setMark('bold').run() },
      unsetBold: () => { editor.chain().focus().unsetMark('bold').run() },
      setItalic: () => { editor.chain().focus().setMark('italic').run() },
      unsetItalic: () => { editor.chain().focus().unsetMark('italic').run() },
      setUnderline: () => { editor.chain().focus().setMark('underline').run() },
      unsetUnderline: () => { editor.chain().focus().unsetMark('underline').run() },
      toggleBold: () => { editor.chain().focus().toggleMark('bold').run() },
      toggleItalic: () => { editor.chain().focus().toggleMark('italic').run() },
      toggleUnderline: () => { editor.chain().focus().toggleMark('underline').run() },

      /**
       * 设置渐变：借道 @tiptap/extension-highlight
       * 写入 `mark[data-color="<type>"]`，再由 CSS 渲染渐变文字
       */
      setGradient: (type: GradientStyleType) => {
        editor.chain().focus().setMark('highlight', { color: type }).run()
      },
      /** 移除渐变（实际移除 highlight 标记） */
      unsetGradient: () => {
        editor.chain().focus().unsetMark('highlight').run()
      },
    },
  }
}

export type TiptapOperate = ReturnType<typeof createTiptapOperate>
