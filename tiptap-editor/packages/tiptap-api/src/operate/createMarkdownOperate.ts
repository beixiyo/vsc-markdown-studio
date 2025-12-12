import type { Content, Editor } from '@tiptap/core'
import { getEditorHTML, getEditorMarkdown, setEditorContent, setEditorHTML, setEditorMarkdown } from './content'
import { setCheckList, setBold, setHeading, setItalic, setOrderedList, setParagraph, setUnderline, setUnorderedList, unsetBold, unsetItalic, unsetUnderline } from './command'
import { getSelectedLinkUrl, createLink } from './link'
import { getSelectionRange, getSelectedText, setSelectionRange } from './selection'
import { getTextCursorPosition, setTextCursorPosition } from './cursor'
import { redo, undo } from './history'
import { focusEditor, isEditable, isEmptyDoc, setEditableState } from './state'
import { insertText } from './text'

export type MarkdownOperate = ReturnType<typeof createMarkdownOperate>

/**
 * 创建通用操作对象
 * 仅封装 editor 的常用能力，适合在多项目中复用
 */
export function createMarkdownOperate(editor: Editor | null) {
  return {
    // ======================
    /** 内容管理 */
    // ======================
    /**
     * 设置文档内容
     */
    setContent: (content: Content, emitUpdate?: boolean) => setEditorContent(editor, content, emitUpdate),
    /**
     * 获取 HTML 格式内容
     */
    getHTML: () => getEditorHTML(editor),
    /**
     * 设置 HTML 格式内容
     * @param html HTML 字符串
     */
    setHTML: (html: string, emitUpdate?: boolean) => setEditorHTML(editor, html, emitUpdate),
    /**
     * 获取 Markdown 格式内容
     */
    getMarkdown: () => getEditorMarkdown(editor),
    /**
     * 设置 Markdown 格式内容
     * @param markdown Markdown 字符串
     */
    setMarkdown: (markdown: string, emitUpdate?: boolean) => setEditorMarkdown(editor, markdown, emitUpdate),

    // ======================
    /** 文本 */
    // ======================
    /**
     * 获取选中的文本
     */
    getSelectedText: () => getSelectedText(editor),
    /**
     * 插入文本
     * @param text 要插入的文本
     */
    insertText: (text: string) => insertText(editor, text),

    // ======================
    /** 链接 */
    // ======================
    /**
     * 创建链接
     * @param url 链接 URL
     * @param text 可选的链接文本
     */
    createLink: (url: string, text?: string) => createLink(editor, url, text),
    /**
     * 获取选中的链接 URL
     */
    getSelectedLinkUrl: () => getSelectedLinkUrl(editor),

    // ======================
    /** 选择与光标 */
    // ======================
    /**
     * 获取文本光标位置
     */
    getTextCursorPosition: () => getTextCursorPosition(editor),
    /**
     * 设置文本光标位置
     */
    setTextCursorPosition: (pos: number) => setTextCursorPosition(editor, pos),
    /**
     * 获取选区
     */
    getSelection: () => getSelectionRange(editor),
    /**
     * 设置选区
     */
    setSelection: (from: number, to: number) => setSelectionRange(editor, from, to),

    // ======================
    /** 编辑器状态 */
    // ======================
    /**
     * 聚焦编辑器
     */
    focus: () => focusEditor(editor),
    /**
     * 获取是否可编辑
     */
    isEditable: () => isEditable(editor),
    /**
     * 设置是否可编辑
     * @param editable 是否可编辑
     */
    setEditable: (editable: boolean) => setEditableState(editor, editable),
    /**
     * 判断是否为空
     */
    isEmpty: () => isEmptyDoc(editor),

    // ======================
    /** 历史 */
    // ======================
    /**
     * 撤销
     */
    undo: () => undo(editor),
    /**
     * 重做
     */
    redo: () => redo(editor),

    // ======================
    /** 格式化命令 */
    // ======================
    command: {
      /**
       * 将当前块设置为标题
       * @param level 标题级别 (1-3)
       */
      setHeading: (level: 1 | 2 | 3) => setHeading(editor, level),

      /**
       * 将当前块设置为段落
       */
      setParagraph: () => setParagraph(editor),

      /**
       * 将当前块设置为有序列表项
       */
      setOrderedList: () => setOrderedList(editor),

      /**
       * 将当前块设置为无序列表项
       */
      setUnorderedList: () => setUnorderedList(editor),

      /**
       * 设置选中文本为粗体
       */
      setBold: () => setBold(editor),

      /**
       * 取消选中文本的粗体
       */
      unsetBold: () => unsetBold(editor),

      /**
       * 设置选中文本为斜体
       */
      setItalic: () => setItalic(editor),

      /**
       * 取消选中文本的斜体
       */
      unsetItalic: () => unsetItalic(editor),

      /**
       * 设置选中文本为下划线
       */
      setUnderline: () => setUnderline(editor),

      /**
       * 取消选中文本的下划线
       */
      unsetUnderline: () => unsetUnderline(editor),

      /**
       * 将当前块设置为检查列表项
       */
      setCheckList: () => setCheckList(editor),
    },
  }
}

export type MarkdownOperateType = ReturnType<typeof createMarkdownOperate>
