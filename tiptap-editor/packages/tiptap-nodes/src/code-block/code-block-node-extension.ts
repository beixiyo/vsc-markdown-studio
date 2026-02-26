import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { DOMSerializer } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { common, createLowlight } from 'lowlight'

import { CodeBlockNode } from './code-block-node'
import 'highlight.js/styles/atom-one-dark.css'

const lowlight = createLowlight(common)

export const CodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockNode)
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: 'javascript',
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
          const language = attrs.language || 'javascript'
          return {
            'data-language': language,
            'class': `language-${language}`,
          }
        },
      },
    }
  },

  addProseMirrorPlugins() {
    const editor = this.editor
    const parentPlugins = this.parent?.() || []

    return [
      ...parentPlugins,
      new Plugin({
        key: new PluginKey('code-block-copy-handler'),
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
  defaultLanguage: 'javascript',
})
