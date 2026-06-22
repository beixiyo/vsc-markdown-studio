import type { UseEditorOptions } from '@tiptap/react'
import type { CreateExtensionsOptions } from '../extensions'
import { useEditor } from '@tiptap/react'
import { useStable } from 'hooks'
import { useMemo } from 'react'
import { createExtensions } from '../extensions'
import { createHandleClick } from '../utils'

export type UseDefaultEditorOptions = UseEditorOptions & CreateExtensionsOptions

export function useDefaultEditor(options: UseDefaultEditorOptions) {
  const {
    extensions: userExtensions,
    editorProps,
    image,
    selection,
    hover,
    placeholder,
    mobileKeyboardGuard,
    textDirection,
    ...restOptions
  } = options

  const stableExts = useStable(userExtensions)
  const stableImage = useStable(image)
  const extensions = useMemo(() => [
    ...createExtensions({ image, selection, hover, placeholder, mobileKeyboardGuard }),
    ...(userExtensions || []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [stableExts, stableImage, selection, hover, placeholder, mobileKeyboardGuard])

  const {
    attributes,
    handleClick,
    ...restEditorProps
  } = editorProps || {}

  const mergedEditorProps = useMemo(() => ({
    attributes: {
      'autocomplete': 'off',
      'autocorrect': 'off',
      'autocapitalize': 'off',
      'aria-label': 'Main content area, start typing to enter text.',
      'class': '',
      ...attributes,
    },
    handleClick: handleClick || createHandleClick(),
    ...restEditorProps,
  }), [attributes, handleClick, restEditorProps])

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: mergedEditorProps,
    extensions,
    textDirection,
    ...restOptions,
  })

  return editor
}
