import type { Editor } from '@tiptap/react'

import {
  Button,
  Cascader,
  type CascaderOption,
  type CascaderRef,
} from 'comps'

// --- UI Primitives ---
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
// --- Hooks ---
import { useBlockLabels, useHeadingLabels, useListLabels, useTiptapEditor, useToolbarLabels } from 'tiptap-api/react'

// --- Icons ---
import {
  BlockquoteIcon,
  ChevronDownIcon,
  TextFormatIcon,
} from '../../icons'

import { shouldShowButton as shouldShowBlockquoteButton, toggleBlockquote } from '../blockquote-button/use-blockquote'
// --- Tiptap UI ---
import { headingIcons, type Level, shouldShowButton as shouldShowHeadingButton, toggleHeading } from '../heading-button/use-heading'
import { isListActive, listIcons, type ListType, shouldShowButton as shouldShowListButton, toggleList } from '../list-button/use-list'
import { useTextFormatDropdownMenu } from './use-text-format-dropdown-menu'

/**
 * Dropdown menu component for selecting text formats (headings, paragraph, lists, blockquote) in a Tiptap editor.
 */
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
      />
    )
  },
)

TextFormatDropdownMenu.displayName = 'TextFormatDropdownMenu'

export interface TextFormatDropdownMenuProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Available heading levels to show in the dropdown
   * @default [1, 2, 3]
   */
  headingLevels?: Level[]
  /**
   * Available list types to show in the dropdown
   * @default ['bulletList', 'orderedList', 'taskList']
   */
  listTypes?: ('bulletList' | 'orderedList' | 'taskList')[]
  /**
   * Whether the dropdown should hide when formats are not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Whether to render the dropdown menu in a portal
   * @default false
   */
  portal?: boolean
  /**
   * Callback for when the dropdown opens or closes
   */
  onOpenChange?: (isOpen: boolean) => void
}
