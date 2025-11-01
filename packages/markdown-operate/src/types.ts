import type { Block } from '@blocknote/core'

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
