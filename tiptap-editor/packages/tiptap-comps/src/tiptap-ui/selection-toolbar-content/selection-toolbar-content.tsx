import {
  Toolbar,
} from 'comps'
import { memo } from 'react'
import {
  CodeBlockButton,
  ColorHighlightPopover,
  ImageUploadButton,
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
  isMobile = false,
  config,
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
    codeBlock = true,
    superscript = true,
    subscript = true,
    textAlign = true,
    image = true,
  } = config || {}

  const showUndoRedo = undo || redo
  const showMarks = bold || italic || strike || code || underline
  const showScripts = superscript || subscript

  return (
    <>
      {/* 撤销/重做 */}
      { showUndoRedo && (
        <>
          <Toolbar.Group>
            { undo && <UndoRedoButton action="undo" hideWhenUnavailable /> }
            { redo && <UndoRedoButton action="redo" hideWhenUnavailable /> }
          </Toolbar.Group>
          { (textFormat || showMarks || highlight || codeBlock || showScripts || textAlign || image) && <Toolbar.Separator /> }
        </>
      ) }

      {/* 文本格式：标题、段落、列表、任务、引用 */}
      { textFormat && (
        <>
          <Toolbar.Group>
            <TextFormatDropdownMenu
              headingLevels={ [1, 2, 3] }
              listTypes={ ['bulletList', 'orderedList', 'taskList'] }
              portal={ isMobile }
              hideWhenUnavailable
            />
          </Toolbar.Group>
          { (showMarks || highlight || codeBlock || showScripts || textAlign || image) && <Toolbar.Separator /> }
        </>
      ) }

      {/* 文本样式：粗体、斜体、删除线、行内代码、下划线 */}
      { showMarks && (
        <>
          <Toolbar.Group>
            { bold && <MarkButton type="bold" hideWhenUnavailable /> }
            { italic && <MarkButton type="italic" hideWhenUnavailable /> }
            { strike && <MarkButton type="strike" hideWhenUnavailable /> }
            { code && <MarkButton type="code" hideWhenUnavailable /> }
            { underline && <MarkButton type="underline" hideWhenUnavailable /> }
          </Toolbar.Group>
          { (highlight || codeBlock || showScripts || textAlign || image) && <Toolbar.Separator /> }
        </>
      ) }

      {/* 高亮（5个颜色） */}
      { highlight && (
        <>
          <Toolbar.Group>
            <ColorHighlightPopover hideWhenUnavailable />
          </Toolbar.Group>
          { (codeBlock || showScripts || textAlign || image) && <Toolbar.Separator /> }
        </>
      ) }

      {/* 代码块 */}
      { codeBlock && (
        <>
          <Toolbar.Group>
            <CodeBlockButton hideWhenUnavailable />
          </Toolbar.Group>
          { (showScripts || textAlign || image) && <Toolbar.Separator /> }
        </>
      ) }

      {/* 上角标、下角标 */}
      { showScripts && (
        <>
          <Toolbar.Group>
            { superscript && <MarkButton type="superscript" hideWhenUnavailable /> }
            { subscript && <MarkButton type="subscript" hideWhenUnavailable /> }
          </Toolbar.Group>
          { (textAlign || image) && <Toolbar.Separator /> }
        </>
      ) }

      {/* 对齐：左对齐、居中、右对齐、两端对齐 */}
      { textAlign && (
        <>
          <Toolbar.Group>
            <TextAlignDropdownMenu
              types={ ['left', 'center', 'right', 'justify'] }
              portal={ isMobile }
              hideWhenUnavailable
            />
          </Toolbar.Group>
          { image && <Toolbar.Separator /> }
        </>
      ) }

      {/* 添加图片 */}
      { image && (
        <Toolbar.Group>
          <ImageUploadButton hideWhenUnavailable />
        </Toolbar.Group>
      ) }

      {/* 自定义内容 */}
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
   * 是否为移动端
   * @default false
   */
  isMobile?: boolean
  /**
   * 功能配置
   */
  config?: SelectionToolbarConfig
} & React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>
