import type { Editor } from '@tiptap/core'
import type { ReactNode } from 'react'

/**
 * 描述一个触发入口（例如 /、@、:）
 */
export interface SuggestionTriggerOptions {
  /** 触发器 ID，例如 slash、mention、emoji */
  id: string
  /** 实际触发字符，例如 /、@、:，后续可扩展为多字符 */
  character: string
  /** query 最小长度，未满足时不请求数据源 */
  minQueryLength?: number
  /** 选中某项后是否删除触发字符及其后续 query 文本 */
  deleteTriggerCharacterOnSelect?: boolean
  /** 是否允许通过编程方式打开（不通过键盘输入） */
  allowProgrammaticOpen?: boolean
}

/**
 * 插件层维护的 Suggestion 状态
 */
export interface SuggestionState {
  /** 是否有激活的 Suggestion 菜单 */
  active: boolean
  /** 当前触发器 ID */
  triggerId: string | null
  /** 实际识别到的触发字符 */
  triggerCharacter: string | null
  /** 触发字符之后到光标之间的文本 */
  query: string
  /** query 起始位置（通常为触发字符后的位置） */
  queryStartPos: number | null
  /** 用于浮层定位的 DOMRect（由 Decoration / DOM 计算） */
  referenceRect: DOMRect | null
  /** 是否忽略 query 长度限制（例如 emoji 面板允许空 query） */
  ignoreQueryLength: boolean
  /** 内部使用的装饰标识，用于查找 DOM 节点 */
  decorationId: string | null
  /** 是否在选择后删除触发字符（内部标记） */
  deleteTriggerCharacter: boolean
}

/**
 * 逻辑层菜单项定义（与 UI 解耦）
 */
export interface SuggestionItem {
  /** 唯一标识 */
  id: string
  /** 主标题，例如 Heading 1 */
  title: string
  /** 副标题，例如 大标题 */
  subtitle?: string
  /** 搜索别名 */
  aliases?: string[]
  /** 图标组件，直接渲染 */
  icon?: ReactNode
  /** 分组名称，例如 Text、Media */
  group?: string
  /** 额外元信息（如 block 类型、图标 key 等） */
  meta?: Record<string, unknown>
  /**
   * 选中该项时执行的操作
   * 所有对文档的修改都应通过该回调完成
   */
  onSelect: (editor: Editor, context: SuggestionItemContext) => void | Promise<void>
}

/**
 * 传递给 SuggestionItem.onSelect 的上下文信息
 */
export interface SuggestionItemContext {
  /** 当前 trigger ID */
  triggerId: string
  /** 当前 query 文本 */
  query: string
  /** query 起始位置 */
  queryStartPos: number | null
}

/**
 * 数据源输入参数
 */
export interface SuggestionSourceParams {
  /** 触发器 ID */
  triggerId: string
  /** 当前 query 文本 */
  query: string
  /** 编辑器上下文，可按需扩展（选区、块信息等） */
  editor: Editor
}

/**
 * Suggestion 数据源接口
 * 可对应本地 Slash 菜单、本地 emoji、远程搜索、AI 等不同实现
 */
export interface SuggestionSource {
  id: string
  fetchItems: (params: SuggestionSourceParams) => Promise<SuggestionItem[]>
}

/**
 * 插件暴露给外部（React 层等）的 API
 */
export interface SuggestionPluginAPI {
  /** 注册一个触发器 */
  addTrigger: (trigger: SuggestionTriggerOptions) => void
  /** 移除一个触发器 */
  removeTrigger: (triggerId: string) => void
  /**
   * 编程式打开菜单
   * @param triggerId 触发器 ID
   * @param options 选项
   */
  open: (
    triggerId: string,
    options?: {
      ignoreQueryLength?: boolean
      deleteTriggerCharacter?: boolean
    }
  ) => void
  /** 关闭菜单 */
  close: () => void
  /**
   * 清理 query 区域（删除触发字符 + query 文本）
   */
  clearQuery: () => void
  /** 获取当前 Suggestion 状态 */
  getState: () => SuggestionState
  /**
   * 订阅状态变化
   * 返回取消订阅函数
   */
  subscribe: (listener: (state: SuggestionState) => void) => () => void
}


