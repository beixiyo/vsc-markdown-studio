import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { DOMSerializer } from '@tiptap/pm/model'
import { Plugin } from '@tiptap/pm/state'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { common, createLowlight } from 'lowlight'

import { CodeBlockNode } from './code-block-node'

/**
 * 使用 lowlight v3 提供的 createLowlight + common 语法高亮配置
 */
const lowlight = createLowlight(common)

export const CodeBlock = CodeBlockLowlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: 'plaintext',
        parseHTML: (element) => {
          const dataLanguage = element.getAttribute('data-language')
          if (dataLanguage)
            return dataLanguage

          const className = element.getAttribute('class') || ''
          const match = className
            .split(' ')
            .find(cls => cls.startsWith('language-'))

          return match
            ? match.replace('language-', '')
            : null
        },
        renderHTML: (attrs) => {
          const language = attrs.language || 'plaintext'
          return {
            'data-language': language,
            'class': `language-${language}`,
          }
        },
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockNode)
  },

  addProseMirrorPlugins() {
    const editor = this.editor
    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            copy(view, event) {
              if (!event.clipboardData || !editor.markdown)
                return
              const { state } = view
              const { from, to } = state.selection
              if (from >= to)
                return
              const slice = state.selection.content()
              if (slice.size === 0)
                return
              const fragment = slice.content
              const content = fragment.content.map(node => node.toJSON())
              /** 包装成 doc 再序列化，否则 renderNodes 用空 separator 拼接导致块间换行丢失 */
              const markdownText = editor.markdown.serialize({ type: 'doc', content })
              const domSerializer = DOMSerializer.fromSchema(state.schema)
              const domFragment = domSerializer.serializeFragment(fragment)
              const div = document.createElement('div')
              div.appendChild(domFragment)
              const html = div.innerHTML
              event.clipboardData.setData('text/plain', markdownText)
              event.clipboardData.setData('text/html', html)
              event.preventDefault()
            },
          },
        },
      }),
    ]
  },
}).configure({
  lowlight,
  defaultLanguage: 'plaintext',
})

export default CodeBlock
