/**
 * 编辑器相关工具函数
 */
import type { Editor } from '@tiptap/react'
import {
  Selection,
  TextSelection,
} from '@tiptap/pm/state'

/**
 * 检查标记是否存在于编辑器模式中
 * @param markName - 要检查的标记名称
 * @param editor - 编辑器实例
 * @returns 布尔值，表示标记是否存在于模式中
 */
export function isMarkInSchema(markName: string, editor: Editor | null): boolean {
  if (!editor?.schema)
    return false
  return editor.schema.spec.marks.get(markName) !== undefined
}

/**
 * 检查节点是否存在于编辑器模式中
 * @param nodeName - 要检查的节点名称
 * @param editor - 编辑器实例
 * @returns 布尔值，表示节点是否存在于模式中
 */
export function isNodeInSchema(nodeName: string, editor: Editor | null): boolean {
  if (!editor?.schema)
    return false
  return editor.schema.spec.nodes.get(nodeName) !== undefined
}

/**
 * 检查一个或多个扩展是否已在 Tiptap 编辑器中注册
 * @param editor - Tiptap 编辑器实例
 * @param extensionNames - 要检查的单个扩展名称或名称数组
 * @returns 如果至少有一个扩展可用则返回 true，否则返回 false
 */
export function isExtensionAvailable(
  editor: Editor | null,
  extensionNames: string | string[],
): boolean {
  if (!editor)
    return false

  const names = Array.isArray(extensionNames)
    ? extensionNames
    : [extensionNames]

  const found = names.some(name =>
    editor.extensionManager.extensions.some(ext => ext.name === name),
  )

  if (!found) {
    console.warn(
      `None of the extensions [${names.join(', ')}] were found in the editor schema. Ensure they are included in the editor configuration.`,
    )
  }

  return found
}

/**
 * 将焦点移动到编辑器中的下一个节点
 * @param editor - 编辑器实例
 * @returns 布尔值，表示焦点是否已移动
 */
export function focusNextNode(editor: Editor) {
  const { state, view } = editor
  const { doc, selection } = state

  const nextSel = Selection.findFrom(selection.$to, 1, true)
  if (nextSel) {
    view.dispatch(state.tr.setSelection(nextSel).scrollIntoView())
    return true
  }

  const paragraphType = state.schema.nodes.paragraph
  if (!paragraphType) {
    console.warn('No paragraph node type found in schema.')
    return false
  }

  const end = doc.content.size
  const para = paragraphType.create()
  let tr = state.tr.insert(end, para)

  // Place the selection inside the new paragraph
  const $inside = tr.doc.resolve(end + 1)
  tr = tr.setSelection(TextSelection.near($inside)).scrollIntoView()
  view.dispatch(tr)
  return true
}
