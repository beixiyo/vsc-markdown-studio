import type { MermaidOptions } from './types'
import { uniqueId } from '@jl-org/tool'
import { Node, nodeInputRule } from '@tiptap/core'
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
  draggable: false,
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
          return element.getAttribute('data-mermaid-code') || ''
        },
        renderHTML: (attrs) => {
          if (!attrs.code) {
            return {}
          }
          return {
            'data-mermaid-code': attrs.code,
          }
        },
      },
      id: {
        default: '',
        parseHTML: (element) => {
          return element.getAttribute('data-mermaid-id') || ''
        },
        renderHTML: (attrs) => {
          if (!attrs.id) {
            return {}
          }
          return {
            'data-mermaid-id': attrs.id,
          }
        },
      },
      x: {
        default: 0,
        parseHTML: (element) => {
          const value = element.getAttribute('data-mermaid-x')
          return value
            ? Number.parseFloat(value)
            : 0
        },
        renderHTML: (attrs) => {
          if (attrs.x === undefined || attrs.x === 0) {
            return {}
          }
          return {
            'data-mermaid-x': String(attrs.x),
          }
        },
      },
      y: {
        default: 0,
        parseHTML: (element) => {
          const value = element.getAttribute('data-mermaid-y')
          return value
            ? Number.parseFloat(value)
            : 0
        },
        renderHTML: (attrs) => {
          if (attrs.y === undefined || attrs.y === 0) {
            return {}
          }
          return {
            'data-mermaid-y': String(attrs.y),
          }
        },
      },
      scale: {
        default: 1,
        parseHTML: (element) => {
          const value = element.getAttribute('data-mermaid-scale')
          return value
            ? Number.parseFloat(value)
            : 1
        },
        renderHTML: (attrs) => {
          if (attrs.scale === undefined || attrs.scale === 1) {
            return {}
          }
          return {
            'data-mermaid-scale': String(attrs.scale),
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

  addInputRules() {
    return [
      nodeInputRule({
        find: /^```mermaid[\s\n]$/,
        type: this.type,
        getAttributes: () => ({
          id: `mermaid-${uniqueId()}`,
        }),
      }),
    ]
  },

  addCommands() {
    return {
      insertMermaid: (code: string) =>
        ({ commands }) => {
          const id = `mermaid-${uniqueId()}`
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
    const id = `mermaid-${uniqueId()}`

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
      insertMermaid: (code: string) => ReturnType
    }
  }
}
