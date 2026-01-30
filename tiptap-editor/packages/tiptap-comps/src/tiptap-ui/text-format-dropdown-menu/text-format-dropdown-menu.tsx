import type { Editor } from '@tiptap/react'
import {
  Button,
  Cascader,
  type CascaderOption,
  type CascaderRef,
} from 'comps'

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useBlockLabels, useHeadingLabels, useListLabels, useTiptapEditor, useToolbarLabels } from 'tiptap-api/react'
import { SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'

import {
  BlockquoteIcon,
  ChevronDownIcon,
  TextFormatIcon,
} from '../../icons'

import { shouldShowButton as shouldShowBlockquoteButton, toggleBlockquote } from '../blockquote-button/use-blockquote'
import { headingIcons, type Level, shouldShowButton as shouldShowHeadingButton, toggleHeading } from '../heading-button/use-heading'
import { isListActive, listIcons, type ListType, shouldShowButton as shouldShowListButton, toggleList } from '../list-button/use-list'
import { useTextFormatDropdownMenu } from './use-text-format-dropdown-menu'

/** 文本格式下拉：标题、段落、列表、引用等 */
export const TextFormatDropdownMenu = forwardRef<
  HTMLButtonElement,
  TextFormatDropdownMenuProps
>(
  (
    {
      editor: providedEditor,
      headingLevels = [1, 2, 3],
      listTypes = ['bulletList', 'orderedList', 'taskList'],
      hideWhenUnavailable = false,
      portal: _portal,
      onOpenChange,
      ...buttonProps
    },
    ref,
  ) => {
    const { editor } = useTiptapEditor(providedEditor)
    const toolbarLabels = useToolbarLabels()
    const listLabels = useListLabels()
    const blockLabels = useBlockLabels()
    const headingLabels = useHeadingLabels()

    const memoizedHeadingLabels = useMemo(() => headingLabels, [JSON.stringify(headingLabels)])
    const memoizedListLabels = useMemo(() => listLabels, [JSON.stringify(listLabels)])
    const memoizedBlockLabels = useMemo(() => blockLabels, [JSON.stringify(blockLabels)])

    const cascaderRef = useRef<CascaderRef>(null)

    const {
      isVisible,
      isActive,
      canToggle,
      activeType,
      activeHeadingLevel,
    } = useTextFormatDropdownMenu({
      editor,
      headingLevels,
      listTypes,
      hideWhenUnavailable,
    })

    const [lastTextIcon, setLastTextIcon] = useState<React.ElementType>(TextFormatIcon)

    useEffect(() => {
      if (activeType === 'paragraph') {
        setLastTextIcon(TextFormatIcon)
      }
      else if (activeType === 'heading' && activeHeadingLevel) {
        setLastTextIcon(headingIcons[activeHeadingLevel] || TextFormatIcon)
      }
    }, [activeType, activeHeadingLevel])

    const options = useMemo<CascaderOption[]>(() => {
      const result: CascaderOption[] = []

      headingLevels.forEach((level) => {
        if (shouldShowHeadingButton({ editor, level, hideWhenUnavailable })) {
          const Icon = headingIcons[level]
          result.push({
            value: `heading${level}`,
            label: memoizedHeadingLabels[`heading${level}` as keyof typeof memoizedHeadingLabels],
            icon: <Icon className="size-4 text-icon" />,
          })
        }
      })

      // Paragraph
      result.push({
        value: 'paragraph',
        label: memoizedHeadingLabels.paragraph,
        icon: <TextFormatIcon className="size-4 text-icon" />,
      })

      listTypes.forEach((type) => {
        if (shouldShowListButton({ editor, type, hideWhenUnavailable })) {
          const Icon = listIcons[type]
          result.push({
            value: type,
            label: memoizedListLabels[type],
            icon: <Icon className="size-4 text-icon" />,
          })
        }
      })

      if (shouldShowBlockquoteButton({ editor, hideWhenUnavailable })) {
        result.push({
          value: 'blockquote',
          label: memoizedBlockLabels.blockquote,
          icon: <BlockquoteIcon className="size-4 text-icon" />,
        })
      }

      return result
    }, [editor, headingLevels, memoizedHeadingLabels, listTypes, memoizedListLabels, memoizedBlockLabels, hideWhenUnavailable])

    const handleValueChange = useCallback((value: string) => {
      if (value.startsWith('heading')) {
        const level = Number.parseInt(value.replace('heading', ''), 10) as Level
        toggleHeading(editor, level)
      }
      else if (value === 'paragraph') {
        editor?.chain().focus().setParagraph().run()
      }
      else if (value === 'blockquote') {
        toggleBlockquote(editor)
      }
      else {
        // Must be a list type
        toggleList(editor, value as ListType)
      }
    }, [editor])

    const activeListType = listTypes.find(type => editor && isListActive(editor, type))
    const currentValue = activeType === 'heading'
      ? `heading${activeHeadingLevel}`
      : activeType === 'list'
        ? activeListType
        : activeType || ''

    const MainIcon = lastTextIcon

    const trigger = useMemo(() => (
      <Button
        type="button"
        variant="ghost"
        name={ isActive
          ? 'active'
          : undefined }
        role="button"
        tabIndex={ -1 }
        disabled={ !canToggle }
        aria-label={ toolbarLabels.textFormat }
        aria-pressed={ isActive }
        tooltip={ toolbarLabels.textFormat }
        { ...buttonProps }
        ref={ ref }
        size="sm"
      >
        <MainIcon className="size-4" />
        <ChevronDownIcon className="size-4 text-icon" />
      </Button>
    ), [isActive, canToggle, toolbarLabels.textFormat, MainIcon, buttonProps, ref])

    if (!isVisible) {
      return null
    }

    return (
      <Cascader
        ref={ cascaderRef }
        options={ options }
        value={ currentValue }
        onChange={ handleValueChange }
        onOpenChange={ onOpenChange }
        placement="bottom-start"
        dropdownHeight={ 400 }
        optionClassName="px-2 py-1"
        trigger={ trigger }
        dropdownProps={ { [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true' } as any }
      />
    )
  },
)

TextFormatDropdownMenu.displayName = 'TextFormatDropdownMenu'

export interface TextFormatDropdownMenuProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 编辑器实例 */
  editor?: Editor | null
  /** 下拉中展示的标题级别，默认 [1, 2, 3] */
  headingLevels?: Level[]
  /** 下拉中展示的列表类型，默认 ['bulletList', 'orderedList', 'taskList'] */
  listTypes?: ('bulletList' | 'orderedList' | 'taskList')[]
  /** 格式不可用时是否隐藏下拉，默认 false */
  hideWhenUnavailable?: boolean
  /** 是否用 portal 渲染下拉，默认 false */
  portal?: boolean
  /** 下拉打开/关闭回调 */
  onOpenChange?: (isOpen: boolean) => void
}
