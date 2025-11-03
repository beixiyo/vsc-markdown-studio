import type { DocSection } from 'markdown-operate'
import {
  type DragHandleMenuProps,
  useComponentsContext,
} from '@blocknote/react'
import { memo } from 'react'
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
 * 获取当前块分组菜单项组件
 * 使用 groupBlockByHeading 函数获取当前块的分组信息
 *
 * @param props - DragHandleMenuProps 拖拽菜单属性
 */
export const GroupBlockItem = memo<DragHandleMenuProps>(() => {
  const lastGroupBlock = useRef<DocSection>(null)
  const Components = useComponentsContext()!

  /**
   * 处理获取当前块分组点击事件
   * 调用 groupBlockByHeading 函数获取当前块的分组信息
   */
  const handleGroupBlockClick = () => {
    const selection = MDBridge.getSelection()
    if (selection) {
      console.log(selection)
      const md = MDBridge.extractBlockText(selection.blocks)
      console.log(md)
      return md
    }

    const { state } = MDBridge
    const { startBlock, endBlock } = state.lastGroupBlock

    if (startBlock && endBlock) {
      const unset = () => {
        if (lastGroupBlock.current) {
          const { startBlock, endBlock } = lastGroupBlock.current
          MDBridge.setSelection(startBlock!.id, endBlock!.id)
          // MDBridge.command.unsetGradient()
          MDBridge.command.unsetUnderline()
        }
      }
      unset()

      lastGroupBlock.current = state.lastGroupBlock
      MDBridge.setSelection(startBlock.id, endBlock.id)
      // MDBridge.command.setGradient('naturalGreen')
      MDBridge.command.setUnderline()

      console.log(state.lastGroupMarkdown)
    }
  }

  return (
    <Components.Generic.Menu.Item
      className="bn-menu-item"
      onClick={ handleGroupBlockClick }
    >
      Group
    </Components.Generic.Menu.Item>
  )
})
