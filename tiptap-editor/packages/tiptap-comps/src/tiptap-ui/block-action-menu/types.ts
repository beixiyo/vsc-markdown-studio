import type { ResolvedPos } from '@tiptap/pm/model'
import type { Editor } from '@tiptap/react'

/** `shouldShow` 判断时接收的上下文，提供编辑器和命中的块位置信息 */
export interface BlockActionShouldShowContext {
  editor: Editor
  /** 即将展示菜单的块节点位置（相对于文档） */
  pos: number
  /** 已解析的位置，便于沿祖先链访问节点（如检查是否在 table 内） */
  $pos: ResolvedPos
}

/** 判断是否应当为当前位置展示菜单；返回 false 则抑制 */
export type BlockActionShouldShow = (ctx: BlockActionShouldShowContext) => boolean

export interface BlockActionMenuProps {
  editor: Editor | null
  enabled?: boolean
  /**
   * 鼠标离开菜单后延迟隐藏的毫秒数
   * @default 500
   */
  hideDelay?: number
  /**
   * 自定义判断是否展示菜单。返回 false 抑制显示
   * 默认当光标位于 table 节点内部时抑制（由 TableControls 接管该区域）
   *
   * 覆盖示例：
   * ```tsx
   * <BlockActionMenu shouldShow={({ $pos }) => {
   *   for (let d = $pos.depth; d > 0; d--) {
   *     if (['table', 'codeBlock'].includes($pos.node(d).type.name))
   *       return false
   *   }
   *   return true
   * }} />
   * ```
   */
  shouldShow?: BlockActionShouldShow
}
