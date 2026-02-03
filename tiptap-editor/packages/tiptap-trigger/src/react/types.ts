import type { SuggestionItem, SuggestionSource } from '../types'

export type TriggerConfig = {
  /**
   * 触发字符，例如 /、@、:
   */
  character: string
  /**
   * 该 trigger 对应的数据源列表
   */
  sources: SuggestionSource[]
  /**
   * query 最小长度，未满足不触发请求
   */
  minQueryLength?: number
  /**
   * 选中后是否删除触发字符
   */
  deleteTriggerCharacterOnSelect?: boolean
  /**
   * 允许 ignoreQueryLength 打开（用于空 query 情况）
   */
  allowProgrammaticOpen?: boolean
  /**
   * 对数据源返回的 items 进行筛选/排序，用户可自定义过滤逻辑
   * @example
   * filterItems: (items) => items.filter(i => i.group !== 'hidden')
   * filterItems: (items) => items.slice(0, 10) // 限制数量
   */
  filterItems?: (items: SuggestionItem[]) => SuggestionItem[] | Promise<SuggestionItem[]>
}

export type SuggestionConfig = Record<string, TriggerConfig>

export type SuggestionResult = {
  open: boolean
  items: SuggestionItem[]
  loading: boolean
  error: Error | null
  triggerId: string | null
  query: string
  referenceRect: DOMRect | null
  activeIndex: number
  setActiveIndex: (index: number) => void
  selectItem: (index: number) => Promise<void>
  close: () => void
}
