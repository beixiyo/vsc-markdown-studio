import type { CascaderOption } from 'comps'
import type { SelectToolbarContentProps } from './types'
import {
  Button,
  Cascader,

  Popover,
  Toolbar,
} from 'comps'
import { memo } from 'react'
import { SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'
import { MoreHorizontalIcon } from '../../icons'
import { TIPTAP_UI_STYLES } from '../constants'
import {
  CodeBlockButton,
  ColorHighlightPopover,
  EditorLink,
  ImageUploadButton,
  MarkButton,
  TextAlignDropdownMenu,
  TextFormatDropdownMenu,
  UndoRedoButton,
} from '../index'

/** 选中文本工具栏内容：撤销/重做、文本格式、样式、高亮、代码块、角标、对齐、图片等 */
export const SelectToolbarContent = memo<SelectToolbarContentProps>(({
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
  const MORE_CONTENT_KEEP_OPEN_ATTR = 'data-more-content-keep-open'

  const renderMore = () => {
    if (!moreContent)
      return null

    const moreButton = (
      <Button
        variant="ghost"
        size="sm"
        tooltip="更多"
        leftIcon={ <MoreHorizontalIcon className={ TIPTAP_UI_STYLES.icon } /> }
        iconOnly
      />
    )

    if (Array.isArray(moreContent)) {
      return (
        <Cascader
          trigger={ moreButton }
          options={ moreContent as CascaderOption[] }
          placement="bottom-start"
          dropdownProps={ { [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true', [MORE_CONTENT_KEEP_OPEN_ATTR]: 'true' } as any }
          dropdownHeight={ 500 }
          optionClassName={ TIPTAP_UI_STYLES.cascaderOption }
          optionLabelClassName={ TIPTAP_UI_STYLES.moreContentOptionLabel }
          dropdownClassName="min-w-[140px]"
          clickOutsideIgnoreSelector={ `[${MORE_CONTENT_KEEP_OPEN_ATTR}="true"]` }
        />
      )
    }

    return (
      <Popover
        trigger="click"
        position="bottom"
        content={
          <div
            { ...{ [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true', [MORE_CONTENT_KEEP_OPEN_ATTR]: 'true' } }
            className="min-w-[120px]"
          >
            { moreContent }
          </div>
        }
      >
        { moreButton }
      </Popover>
    )
  }

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
            { link && <EditorLink editor={ editor } hideWhenUnavailable /> }
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
          { renderMore() }
        </Toolbar.Group>
      ) }

      {/* 自定义内容 */ }
      { children }
    </>
  )
})

SelectToolbarContent.displayName = 'SelectToolbarContent'
