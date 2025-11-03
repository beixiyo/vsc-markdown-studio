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

/**
 * 上级标题信息
 * 描述某个块向上最近的标题块及其元信息
 */
export type ParentHeadingInfo = {
  /** 标题块对象 */
  block: AnyBlock
  /** 标题级别，范围 1-6 */
  level: number
  /** 该标题的纯文本内容 */
  text: string
  /** 标题在文档中的索引位置 */
  index: number
}

/**
 * 文档分组区间（以标题为边界）
 */
export type DocSection = {
  /** 该区间的标题块，如果文档开头不是标题则为 null */
  heading: AnyBlock | null
  /** 属于该区间的连续内容块 */
  blocks: AnyBlock[]
  /** 区间的起始块 */
  startBlock: AnyBlock | null
  /** 区间的结束块 */
  endBlock: AnyBlock | null
}
