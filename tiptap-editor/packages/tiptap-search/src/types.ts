import type { Node as PMNode } from '@tiptap/pm/model'

/** 文本搜索的单个匹配范围 */
export interface SearchMatch {
  from: number
  to: number
}

/**
 * 叶子节点展示文本解析器：决定一个无文本子节点的叶子（原子节点、hardBreak 等）
 * 以什么文本参与搜索匹配；返回空串 / null / undefined 表示不参与
 */
export type LeafTextResolver = (context: {
  /** 叶子节点本身 */
  node: PMNode
  /** 节点在文档中的绝对位置 */
  pos: number
  /** 父节点（文档顶层为 null） */
  parent: PMNode | null
  /** 在父节点中的下标 */
  index: number
}) => string | null | undefined

/** 搜索插件的公开状态 */
export interface SearchState {
  query: string
  caseSensitive: boolean
  matches: SearchMatch[]
  currentIndex: number
}

/** 搜索扩展配置 */
export interface SearchOptions {
  /**
   * 普通匹配项的 Decoration class
   * @default ''
   */
  matchClass: string
  /**
   * 当前匹配项追加的 Decoration class
   * @default ''
   */
  currentMatchClass: string
  /**
   * 跳转结果时的滚动行为
   * @default 'smooth'
   */
  scrollBehavior: ScrollBehavior
  /**
   * 当前结果在可视区域中的位置
   * @default 'center'
   */
  scrollBlock: ScrollLogicalPosition
  /**
   * 叶子节点展示文本解析器，让原子节点（如 speaker 芯片）的展示文本参与匹配；
   * 不传则叶子节点不参与匹配，本包不默认消费任何节点的数据。
   * 现成实现见 `leafTextFromRenderText`（读取节点 schema 的 spec.toText）
   * @default undefined
   */
  leafText?: LeafTextResolver
}
