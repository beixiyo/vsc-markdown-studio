import type { Editor } from '@tiptap/react'
import { NodeSelection, Selection } from '@tiptap/pm/state'
import { useCallback } from 'react'
import { serializeNodeForClipboard } from 'tiptap-utils'

export function useBlockDrag(
  editor: Editor | null,
  hoverNodePos: number | null,
  hideMenu: () => void,
) {
  const onDragStart = useCallback((e: React.DragEvent) => {
    if (hoverNodePos === null || !editor)
      return

    const node = editor.state.doc.nodeAt(hoverNodePos)
    if (!node)
      return

    /** 1. 创建节点选区，让编辑器知道我们正在拖拽哪个节点 */
    const selection = NodeSelection.create(editor.state.doc, hoverNodePos)
    editor.view.dispatch(editor.state.tr.setSelection(selection))

    /** 2. 序列化节点数据用于粘贴/拖放 */
    const slice = selection.content()
    const serialized = serializeNodeForClipboard(editor.view, slice)

    /** 3. 设置拖拽数据 */
    e.dataTransfer.clearData()
    if (serialized) {
      const tmp = document.createElement('div')
      tmp.appendChild(serialized)
      e.dataTransfer.setData('text/html', tmp.innerHTML)
    }
    e.dataTransfer.setData('text/plain', slice.content.textBetween(0, slice.content.size, '\n\n'))
    e.dataTransfer.effectAllowed = 'copyMove'

    /** 4. 提供自定义的拖拽幽灵图像 (可选) */
    if (e.dataTransfer.setDragImage) {
      const nodeDOM = editor.view.nodeDOM(hoverNodePos) as HTMLElement
      if (nodeDOM) {
        e.dataTransfer.setDragImage(nodeDOM, 0, 0)
      }
    }

    /** 5. 给编辑器视图触发原生拖拽事件 */
    editor.view.dragging = {
      slice,
      move: true,
    }
  }, [editor, hoverNodePos])

  const onDragEnd = useCallback(() => {
    // 拖拽结束后，隐藏菜单并清理幽灵状态
    hideMenu()

    // 移除 NodeSelection 恢复成安全的选区
    if (editor && editor.view.state.selection instanceof NodeSelection) {
      const pos = editor.view.state.selection.$anchor.pos
      const $pos = editor.state.doc.resolve(pos)
      editor.view.dispatch(editor.state.tr.setSelection(Selection.near($pos)))
    }
  }, [editor, hideMenu])

  return {
    onDragStart,
    onDragEnd,
  }
}
