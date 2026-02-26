import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
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
}).configure({
  lowlight,
  defaultLanguage: 'plaintext',
})

export default CodeBlock
