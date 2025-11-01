import type { Block, BlockNoteEditor, PartialBlock } from '@blocknote/core'

export type AnyBlock = Block<any, any, any>

/**
 * 通用的 BlockNote 编辑器操作项
 * 仅依赖 BlockNoteEditor，不依赖任何外部项目工具与状态
 */
export type MarkdownOperateOptions = {
  /**
   * 默认设置光标位置
   * @default 'end'
   */
  defaultCursorPlacement?: 'start' | 'end'
}

/**
 * 通用的 BlockNote 操作接口
 * 所有方法均为同步委托或轻薄封装，方便 tree-shaking
 */
export type MarkdownOperate = {
  // ======================
  // * 内容管理
  // ======================
  getDocument: () => AnyBlock[]
  setContent: (blocks: PartialBlock<any, any, any>[]) => void
  getHTML: () => string
  setHTML: (html: string) => void
  getMarkdown: (blocks?: PartialBlock<any, any, any>[]) => string
  setMarkdown: (markdown: string) => void

  // ======================
  // * 块操作
  // ======================
  insertBlocks: (blocks: Block[], referenceBlockId: string, placement?: 'before' | 'after') => ReturnType<BlockNoteEditor['insertBlocks']>
  updateBlock: (blockId: string, update: Partial<Block>) => ReturnType<BlockNoteEditor['updateBlock']>
  removeBlocks: (blockIds: string[]) => ReturnType<BlockNoteEditor['removeBlocks']>
  replaceBlocks: (blockIdsToRemove: string[], blocksToInsert: Block[]) => ReturnType<BlockNoteEditor['replaceBlocks']>

  // ======================
  // * 文本
  // ======================
  getSelectedText: () => ReturnType<BlockNoteEditor['getSelectedText']>
  insertText: (text: string) => void

  // ======================
  // * 样式
  // ======================
  addStyles: (styles: Record<string, any>) => void
  removeStyles: (styles: Record<string, any>) => void
  toggleStyles: (styles: Record<string, any>) => void
  getActiveStyles: () => ReturnType<BlockNoteEditor['getActiveStyles']>

  // ======================
  // * 链接
  // ======================
  createLink: (url: string, text?: string) => void
  getSelectedLinkUrl: () => ReturnType<BlockNoteEditor['getSelectedLinkUrl']>

  // ======================
  // * 选择与光标
  // ======================
  getTextCursorPosition: () => ReturnType<BlockNoteEditor['getTextCursorPosition']>
  setTextCursorPosition: (blockId: string, placement?: 'start' | 'end') => void
  getSelection: () => ReturnType<BlockNoteEditor['getSelection']>
  setSelection: (startBlockId: string, endBlockId: string) => void

  // ======================
  // * 编辑器状态
  // ======================
  focus: () => void
  isEditable: () => boolean
  setEditable: (editable: boolean) => void
  isEmpty: () => boolean

  // ======================
  // * 历史
  // ======================
  undo: () => ReturnType<BlockNoteEditor['undo']>
  redo: () => ReturnType<BlockNoteEditor['redo']>

  // ======================
  // * 嵌套与移动
  // ======================
  canNestBlock: () => ReturnType<BlockNoteEditor['canNestBlock']>
  nestBlock: () => void
  canUnnestBlock: () => ReturnType<BlockNoteEditor['canUnnestBlock']>
  unnestBlock: () => void
  moveBlocksUp: () => void
  moveBlocksDown: () => void
}
