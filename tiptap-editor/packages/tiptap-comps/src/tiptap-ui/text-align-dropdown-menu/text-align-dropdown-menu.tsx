import type { Editor } from '@tiptap/react'
import type { TextAlign } from './use-text-align'

import {
  Button,
  Cascader,
  type CascaderOption,
  type CascaderRef,
} from 'comps'

import { useCallback, useMemo, useRef } from 'react'
import { useTiptapEditor, useToolbarLabels } from 'tiptap-api/react'
import { SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'
import { ChevronDownIcon } from '../../icons'
import { useTextAlignDropdownMenu } from './use-text-align-dropdown-menu'

/** 文本对齐下拉菜单 */
export function TextAlignDropdownMenu({
  editor: providedEditor,
  types = ['left', 'center', 'right', 'justify'],
  hideWhenUnavailable = false,
  onOpenChange,
  portal: _portal,
  ...props
}: TextAlignDropdownMenuProps) {
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
    return filteredAligns.map(option => ({
      value: option.align,
      label: option.label,
      icon: <option.icon className="size-4 text-icon" />,
    }))
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
      { ...props }
      size="sm"
    >
      <Icon className="size-4" />
      <ChevronDownIcon className="size-4 text-icon" />
    </Button>
  ), [isActive, canToggle, toolbarLabels.textAlign, Icon, props])

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
      optionClassName="px-2 py-1"
      trigger={ trigger }
      dropdownProps={ { [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true' } as any }
    />
  )
}

export default TextAlignDropdownMenu

export interface TextAlignDropdownMenuProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
