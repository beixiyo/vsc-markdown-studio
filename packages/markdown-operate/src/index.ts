import type { Block, BlockNoteEditor, PartialBlock } from '@blocknote/core'
import type { MarkdownOperateOptions, MarkdownOperate } from './types'
export type { MarkdownOperateOptions, MarkdownOperate, AnyBlock } from './types'

/**
 * 创建通用的 BlockNote 操作对象
 * 仅封装 editor 的常用能力，适合在多项目中复用
 */
export function createMarkdownOperate(
  editor: BlockNoteEditor<any, any, any>,
  options: MarkdownOperateOptions = {},
): MarkdownOperate {
  const { defaultCursorPlacement = 'end' } = options

  const res: MarkdownOperate = {
    // ======================
    // 内容管理
    // ======================
    getDocument: () => editor.document,
    setContent: (blocks: PartialBlock<any, any, any>[]) => {
      const currentIds = editor.document.map(b => b.id)
      editor.replaceBlocks(currentIds, blocks)
    },
    getHTML: () => editor.blocksToHTMLLossy(),
    setHTML: (html: string) => {
      const blocks = editor.tryParseHTMLToBlocks(html)
      const currentIds = editor.document.map(b => b.id)
      editor.replaceBlocks(currentIds, blocks as unknown as Block[])
    },
    getMarkdown: (blocks?: PartialBlock<any, any, any>[]) => {
      const source = blocks && blocks.length > 0
        ? blocks
        : editor.document
      return editor.blocksToMarkdownLossy(source)
    },
    setMarkdown: (markdown: string) => {
      const blocks = editor.tryParseMarkdownToBlocks(markdown)
      const currentIds = editor.document.map(b => b.id)
      editor.replaceBlocks(currentIds, blocks as unknown as Block[])
    },

    // ======================
    // 块操作
    // ======================
    insertBlocks: (blocks: Block[], referenceBlockId: string, placement: 'before' | 'after' = 'after') => {
      return editor.insertBlocks(blocks, referenceBlockId, placement)
    },
    updateBlock: (blockId: string, update: Partial<Block>) => {
      return editor.updateBlock(blockId, update)
    },
    removeBlocks: (blockIds: string[]) => {
      return editor.removeBlocks(blockIds)
    },
    replaceBlocks: (blockIdsToRemove: string[], blocksToInsert: Block[]) => {
      return editor.replaceBlocks(blockIdsToRemove, blocksToInsert)
    },

    // ======================
    // 文本
    // ======================
    getSelectedText: () => editor.getSelectedText(),
    insertText: (text: string) => {
      editor.insertInlineContent(text)
    },

    // ======================
    // 样式
    // ======================
    addStyles: (styles: Record<string, any>) => editor.addStyles(styles),
    removeStyles: (styles: Record<string, any>) => editor.removeStyles(styles),
    toggleStyles: (styles: Record<string, any>) => editor.toggleStyles(styles),
    getActiveStyles: () => editor.getActiveStyles(),

    // ======================
    // 链接
    // ======================
    createLink: (url: string, text?: string) => editor.createLink(url, text),
    getSelectedLinkUrl: () => editor.getSelectedLinkUrl(),

    // ======================
    // 选择与光标
    // ======================
    getTextCursorPosition: () => editor.getTextCursorPosition(),
    setTextCursorPosition: (blockId: string, placement: 'start' | 'end' = defaultCursorPlacement) => {
      editor.setTextCursorPosition(blockId, placement)
    },
    getSelection: () => editor.getSelection(),
    setSelection: (startBlockId: string, endBlockId: string) => {
      editor.setSelection(startBlockId, endBlockId)
    },

    // ======================
    // 编辑器状态
    // ======================
    focus: () => editor.focus(),
    isEditable: () => editor.isEditable,
    setEditable: (editable: boolean) => {
      editor.isEditable = editable
    },
    isEmpty: () => editor.isEmpty,

    // ======================
    // 历史
    // ======================
    undo: () => editor.undo(),
    redo: () => editor.redo(),

    // ======================
    // 嵌套与移动
    // ======================
    canNestBlock: () => editor.canNestBlock(),
    nestBlock: () => editor.nestBlock(),
    canUnnestBlock: () => editor.canUnnestBlock(),
    unnestBlock: () => editor.unnestBlock(),
    moveBlocksUp: () => editor.moveBlocksUp(),
    moveBlocksDown: () => editor.moveBlocksDown(),
  }

  return res
}


