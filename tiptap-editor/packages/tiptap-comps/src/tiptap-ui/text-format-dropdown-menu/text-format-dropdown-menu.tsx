import type { Editor } from '@tiptap/react'

// --- UI Primitives ---
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'

// --- Hooks ---
import { useBlockLabels, useHeadingLabels, useListLabels, useTiptapEditor, useToolbarLabels } from 'tiptap-api/react'
// --- Icons ---
import {
  ChevronDownIcon,
  HeadingFiveIcon,
  HeadingFourIcon,
  HeadingOneIcon,
  HeadingSixIcon,
  HeadingThreeIcon,
  HeadingTwoIcon,
  TextFormatIcon,
} from '../../icons'

import {
  Button,
  Card,
  Popover,
  type PopoverRef,
} from 'comps'
import { BlockquoteButton } from '../blockquote-button'
// --- Tiptap UI ---
import { HeadingButton, type Level } from '../heading-button'
import { ListButton } from '../list-button'
import { useTextFormatDropdownMenu } from './use-text-format-dropdown-menu'

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
    const popoverRef = useRef<PopoverRef>(null)

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
        const iconMap: Record<number, React.ElementType> = {
          1: HeadingOneIcon,
          2: HeadingTwoIcon,
          3: HeadingThreeIcon,
          4: HeadingFourIcon,
          5: HeadingFiveIcon,
          6: HeadingSixIcon,
        }
        setLastTextIcon(iconMap[activeHeadingLevel] || TextFormatIcon)
      }
    }, [activeType, activeHeadingLevel])

    const closePopover = useCallback(() => {
      popoverRef.current?.close()
    }, [])

    if (!isVisible) {
      return null
    }

    const MainIcon = lastTextIcon

    return (
      <Popover
        ref={ popoverRef }
        trigger="click"
        onOpen={ () => onOpenChange?.(true) }
        onClose={ () => onOpenChange?.(false) }
        content={
          <Card padding="none" shadow="md" className="min-w-[12rem] p-1">
            <div className="flex flex-col gap-0.5">
              {/* 标题 */ }
              { headingLevels.map(level => (
                <HeadingButton
                  key={ `heading-${level}` }
                  editor={ editor }
                  level={ level }
                  text={ headingLabels[`heading${level}` as keyof typeof headingLabels] }
                  className="w-full justify-start"
                  onClick={ closePopover }
                />
              )) }

              {/* 正文 */ }
              <Button
                type="button"
                variant="ghost"
                name={ activeType === 'paragraph' ? 'active' : undefined }
                role="button"
                tabIndex={ -1 }
                aria-label={ headingLabels.paragraph }
                aria-pressed={ activeType === 'paragraph' }
                onClick={ () => {
                  editor?.chain().focus().setParagraph().run()
                  closePopover()
                } }
                className="w-full justify-start"
                size="sm"
                leftIcon={
                  <TextFormatIcon className="size-5 text-icon" />
                }
              >
                <span className="text-base text-textSecondary">{ headingLabels.paragraph }</span>
              </Button>

              {/* 列表 */ }
              { listTypes.includes('orderedList') && (
                <ListButton
                  key="orderedList"
                  editor={ editor }
                  type="orderedList"
                  text={ listLabels.orderedList }
                  className="w-full justify-start"
                  onClick={ closePopover }
                />
              ) }
              { listTypes.includes('bulletList') && (
                <ListButton
                  key="bulletList"
                  editor={ editor }
                  type="bulletList"
                  text={ listLabels.bulletList }
                  className="w-full justify-start"
                  onClick={ closePopover }
                />
              ) }
              { listTypes.includes('taskList') && (
                <ListButton
                  key="taskList"
                  editor={ editor }
                  type="taskList"
                  text={ listLabels.taskList }
                  className="w-full justify-start"
                  onClick={ closePopover }
                />
              ) }

              {/* 引用 */ }
              <BlockquoteButton
                editor={ editor }
                text={ blockLabels.blockquote }
                className="w-full justify-start"
                onClick={ closePopover }
              />
            </div>
          </Card>
        }
      >
        <Button
          type="button"
          variant="ghost"
          name={ isActive ? 'active' : undefined }
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
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </Popover>
    )
  },
)

TextFormatDropdownMenu.displayName = 'TextFormatDropdownMenu'

export default TextFormatDropdownMenu
