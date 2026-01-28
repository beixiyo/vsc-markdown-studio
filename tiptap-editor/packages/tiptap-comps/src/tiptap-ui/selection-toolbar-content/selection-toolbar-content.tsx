import { memo } from 'react'
import {
  Toolbar,
} from 'comps'
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
      <Toolbar.Group>
        <UndoRedoButton action="undo" hideWhenUnavailable />
        <UndoRedoButton action="redo" hideWhenUnavailable />
      </Toolbar.Group>

      <Toolbar.Separator />

      {/* 文本格式：标题、段落、列表、任务、引用 */}
      <Toolbar.Group>
        <TextFormatDropdownMenu
          headingLevels={ [1, 2, 3] }
          listTypes={ ['bulletList', 'orderedList', 'taskList'] }
          portal={ isMobile }
          hideWhenUnavailable
        />
      </Toolbar.Group>

      <Toolbar.Separator />

      {/* 文本样式：粗体、斜体、删除线、行内代码、下划线 */}
      <Toolbar.Group>
        <MarkButton type="bold" hideWhenUnavailable />
        <MarkButton type="italic" hideWhenUnavailable />
        <MarkButton type="strike" hideWhenUnavailable />
        <MarkButton type="code" hideWhenUnavailable />
        <MarkButton type="underline" hideWhenUnavailable />
      </Toolbar.Group>

      <Toolbar.Separator />

      {/* 高亮（5个颜色） */}
      <Toolbar.Group>
        <ColorHighlightPopover hideWhenUnavailable />
      </Toolbar.Group>

      <Toolbar.Separator />

      {/* 代码块 */}
      <Toolbar.Group>
        <CodeBlockButton hideWhenUnavailable />
      </Toolbar.Group>

      <Toolbar.Separator />

      {/* 上角标、下角标 */}
      <Toolbar.Group>
        <MarkButton type="superscript" hideWhenUnavailable />
        <MarkButton type="subscript" hideWhenUnavailable />
      </Toolbar.Group>

      <Toolbar.Separator />

      {/* 对齐：左对齐、居中、右对齐、两端对齐 */}
      <Toolbar.Group>
        <TextAlignDropdownMenu
          types={ ['left', 'center', 'right', 'justify'] }
          portal={ isMobile }
          hideWhenUnavailable
        />
      </Toolbar.Group>

      <Toolbar.Separator />

      {/* 添加图片 */}
      <Toolbar.Group>
        <ImageUploadButton hideWhenUnavailable />
      </Toolbar.Group>

      {/* 自定义内容 */}
      { children }
    </>
  )
})

SelectionToolbarContent.displayName = 'SelectionToolbarContent'
