import { Editor } from '@tiptap/core'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { Markdown } from '@tiptap/markdown'
import { StarterKit } from '@tiptap/starter-kit'
import { GradientHighlight } from 'tiptap-nodes/gradient-highlight'
import { ImageNode } from 'tiptap-nodes/image'

/**
 * 创建一个最小化、可在 jsdom 中运行的 Tiptap 编辑器
 *
 * 扩展集刻意对齐生产编辑器的顶层节点（图片 / 渐变高亮 / 任务列表），
 * 这样协议测试验证的是真实节点的 markdown/html/json 往返与 lossy 行为，而非玩具节点。
 */
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
