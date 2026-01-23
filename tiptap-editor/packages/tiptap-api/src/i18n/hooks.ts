/**
 * Tiptap Editor i18n Hooks
 * 提供便捷的翻译函数，用于获取 tiptap-editor 相关的翻译文本
 */

import { useT } from 'i18n/react'

/**
 * Tiptap Editor 翻译资源类型
 */
export type TiptapEditorTranslations = {
  toolbar: {
    textFormat: string
    textAlign: string
  }
  history: {
    undo: string
    redo: string
  }
  heading: {
    heading: string
    heading1: string
    heading2: string
    heading3: string
    heading4: string
    heading5: string
    heading6: string
    paragraph: string
  }
  list: {
    bulletList: string
    orderedList: string
    taskList: string
  }
  mark: {
    bold: string
    italic: string
    strike: string
    code: string
    underline: string
    superscript: string
    subscript: string
  }
  align: {
    left: string
    center: string
    right: string
    justify: string
  }
  block: {
    blockquote: string
    codeBlock: string
  }
  image: {
    addImage: string
  }
  link: {
    link: string
  }
  comment: {
    commentPanel: string
    items: string
    all: string
    active: string
    resolved: string
    total: string
    empty: string
    viewComments: string
    closePanel: string
    showAll: string
    showActive: string
    showResolved: string
    user: string
    confirmDelete: string
    contentEmpty: string
    updateFailed: string
    updateStatusFailed: string
    createReplyFailed: string
    replyFailed: string
    locate: string
    edit: string
    reply: string
    markResolved: string
    reopen: string
    delete: string
    currentComment: string
    closeCurrent: string
    placeholder: string
    replyPlaceholder: string
    cancel: string
    save: string
    cancelTooltip: string
    saveTooltip: string
    replyTooltip: string
    loading: string
    loadFailed: string
    noMatch: string
    noItems: string
  }
  speaker: {
    speaker: string
  }
}

/**
 * 使用 Tiptap Editor 翻译的 Hook
 * 返回类型安全的翻译函数
 */
export function useTiptapEditorT() {
  return useT<TiptapEditorTranslations>()
}

/**
 * 获取评论相关标签
 */
export function useCommentLabels() {
  const t = useTiptapEditorT()
  return {
    commentPanel: t('comment.commentPanel'),
    items: t('comment.items'),
    all: t('comment.all'),
    active: t('comment.active'),
    resolved: t('comment.resolved'),
    total: (count: number) => t('comment.total', { count }),
    empty: t('comment.empty'),
    viewComments: t('comment.viewComments'),
    closePanel: t('comment.closePanel'),
    showAll: t('comment.showAll'),
    showActive: t('comment.showActive'),
    showResolved: t('comment.showResolved'),
    user: t('comment.user'),
    confirmDelete: (preview: string) => t('comment.confirmDelete', { preview }),
    contentEmpty: t('comment.contentEmpty'),
    updateFailed: t('comment.updateFailed'),
    updateStatusFailed: t('comment.updateStatusFailed'),
    createReplyFailed: t('comment.createReplyFailed'),
    replyFailed: t('comment.replyFailed'),
    locate: t('comment.locate'),
    edit: t('comment.edit'),
    reply: t('comment.reply'),
    markResolved: t('comment.markResolved'),
    reopen: t('comment.reopen'),
    delete: t('comment.delete'),
    currentComment: t('comment.currentComment'),
    closeCurrent: t('comment.closeCurrent'),
    placeholder: t('comment.placeholder'),
    replyPlaceholder: t('comment.replyPlaceholder'),
    cancel: t('comment.cancel'),
    save: t('comment.save'),
    cancelTooltip: t('comment.cancelTooltip'),
    saveTooltip: t('comment.saveTooltip'),
    replyTooltip: t('comment.replyTooltip'),
    loading: t('comment.loading'),
    loadFailed: t('comment.loadFailed'),
    noMatch: t('comment.noMatch'),
    noItems: t('comment.noItems'),
  }
}

/**
 * 获取历史操作标签
 */
export function useHistoryLabels() {
  const t = useTiptapEditorT()
  return {
    undo: t('history.undo'),
    redo: t('history.redo'),
  }
}

/**
 * 获取标题标签
 */
export function useHeadingLabels() {
  const t = useTiptapEditorT()
  return {
    heading: t('heading.heading'),
    heading1: t('heading.heading1'),
    heading2: t('heading.heading2'),
    heading3: t('heading.heading3'),
    heading4: t('heading.heading4'),
    heading5: t('heading.heading5'),
    heading6: t('heading.heading6'),
    paragraph: t('heading.paragraph'),
  }
}

/**
 * 获取列表标签
 */
export function useListLabels() {
  const t = useTiptapEditorT()
  return {
    bulletList: t('list.bulletList'),
    orderedList: t('list.orderedList'),
    taskList: t('list.taskList'),
  }
}

/**
 * 获取标记标签
 */
export function useMarkLabels() {
  const t = useTiptapEditorT()
  return {
    bold: t('mark.bold'),
    italic: t('mark.italic'),
    strike: t('mark.strike'),
    code: t('mark.code'),
    underline: t('mark.underline'),
    superscript: t('mark.superscript'),
    subscript: t('mark.subscript'),
  }
}

/**
 * 获取对齐标签
 */
export function useAlignLabels() {
  const t = useTiptapEditorT()
  return {
    left: t('align.left'),
    center: t('align.center'),
    right: t('align.right'),
    justify: t('align.justify'),
  }
}

/**
 * 获取块级元素标签
 */
export function useBlockLabels() {
  const t = useTiptapEditorT()
  return {
    blockquote: t('block.blockquote'),
    codeBlock: t('block.codeBlock'),
  }
}

/**
 * 获取工具栏标签
 */
export function useToolbarLabels() {
  const t = useTiptapEditorT()
  return {
    textFormat: t('toolbar.textFormat'),
    textAlign: t('toolbar.textAlign'),
  }
}

/**
 * 获取说话人标签
 */
export function useSpeakerLabels() {
  const t = useTiptapEditorT()
  return {
    speaker: (number: string | number) => t('speaker.speaker', { number }),
  }
}
