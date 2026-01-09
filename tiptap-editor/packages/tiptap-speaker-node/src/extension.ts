import type { EditorView } from '@tiptap/pm/view'
import type { SpeakerAttributes, SpeakerOptions } from './types'
import { type CommandProps, mergeAttributes, Node } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'

const DEFAULT_TAG = 'strong'
const TOKEN_NAME = 'speaker'
const TOKEN_REGEX = /^\[speaker:([^\]]+?)\]/
const HTML_TAG_REGEX = /^<speaker>([^<]+?)<\/speaker>/

function buildDataAttributes(attrs: Partial<SpeakerAttributes>) {
  const dataAttrs: Record<string, string> = {}
  if (attrs.originalLabel) {
    dataAttrs['data-speaker-original-label'] = attrs.originalLabel
  }
  if (attrs.label) {
    dataAttrs['data-speaker-label'] = attrs.label
  }
  if (attrs.id) {
    dataAttrs['data-speaker-id'] = attrs.id
  }
  if (attrs.name) {
    dataAttrs['data-speaker-name'] = attrs.name
  }
  return dataAttrs
}

function resolveDisplayText(attrs: Partial<SpeakerAttributes>, options: SpeakerOptions) {
  const key = attrs.originalLabel ?? ''
  const mapped = key
    ? options.speakerMap?.[key]
    : undefined
  if (mapped?.name) {
    return mapped.name
  }
  if (attrs.name) {
    return attrs.name
  }
  return attrs.originalLabel
}

export const SpeakerNode = Node.create<SpeakerOptions>({
  name: 'speaker',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: false,

  addOptions() {
    return {
      speakerMap: {},
      className: undefined,
      renderTag: DEFAULT_TAG,
      onClick: undefined,
    }
  },

  addAttributes() {
    return {
      originalLabel: {
        default: '',
        /**
         * 解析原始标签文本
         * 会解析以下内容：
         * 1. 带有 data-speaker-original-label 属性的元素，从该属性中获取值
         * 2. <speaker> 标签，从标签的文本内容中获取值
         */
        parseHTML: (element) => {
          /** 优先从 data 属性获取 */
          const dataAttr = element.getAttribute('data-speaker-original-label')
          if (dataAttr) {
            return dataAttr
          }
          /** 如果标签名是 speaker，从标签内容获取 */
          if (element.tagName.toLowerCase() === 'speaker') {
            return element.textContent?.trim() || ''
          }
          return ''
        },
        renderHTML: (attrs) => {
          if (!attrs.originalLabel) {
            return {}
          }
          return {
            'data-speaker-original-label': attrs.originalLabel,
          }
        },
      },
      name: {
        default: null,
        /**
         * 解析说话者名称
         * 会解析元素上 data-speaker-name 属性的值
         */
        parseHTML: element => element.getAttribute('data-speaker-name'),
        renderHTML: (attrs) => {
          if (!attrs.name) {
            return {}
          }
          return {
            'data-speaker-name': attrs.name,
          }
        },
      },
      id: {
        default: null,
        /**
         * 解析说话者 ID
         * 会解析元素上 data-speaker-id 属性的值
         */
        parseHTML: element => element.getAttribute('data-speaker-id'),
        renderHTML: (attrs) => {
          if (!attrs.id) {
            return {}
          }
          return {
            'data-speaker-id': attrs.id,
          }
        },
      },
      label: {
        default: null,
        /**
         * 解析说话者标签
         * 会解析元素上 data-speaker-label 属性的值
         */
        parseHTML: element => element.getAttribute('data-speaker-label'),
        renderHTML: (attrs) => {
          if (!attrs.label) {
            return {}
          }
          return {
            'data-speaker-label': attrs.label,
          }
        },
      },
    }
  },

  /**
   * 定义节点级别的 HTML 解析规则
   * 会解析以下 HTML 元素：
   * 1. 带有 data-speaker-original-label 属性的自定义标签（如 <strong>, <span> 等，由 renderTag 选项决定）
   * 2. 带有 data-speaker-original-label 属性的任意元素
   * 3. <speaker> 标签，从标签的文本内容中提取 originalLabel 属性
   */
  parseHTML() {
    const tag = this.options.renderTag ?? DEFAULT_TAG
    return [
      {
        tag: `${tag}[data-speaker-original-label]`,
      },
      {
        tag: '[data-speaker-original-label]',
      },
      {
        tag: 'speaker',
        getAttrs: (node) => {
          if (typeof node === 'string') {
            return false
          }
          const element = node as HTMLElement
          const textContent = element.textContent?.trim() || ''
          return textContent
            ? {
                originalLabel: textContent,
              }
            : false
        },
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const tag = this.options.renderTag ?? DEFAULT_TAG
    const mapped = node.attrs.originalLabel
      ? this.options.speakerMap?.[node.attrs.originalLabel]
      : undefined
    const mergedAttrs = {
      ...node.attrs,
      ...mapped,
      originalLabel: node.attrs.originalLabel,
    }
    const attrs = mergeAttributes(
      HTMLAttributes,
      this.options.className
        ? { class: this.options.className }
        : {},
      buildDataAttributes(mergedAttrs),
    )
    const text = resolveDisplayText(node.attrs, this.options)
    return [
      tag,
      attrs,
      text,
    ]
  },

  addCommands() {
    return {
      setSpeakers: (items: SpeakerAttributes | SpeakerAttributes[]) =>
        ({ chain }: CommandProps) => {
          const list = Array.isArray(items)
            ? items
            : [items]
          const content = list.map(item => ({
            type: 'speaker',
            attrs: {
              originalLabel: item.originalLabel,
              name: item.name,
              id: item.id,
              label: item.label,
            },
          }))
          return chain()
            .insertContent(content)
            .run()
        },
    }
  },

  /**
   * Markdown 标记化器
   * 用于解析 Markdown 文本中的 Speaker 标记
   * 支持两种格式：
   * 1. [speaker:标签名] - 方括号格式
   * 2. <speaker>标签名</speaker> - HTML 标签格式
   */
  markdownTokenizer: {
    name: TOKEN_NAME,
    level: 'inline',
    /**
     * 查找 Markdown 文本中 Speaker 标记的起始位置
     * 会查找 [speaker: 或 <speaker> 的第一个出现位置
     */
    start: (src: string) => {
      const bracketIndex = src.indexOf('[speaker:')
      const tagIndex = src.indexOf('<speaker>')
      if (bracketIndex === -1 && tagIndex === -1) {
        return -1
      }
      if (bracketIndex === -1) {
        return tagIndex
      }
      if (tagIndex === -1) {
        return bracketIndex
      }
      return Math.min(bracketIndex, tagIndex)
    },
    /**
     * 将匹配到的文本标记化为 Token
     * 优先解析 [speaker:X] 格式，如果不存在则解析 <speaker>X</speaker> 格式
     * 返回的 token.value 包含标签名（方括号或标签内容中的文本）
     */
    tokenize: (src: string) => {
      /** 优先匹配 [speaker:X] 格式 */
      const bracketMatch = TOKEN_REGEX.exec(src)
      if (bracketMatch) {
        return {
          type: TOKEN_NAME,
          raw: bracketMatch[0],
          value: bracketMatch[1],
        }
      }
      /** 匹配 <speaker>X</speaker> 格式 */
      const tagMatch = HTML_TAG_REGEX.exec(src)
      if (tagMatch) {
        return {
          type: TOKEN_NAME,
          raw: tagMatch[0],
          value: tagMatch[1],
        }
      }
      return undefined
    },
  },

  /**
   * 解析 Markdown 标记为 Speaker 节点
   * 会解析以下 Markdown 格式：
   * 1. [speaker:标签名] - 方括号格式，标签名作为 originalLabel
   * 2. <speaker>标签名</speaker> - HTML 标签格式，标签名作为 originalLabel
   */
  parseMarkdown: (token) => {
    return {
      type: 'speaker',
      attrs: {
        originalLabel: token.value || '',
      },
    }
  },

  renderMarkdown: (node) => {
    const label = node?.attrs?.originalLabel || ''
    return ` [speaker:${label}] `
  },

  addProseMirrorPlugins() {
    if (!this.options.onClick) {
      return []
    }

    const onClick = this.options.onClick

    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            click: (_view: EditorView, event: MouseEvent) => {
              const target = event.target as HTMLElement | null
              const node = target?.closest?.('[data-speaker-original-label]') as HTMLElement | null
              if (!node) {
                return false
              }

              const attrs: SpeakerAttributes = {
                originalLabel: node.getAttribute('data-speaker-original-label') || '',
                name: node.getAttribute('data-speaker-name') || undefined,
                id: node.getAttribute('data-speaker-id') || undefined,
                label: node.getAttribute('data-speaker-label') || undefined,
              }

              onClick(attrs, event as MouseEvent)
              return true
            },
          },
        },
      }),
    ]
  },
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    speaker: {
      setSpeakers: (
        items: SpeakerAttributes | SpeakerAttributes[]
      ) => ReturnType
    }
  }
}
