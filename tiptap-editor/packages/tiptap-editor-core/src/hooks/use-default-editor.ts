import { useEditor, type UseEditorOptions } from '@tiptap/react'
import { useMemo } from 'react'
import { createExtensions } from '../extensions'
import { createHandleClick } from '../utils'
import { useStable } from 'hooks'

export function useDefaultEditor(options: UseEditorOptions) {
  const {
    extensions: userExtensions,
    editorProps,
    ...restOptions
  } = options

  const stableExts = useStable(userExtensions)
  const extensions = useMemo(() => [
    ...createExtensions(),
    ...(userExtensions || []),
  ], [stableExts])

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
    ...restOptions,
  })

  return editor
}
