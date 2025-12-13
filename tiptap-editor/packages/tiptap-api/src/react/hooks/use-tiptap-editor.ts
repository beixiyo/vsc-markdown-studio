import type { Editor } from '@tiptap/react'
import { useCurrentEditor, useEditorState } from '@tiptap/react'
import { useMemo } from 'react'

/**
 * 提供对 Tiptap 编辑器实例访问的 Hook
 *
 * 接受可选的编辑器实例，或者回退到从 Tiptap 上下文中获取编辑器（如果可用）。
 * 这使得组件既可以在直接提供编辑器时工作，也可以在 Tiptap 编辑器上下文中使用。
 *
 * @param providedEditor - 可选的编辑器实例，用于替代上下文中的编辑器
 * @returns 提供的编辑器或上下文中的编辑器（哪个可用就返回哪个）
 */
export function useTiptapEditor(providedEditor?: Editor | null): {
  editor: Editor | null
  editorState?: Editor['state']
  canCommand?: Editor['can']
} {
  const { editor: coreEditor } = useCurrentEditor()
  const mainEditor = useMemo(
    () => providedEditor || coreEditor,
    [providedEditor, coreEditor],
  )

  const editorState = useEditorState({
    editor: mainEditor,
    selector(context) {
      if (!context.editor) {
        return {
          editor: null,
          editorState: undefined,
          canCommand: undefined,
        }
      }

      return {
        editor: context.editor,
        editorState: context.editor.state,
        canCommand: context.editor.can,
      }
    },
  })

  return editorState || { editor: null }
}
