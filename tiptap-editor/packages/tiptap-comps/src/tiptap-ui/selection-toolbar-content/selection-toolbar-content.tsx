import { memo } from 'react'
import {
  ToolbarGroup,
  ToolbarSeparator,
} from '../../ui'
import {
  CodeBlockButton,
  ColorHighlightPopover,
  ImageUploadButton,
  MarkButton,
  TextAlignDropdownMenu,
  TextFormatDropdownMenu,
  UndoRedoButton,
} from '../index'

export type SelectionToolbarContentProps = {
  /**
   * 是否为移动端
   * @default false
   */
  isMobile?: boolean
} & React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>

/**
 * 选中文本工具栏内容组件
 * 包含常用的文本格式化功能
 */
export const SelectionToolbarContent = memo<SelectionToolbarContentProps>(({
  isMobile = false,
  children,
}) => {
  return (
    <>
      {/* 撤销/重做 */}
      <ToolbarGroup>
        <UndoRedoButton action="undo" hideWhenUnavailable />
        <UndoRedoButton action="redo" hideWhenUnavailable />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* 文本格式：标题、段落、列表、任务、引用 */}
      <ToolbarGroup>
        <TextFormatDropdownMenu
          headingLevels={ [1, 2, 3] }
          listTypes={ ['bulletList', 'orderedList', 'taskList'] }
          portal={ isMobile }
          hideWhenUnavailable
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* 文本样式：粗体、斜体、删除线、行内代码、下划线 */}
      <ToolbarGroup>
        <MarkButton type="bold" hideWhenUnavailable />
        <MarkButton type="italic" hideWhenUnavailable />
        <MarkButton type="strike" hideWhenUnavailable />
        <MarkButton type="code" hideWhenUnavailable />
        <MarkButton type="underline" hideWhenUnavailable />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* 高亮（5个颜色） */}
      <ToolbarGroup>
        <ColorHighlightPopover hideWhenUnavailable />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* 代码块 */}
      <ToolbarGroup>
        <CodeBlockButton hideWhenUnavailable />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* 上角标、下角标 */}
      <ToolbarGroup>
        <MarkButton type="superscript" hideWhenUnavailable />
        <MarkButton type="subscript" hideWhenUnavailable />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* 对齐：左对齐、居中、右对齐、两端对齐 */}
      <ToolbarGroup>
        <TextAlignDropdownMenu
          types={ ['left', 'center', 'right', 'justify'] }
          portal={ isMobile }
          hideWhenUnavailable
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* 添加图片 */}
      <ToolbarGroup>
        <ImageUploadButton hideWhenUnavailable />
      </ToolbarGroup>

      {/* 自定义内容 */}
      { children }
    </>
  )
})

SelectionToolbarContent.displayName = 'SelectionToolbarContent'
