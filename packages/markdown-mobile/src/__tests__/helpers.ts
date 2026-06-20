import { Editor } from '@tiptap/core'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { Markdown } from '@tiptap/markdown'
import { StarterKit } from '@tiptap/starter-kit'
import { GradientHighlight } from 'tiptap-nodes/gradient-highlight'
import { ImageNode } from 'tiptap-nodes/image'

/** 创建一个最小化的、可在 jsdom 中运行的 Tiptap 编辑器 */
export function makeEditor(content: any = '', extraExtensions: any[] = []) {
  const el = document.createElement('div')
  document.body.appendChild(el)

  const editor = new Editor({
    element: el,
    content,
    extensions: [
      StarterKit,
      Markdown.configure({
        indentation: { style: 'space', size: 2 },
        markedOptions: { gfm: true, breaks: true, pedantic: false },
      }),
      ImageNode,
      TaskList,
      TaskItem.configure({ nested: true }),
      GradientHighlight,
      ...extraExtensions,
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
