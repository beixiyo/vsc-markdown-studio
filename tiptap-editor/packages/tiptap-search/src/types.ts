/** 文本搜索的单个匹配范围 */
export interface SearchMatch {
  from: number
  to: number
}

/** 搜索插件的公开状态 */
export interface SearchState {
  query: string
  caseSensitive: boolean
  matches: SearchMatch[]
  currentIndex: number
}

/** 搜索扩展配置 */
export interface SearchOptions {
  /** 普通匹配项的 Decoration class
   * @default ''
   */
  matchClass: string
  /** 当前匹配项追加的 Decoration class
   * @default ''
   */
  currentMatchClass: string
  /** 跳转结果时的滚动行为
   * @default 'smooth'
   */
  scrollBehavior: ScrollBehavior
  /** 当前结果在可视区域中的位置
   * @default 'center'
   */
  scrollBlock: ScrollLogicalPosition
}
