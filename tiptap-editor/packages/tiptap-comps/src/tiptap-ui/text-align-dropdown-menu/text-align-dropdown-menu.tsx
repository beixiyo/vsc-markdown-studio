import type { Editor } from '@tiptap/react'
import type { ButtonProps, CascaderOption, CascaderRef } from 'comps'

import type { TextAlign } from './use-text-align'
import {
  Button,

  Cascader,

} from 'comps'

import { forwardRef, useCallback, useMemo, useRef } from 'react'
import { useTiptapEditor, useToolbarLabels } from 'tiptap-api/react'
import { SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'
import { ChevronDownIcon } from '../../icons'
import { TIPTAP_UI_STYLES } from '../constants'
import { useTextAlignDropdownMenu } from './use-text-align-dropdown-menu'

/** 文本对齐下拉菜单 */
export const TextAlignDropdownMenu = forwardRef<
  HTMLButtonElement,
  TextAlignDropdownMenuProps
>((
  {
    editor: providedEditor,
    types = ['left', 'center', 'right', 'justify'],
    hideWhenUnavailable = false,
    onOpenChange,
    portal: _portal,
    ...buttonProps
  },
  ref,
) => {
  const { editor } = useTiptapEditor(providedEditor)
  const toolbarLabels = useToolbarLabels()
  const cascaderRef = useRef<CascaderRef>(null)

  const { filteredAligns, canToggle, isActive, isVisible, Icon, activeAlign }
    = useTextAlignDropdownMenu({
      editor,
      types,
      hideWhenUnavailable,
    })

  const options = useMemo<CascaderOption[]>(() => {
    const triggerClassName = TIPTAP_UI_STYLES.moreContentTrigger
    const labelClassName = TIPTAP_UI_STYLES.moreContentLabel
    return filteredAligns.map((option) => {
      const Icon = option.icon
      return {
        value: option.align,
        label: (
          <div className={ triggerClassName }>
            <Icon className={ TIPTAP_UI_STYLES.iconSecondary } />
            <span className={ labelClassName }>{ option.label }</span>
          </div>
        ),
      }
    })
  }, [filteredAligns])

  const handleValueChange = useCallback((value: string) => {
    editor?.chain().focus().setTextAlign(value).run()
  }, [editor])

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
      aria-label={ toolbarLabels.textAlign }
      tooltip={ toolbarLabels.textAlign }
      { ...buttonProps }
      ref={ ref }
      size="sm"
    >
      <Icon className={ TIPTAP_UI_STYLES.icon } />
      <ChevronDownIcon className={ TIPTAP_UI_STYLES.iconSecondary } />
    </Button>
  ), [isActive, canToggle, toolbarLabels.textAlign, Icon, buttonProps, ref])

  if (!isVisible) {
    return null
  }

  return (
    <Cascader
      ref={ cascaderRef }
      options={ options }
      value={ activeAlign }
      onChange={ handleValueChange }
      onOpenChange={ onOpenChange }
      placement="bottom-start"
      dropdownHeight={ 400 }
      optionClassName={ TIPTAP_UI_STYLES.cascaderOption }
      optionLabelClassName={ TIPTAP_UI_STYLES.moreContentOptionLabel }
      trigger={ trigger }
      dropdownProps={ { [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true' } as any }
    />
  )
})

TextAlignDropdownMenu.displayName = 'TextAlignDropdownMenu'

export interface TextAlignDropdownMenuProps
  extends ButtonProps {
  /** 编辑器实例 */
  editor?: Editor | null
  /** 下拉中展示的对齐类型 */
  types?: TextAlign[]
  /** 无可用对齐类型时是否隐藏，默认 false */
  hideWhenUnavailable?: boolean
  /** 下拉打开/关闭回调 */
  onOpenChange?: (isOpen: boolean) => void
  /** 是否用 portal 渲染下拉，默认 false */
  portal?: boolean
}
