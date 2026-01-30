// --- UI Primitives ---
import type { ButtonProps } from 'comps'

// --- Tiptap UI ---
import type { UseImageUploadConfig } from './use-image-upload'

import { Badge, Button } from 'comps'

import { forwardRef, useCallback } from 'react'
// --- Hooks ---
import { useTiptapEditor } from 'tiptap-api/react'

// --- Lib ---
import { parseShortcutKeys } from 'tiptap-utils'
import {
  IMAGE_UPLOAD_SHORTCUT_KEY,
  useImageUpload,
} from './use-image-upload'

/** 图片上传快捷键角标 */
export function ImageShortcutBadge({
  shortcutKeys = IMAGE_UPLOAD_SHORTCUT_KEY,
}: {
  shortcutKeys?: string
}) {
  return <Badge variant="outline" size="sm" content={ parseShortcutKeys({ shortcutKeys }) } />
}

/** 上传/插入图片的按钮；自定义实现请使用 useImageUpload */
export const ImageUploadButton = forwardRef<
  HTMLButtonElement,
  ImageUploadButtonProps
>(
  (
    {
      editor: providedEditor,
      text,
      hideWhenUnavailable = false,
      onInserted,
      showShortcut = false,
      onClick,
      icon: CustomIcon,
      children,
      ...buttonProps
    },
    ref,
  ) => {
    const { editor } = useTiptapEditor(providedEditor)
    const {
      isVisible,
      canInsert,
      handleImage,
      label,
      isActive,
      shortcutKeys,
      Icon,
    } = useImageUpload({
      editor,
      hideWhenUnavailable,
      onInserted,
    })

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented)
          return
        handleImage()
      },
      [handleImage, onClick],
    )

    if (!isVisible) {
      return null
    }

    const RenderIcon = CustomIcon ?? Icon

    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        name={ isActive
          ? 'active'
          : undefined }
        role="button"
        tabIndex={ -1 }
        disabled={ !canInsert }
        aria-label={ label }
        aria-pressed={ isActive }
        tooltip={ label }
        onClick={ handleClick }
        { ...buttonProps }
        ref={ ref }
      >
        { children ?? (
          <>
            <RenderIcon className="size-4" />
            { text && <span className="text-base text-textSecondary">{ text }</span> }
            { showShortcut && <ImageShortcutBadge shortcutKeys={ shortcutKeys } /> }
          </>
        ) }
      </Button>
    )
  },
)

ImageUploadButton.displayName = 'ImageUploadButton'

type IconProps = React.SVGProps<SVGSVGElement>
type IconComponent = ({ className, ...props }: IconProps) => React.ReactElement

export interface ImageUploadButtonProps
  extends Omit<ButtonProps, 'type'>,
  UseImageUploadConfig {
  /** 图标旁可选文案 */
  text?: string
  /** 是否显示快捷键，默认 false */
  showShortcut?: boolean
  /** 可选自定义图标组件 */
  icon?: React.MemoExoticComponent<IconComponent> | React.FC<IconProps>
}
