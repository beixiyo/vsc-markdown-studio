import type { Editor } from '@tiptap/react'
import {
  Button,
  Popover,
  Toolbar,
} from 'comps'
import { memo } from 'react'
import { SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'
import { MoreHorizontalIcon } from '../../icons'
import {
  CodeBlockButton,
  ColorHighlightPopover,
  ImageUploadButton,
  LinkPopover,
  MarkButton,
  TextAlignDropdownMenu,
  TextFormatDropdownMenu,
  UndoRedoButton,
} from '../index'

/**
 * 选中文本工具栏内容组件
 * 包含常用的文本格式化功能
 */
export const SelectionToolbarContent = memo<SelectionToolbarContentProps>(({
  editor,
  isMobile = false,
  config,
  moreContent,
  children,
}) => {
  const {
    undo = true,
    redo = true,
    textFormat = true,
    bold = true,
    italic = true,
    strike = true,
    code = true,
    underline = true,
    highlight = true,
    link = true,
    codeBlock = true,
    superscript = true,
    subscript = true,
    textAlign = true,
    image = true,
  } = config || {}

  const showUndoRedo = undo || redo
  const showMarks = bold || italic || strike || underline || highlight || link
  const showScripts = superscript || subscript

  return (
    <>
      {/* 撤销/重做 */ }
      { showUndoRedo && (
        <>
          <Toolbar.Group>
            { undo && <UndoRedoButton editor={ editor } action="undo" hideWhenUnavailable /> }
            { redo && <UndoRedoButton editor={ editor } action="redo" hideWhenUnavailable /> }
          </Toolbar.Group>
          { (textFormat || showMarks || highlight || link || codeBlock || showScripts || textAlign || image || moreContent) && <Toolbar.Separator /> }
        </>
      ) }

      {/* 文本格式：标题、段落、列表、任务、引用 */ }
      { textFormat && (
        <>
          <Toolbar.Group>
            <TextFormatDropdownMenu
              editor={ editor }
              headingLevels={ [1, 2, 3] }
              listTypes={ ['bulletList', 'orderedList', 'taskList'] }
              portal={ isMobile }
              hideWhenUnavailable
            />
          </Toolbar.Group>
          { (showMarks || highlight || link || codeBlock || showScripts || textAlign || image || moreContent) && <Toolbar.Separator /> }
        </>
      ) }

      {/* 文本样式：粗体、斜体、删除线、行内代码、下划线 */ }
      { showMarks && (
        <>
          <Toolbar.Group>
            { bold && <MarkButton editor={ editor } type="bold" hideWhenUnavailable /> }
            { italic && <MarkButton editor={ editor } type="italic" hideWhenUnavailable /> }
            { strike && <MarkButton editor={ editor } type="strike" hideWhenUnavailable /> }
            { underline && <MarkButton editor={ editor } type="underline" hideWhenUnavailable /> }

            { highlight && <ColorHighlightPopover editor={ editor } hideWhenUnavailable /> }
            { link && <LinkPopover editor={ editor } hideWhenUnavailable /> }
          </Toolbar.Group>
          { (codeBlock || showScripts || textAlign || image || moreContent) && <Toolbar.Separator /> }
        </>
      ) }

      {/* 代码块 */ }
      { codeBlock && (
        <>
          <Toolbar.Group>
            { code && <MarkButton editor={ editor } type="code" hideWhenUnavailable /> }
            <CodeBlockButton editor={ editor } hideWhenUnavailable />
          </Toolbar.Group>
          { (showScripts || textAlign || image || moreContent) && <Toolbar.Separator /> }
        </>
      ) }

      {/* 上角标、下角标 */ }
      { showScripts && (
        <>
          <Toolbar.Group>
            { superscript && <MarkButton editor={ editor } type="superscript" hideWhenUnavailable /> }
            { subscript && <MarkButton editor={ editor } type="subscript" hideWhenUnavailable /> }
          </Toolbar.Group>
          { (textAlign || image || moreContent) && <Toolbar.Separator /> }
        </>
      ) }

      {/* 对齐：左对齐、居中、右对齐、两端对齐 */ }
      { textAlign && (
        <>
          <Toolbar.Group>
            <TextAlignDropdownMenu
              editor={ editor }
              types={ ['left', 'center', 'right', 'justify'] }
              portal={ isMobile }
              hideWhenUnavailable
            />
          </Toolbar.Group>
          { (image || moreContent) && <Toolbar.Separator /> }
        </>
      ) }

      {/* 添加图片 */ }
      { image && (
        <>
          <Toolbar.Group>
            <ImageUploadButton editor={ editor } hideWhenUnavailable />
          </Toolbar.Group>
          { moreContent && <Toolbar.Separator /> }
        </>
      ) }

      {/* 更多功能 */ }
      { moreContent && (
        <Toolbar.Group>
          <Popover
            trigger="click"
            position="bottom"
            content={
              <div
                { ...{ [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true' } }
                className="p-1 min-w-[120px]"
              >
                { moreContent }
              </div>
            }
          >
            <Button
              variant="ghost"
              size="sm"
              className="size-8 p-0"
              tooltip="更多"
              leftIcon={ <MoreHorizontalIcon className="size-4" /> }
              iconOnly
            >
            </Button>
          </Popover>
        </Toolbar.Group>
      ) }

      {/* 自定义内容 */ }
      { children }
    </>
  )
})

SelectionToolbarContent.displayName = 'SelectionToolbarContent'

export interface SelectionToolbarConfig {
  /** 撤销 */
  undo?: boolean
  /** 重做 */
  redo?: boolean
  /** 文本格式（标题、段落、列表、引用） */
  textFormat?: boolean
  /** 粗体 */
  bold?: boolean
  /** 斜体 */
  italic?: boolean
  /** 删除线 */
  strike?: boolean
  /** 行内代码 */
  code?: boolean
  /** 下划线 */
  underline?: boolean
  /** 文字颜色与高亮 */
  highlight?: boolean
  /** 链接 */
  link?: boolean
  /** 代码块 */
  codeBlock?: boolean
  /** 上角标 */
  superscript?: boolean
  /** 下角标 */
  subscript?: boolean
  /** 文本对齐 */
  textAlign?: boolean
  /** 插入图片 */
  image?: boolean
}

export type SelectionToolbarContentProps = {
  /**
   * 编辑器实例
   */
  editor?: Editor | null
  /**
   * 是否为移动端
   * @default false
   */
  isMobile?: boolean
  /**
   * 功能配置
   */
  config?: SelectionToolbarConfig
  /**
   * 更多功能内容
   */
  moreContent?: React.ReactNode
} & React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>
