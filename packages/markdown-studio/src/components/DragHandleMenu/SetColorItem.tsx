import {
  type DragHandleMenuProps,
  useBlockNoteEditor,
  useComponentsContext,
} from '@blocknote/react'
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
import { gradientStylesMap, type GradientStyleType } from 'custom-blocknote-gradient-styles'
import { memo } from 'react'

/**
 * 渐变样式菜单项组件
 * 提供渐变样式的选择功能，包含所有可用的渐变样式选项
 *
 * @param props - DragHandleMenuProps 拖拽菜单属性
 */
export const SetColorItem = memo<DragHandleMenuProps>(() => {
  const editor = useBlockNoteEditor()
  const Components = useComponentsContext()!
  const data = Object.entries(gradientStylesMap)

  /**
   * 处理渐变样式点击事件
   * 将选中的渐变样式应用到当前文本选区
   *
   * @param gradient - 要应用的渐变样式类型
   */
  const handleGradientStyleClick = (gradient: GradientStyleType) => {
    editor.addStyles({ gradient } as any)
  }

  return (
    <Components.Generic.Menu.Root position="right" sub>
      <Components.Generic.Menu.Trigger sub>
        <Components.Generic.Menu.Item
          className="bn-menu-item"
          subTrigger
        >
          Gradient
        </Components.Generic.Menu.Item>
      </Components.Generic.Menu.Trigger>

      <Components.Generic.Menu.Dropdown
        sub
        className="bn-menu-dropdown bn-color-picker-dropdown"
      >
        {
          data.map(([key, value]) => (
            <Components.Generic.Menu.Item
              key={ key }
              onClick={ () => handleGradientStyleClick(key as GradientStyleType) }
            >
              <div className="flex gap-2 items-center">
                <div
                  className="size-3 rounded-full flex-shrink-0"
                  style={ { background: value.gradient } }
                />
                <span>{ value.label }</span>
              </div>
            </Components.Generic.Menu.Item>
          ))
        }
      </Components.Generic.Menu.Dropdown>
    </Components.Generic.Menu.Root>
  )
})
