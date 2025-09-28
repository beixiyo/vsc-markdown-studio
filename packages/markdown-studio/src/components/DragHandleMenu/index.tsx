import {
  BlockColorsItem,
  DragHandleMenu as BuiltInDragHandleMenu,
  type DragHandleMenuProps,
  RemoveBlockItem,
} from '@blocknote/react'
import { memo } from 'react'
import { GroupBlockItem } from './GroupBlockItem'
import { SetColorItem } from './SetColorItem'
/**
 * 自定义拖拽手柄菜单组件
 * 扩展了 BlockNote 的默认拖拽菜单，添加了渐变样式选择功能
 *
 * @link https://www.blocknotejs.org/docs/react/components/side-menu
 *
 * @example
 * ```tsx
 * // 在 BlockNote 编辑器中使用
 * <BlockNoteView editor={editor}>
 *   <BlockNoteView.DragHandleMenu>
 *     <CustomDragHandleMenu />
 *   </BlockNoteView.DragHandleMenu>
 * </BlockNoteView>
 * ```
 */

/**
 * 自定义拖拽手柄菜单主组件
 * 组合了删除、颜色、渐变样式和分组功能
 *
 * @param props - DragHandleMenuProps 拖拽菜单属性
 * @returns 包含所有菜单项的拖拽菜单组件
 */
export const DragHandleMenu = memo((props: DragHandleMenuProps) => {
  return (
    <BuiltInDragHandleMenu { ...props }>
      <RemoveBlockItem { ...props }>Delete</RemoveBlockItem>
      <BlockColorsItem { ...props }>Colors</BlockColorsItem>

      <SetColorItem { ...props } />
      <GroupBlockItem { ...props } />
    </BuiltInDragHandleMenu>
  )
})
