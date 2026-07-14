import type { Editor } from '@tiptap/core'
import type { PopoverRef } from 'comps'

/** 搜索面板属性 */
export interface SearchPopoverProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 可选编辑器实例，默认读取 Tiptap context */
  editor?: Editor | null
  /**
   * 受控数据源；传入后不再驱动编辑器，由宿主负责找 / 跳 / 高亮
   *
   * 用于搜索对象不是 tiptap 文档的场景（如虚拟列表渲染的转写文本）
   */
  search?: SearchController
  /**
   * 覆盖默认触发按钮里的图标；只换图标，保留按钮本身的 tooltip / aria / 样式
   *
   * 若要整体替换触发器（连按钮一起），用 `children`
   *
   * @default <SearchIcon className="size-4" />
   */
  icon?: React.ReactNode
}

/**
 * 搜索面板的数据源契约
 *
 * 面板只渲染 `activeIndex + 1 / matchCount` 并把交互转发给这几个回调，
 * 「怎么找、怎么跳、怎么高亮」全由实现方决定
 */
export interface SearchController {
  /** 当前关键词 */
  query: string
  /** 命中总数 */
  matchCount: number
  /** 当前命中序号（0 起） */
  activeIndex: number
  onQueryChange: (value: string) => void
  /** 下一个命中（建议到尾循环回首） */
  onNext: () => void
  /** 上一个命中 */
  onPrevious: () => void
  /** 面板关闭：清关键词与高亮 */
  onClose: () => void
}

/** 搜索面板命令式控制接口，快捷键等打开方式由宿主决定 */
export type SearchPopoverRef = PopoverRef

/** 面板内的上一个 / 下一个 / 关闭按钮 */
export interface SearchControlButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
}
