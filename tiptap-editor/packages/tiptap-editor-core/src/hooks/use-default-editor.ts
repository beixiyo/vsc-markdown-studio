import { useEditor, type UseEditorOptions } from '@tiptap/react'
import { useStable } from 'hooks'
import { useMemo } from 'react'
import { createExtensions, type CreateExtensionsOptions } from '../extensions'
import { createHandleClick } from '../utils'

export type UseDefaultEditorOptions = UseEditorOptions & CreateExtensionsOptions

export function useDefaultEditor(options: UseDefaultEditorOptions) {
  const {
    extensions: userExtensions,
    editorProps,
    image,
    placeholder,
    textDirection,
    ...restOptions
  } = options

  const stableExts = useStable(userExtensions)
  const stableImage = useStable(image)
  const extensions = useMemo(() => [
    ...createExtensions({ image, placeholder }),
    ...(userExtensions || []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [stableExts, stableImage, placeholder])

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
