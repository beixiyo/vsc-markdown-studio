import type { MermaidOptions } from './types'
import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { MermaidNodeComponent } from './mermaid-node'

/**
 * Mermaid 节点扩展
 *
 * 用于在 Tiptap 编辑器中插入和渲染 Mermaid 图表
 */
export const MermaidNode = Node.create<MermaidOptions>({
  name: 'mermaid',

  group: 'block',

  draggable: true,

  selectable: true,

  atom: true,

  addOptions() {
    return {
      className: undefined,
    }
  },

  addAttributes() {
    return {
      code: {
        default: '',
        parseHTML: (element) => {
          return element.getAttribute('data-code') || ''
        },
        renderHTML: (attrs) => {
          if (!attrs.code) {
            return {}
          }
          return {
            'data-code': attrs.code,
          }
        },
      },
      id: {
        default: '',
        parseHTML: (element) => {
          return element.getAttribute('data-id') || ''
        },
        renderHTML: (attrs) => {
          if (!attrs.id) {
            return {}
          }
          return {
            'data-id': attrs.id,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-mermaid]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      {
        ...HTMLAttributes,
        'data-mermaid': 'true',
        ...(this.options.className
          ? { class: this.options.className }
          : {}),
      },
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidNodeComponent)
  },

  addCommands() {
    return {
      setMermaid: (code: string) =>
        ({ commands }) => {
          const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          return commands.insertContent({
            type: this.name,
            attrs: {
              code,
              id,
            },
          })
        },
    }
  },

  /**
   * Markdown Tokenizer
   * 专门匹配 ```mermaid 代码块
   */
  markdownTokenizer: {
    name: 'mermaid',
    level: 'block',

    /**
     * 快速检查：查找 ```mermaid 的起始位置
     */
    start: (src: string) => {
      return src.indexOf('```mermaid')
    },

    /**
     * 将匹配到的 mermaid 代码块标记化为 Token
     */
    tokenize: (src: string) => {
      /** 匹配 ```mermaid\n...\n``` 或 ```mermaid\n...```（允许没有尾随换行） */
      const match = /^```mermaid\n([\s\S]*?)\n?```/.exec(src)
      if (!match) {
        return undefined
      }

      return {
        type: 'mermaid',
        raw: match[0],
        text: match[1],
      }
    },
  },

  /**
   * 解析 Markdown token 为 Mermaid 节点
   */
  parseMarkdown: (token) => {
    const code = token.text || ''
    const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    return {
      type: 'mermaid',
      attrs: {
        code,
        id,
      },
    }
  },

  /**
   * 将 Mermaid 节点渲染为 Markdown
   */
  renderMarkdown: (node) => {
    const code = node.attrs?.code || ''
    return `\`\`\`mermaid\n${code}\n\`\`\`\n\n`
  },
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mermaid: {
      /**
       * 插入 Mermaid 图表
       * @param code Mermaid 代码
       */
      setMermaid: (code: string) => ReturnType
    }
  }
}
