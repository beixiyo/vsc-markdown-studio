import type { Editor } from '@tiptap/core'
import type { GradientStyleType } from 'tiptap-nodes/gradient-highlight'

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
      editor.commands.setContent(html)
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
      editor.commands.setContent(markdown)
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
    getActiveStyles: (): Record<string, boolean> => {
      const active: Record<string, boolean> = {}
      for (const name of INLINE_MARKS) {
        if (editor.isActive(name))
          active[name] = true
      }
      return active
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
