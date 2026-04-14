import { Editor } from '@tiptap/core'
import { Image } from '@tiptap/extension-image'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { StarterKit } from '@tiptap/starter-kit'

/** 创建一个最小化的、可在 jsdom 中运行的 Tiptap 编辑器 */
export function makeEditor(content: any = '') {
  const el = document.createElement('div')
  document.body.appendChild(el)

  const editor = new Editor({
    element: el,
    content,
    extensions: [
      StarterKit,
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
  })
  return {
    editor,
    el,
    cleanup: () => {
      editor.destroy()
      el.remove()
    },
  }
}
