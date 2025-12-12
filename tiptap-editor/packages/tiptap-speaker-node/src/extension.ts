import { Node, mergeAttributes, type CommandProps } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import type { SpeakerAttributes, SpeakerOptions } from './types'


const DEFAULT_TAG = 'strong'
const TOKEN_NAME = 'speaker'
const TOKEN_REGEX = /^\[speaker:([^\]]+?)\]/

const buildDataAttributes = (attrs: Partial<SpeakerAttributes>) => {
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

const resolveDisplayText = (
  attrs: Partial<SpeakerAttributes>,
  options: SpeakerOptions
) => {
  const key = attrs.originalLabel ?? ''
  const mapped = key ? options.speakerMap?.[key] : undefined
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
        parseHTML: (element) => {
          const value = element.getAttribute('data-speaker-original-label')
          return value ?? ''
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
        parseHTML: (element) => element.getAttribute('data-speaker-name'),
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
        parseHTML: (element) => element.getAttribute('data-speaker-id'),
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
        parseHTML: (element) => element.getAttribute('data-speaker-label'),
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

  parseHTML() {
    const tag = this.options.renderTag ?? DEFAULT_TAG
    return [
      {
        tag: `${tag}[data-speaker-original-label]`,
      },
      {
        tag: '[data-speaker-original-label]',
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
      this.options.className ? { class: this.options.className } : {},
      buildDataAttributes(mergedAttrs)
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
          const list = Array.isArray(items) ? items : [items]
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

  markdownTokenizer: {
    name: TOKEN_NAME,
    level: 'inline',
    start: (src: string) => src.indexOf('[speaker:'),
    tokenize: (src: string) => {
      const match = TOKEN_REGEX.exec(src)
      if (!match) {
        return undefined
      }
      return {
        type: TOKEN_NAME,
        raw: match[0],
        value: match[1],
      }
    },
  },

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
