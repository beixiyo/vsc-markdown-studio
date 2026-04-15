import type { ImageAttrs, ImageOptions } from './types'
import { mergeAttributes, Node } from '@tiptap/react'
import { createImageNodeView } from './image-node-view'

declare module '@tiptap/react' {
  interface Commands<ReturnType> {
    image: {
      /** 插入一张图片 */
      setImage: (attrs: ImageAttrs) => ReturnType
      /** 更新当前选中图片的属性 */
      updateImage: (attrs: Partial<ImageAttrs>) => ReturnType
    }
  }
}

/**
 * 序列化属性到 data-* 以便 HTML 往返保真
 */
function dataAttr(value: unknown): string | null {
  if (value == null || value === '')
    return null
  if (typeof value === 'object')
    return JSON.stringify(value)
  return String(value)
}

function parseDataAttr(el: HTMLElement, key: string): string | null {
  const raw = el.getAttribute(`data-${key}`)
  return raw == null || raw === ''
    ? null
    : raw
}

function parseJsonAttr(el: HTMLElement, key: string): Record<string, string | number> | null {
  const raw = el.getAttribute(`data-${key}`)
  if (!raw)
    return null
  try {
    return JSON.parse(raw)
  }
  catch {
    return null
  }
}

function parseNumberAttr(el: HTMLElement, key: string): number | null {
  const raw = el.getAttribute(`data-${key}`)
  if (raw == null || raw === '')
    return null
  const n = Number(raw)
  return Number.isFinite(n)
    ? n
    : null
}

/**
 * 自定义图片节点
 *
 * Schema 层固定为 `inline`，视觉上的 block 模式通过 `display` attr + CSS 模拟
 * 事件回调通过 `configure({ onClick, ... })` 注入，attrs 仅存可序列化数据
 */
export const ImageNode = Node.create<ImageOptions>({
  name: 'image',

  inline: true,
  group: 'inline',
  atom: true,
  draggable: true,
  selectable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      src: {
        default: '',
        parseHTML: el => (el as HTMLElement).getAttribute('src') ?? '',
        renderHTML: attrs => (attrs.src
          ? { src: attrs.src }
          : {}),
      },
      alt: {
        default: null,
        parseHTML: el => (el as HTMLElement).getAttribute('alt'),
        renderHTML: attrs => (attrs.alt
          ? { alt: attrs.alt }
          : {}),
      },
      title: {
        default: null,
        parseHTML: el => (el as HTMLElement).getAttribute('title'),
        renderHTML: attrs => (attrs.title
          ? { title: attrs.title }
          : {}),
      },

      width: {
        default: null,
        parseHTML: el => parseDataAttr(el as HTMLElement, 'width') ?? (el as HTMLElement).getAttribute('width'),
        renderHTML: attrs => (attrs.width != null
          ? { 'data-width': dataAttr(attrs.width) }
          : {}),
      },
      height: {
        default: null,
        parseHTML: el => parseDataAttr(el as HTMLElement, 'height') ?? (el as HTMLElement).getAttribute('height'),
        renderHTML: attrs => (attrs.height != null
          ? { 'data-height': dataAttr(attrs.height) }
          : {}),
      },
      aspectRatio: {
        default: null,
        parseHTML: el => parseDataAttr(el as HTMLElement, 'aspect-ratio'),
        renderHTML: attrs => (attrs.aspectRatio
          ? { 'data-aspect-ratio': attrs.aspectRatio }
          : {}),
      },

      display: {
        default: 'inline-block',
        parseHTML: el => parseDataAttr(el as HTMLElement, 'display') ?? 'inline-block',
        renderHTML: attrs => (attrs.display
          ? { 'data-display': attrs.display }
          : {}),
      },
      align: {
        default: null,
        parseHTML: el => parseDataAttr(el as HTMLElement, 'align'),
        renderHTML: attrs => (attrs.align
          ? { 'data-align': attrs.align }
          : {}),
      },
      verticalAlign: {
        default: null,
        parseHTML: el => parseDataAttr(el as HTMLElement, 'vertical-align'),
        renderHTML: attrs => (attrs.verticalAlign
          ? { 'data-vertical-align': attrs.verticalAlign }
          : {}),
      },
      float: {
        default: null,
        parseHTML: el => parseDataAttr(el as HTMLElement, 'float'),
        renderHTML: attrs => (attrs.float
          ? { 'data-float': attrs.float }
          : {}),
      },
      margin: {
        default: null,
        parseHTML: el => parseDataAttr(el as HTMLElement, 'margin'),
        renderHTML: attrs => (attrs.margin
          ? { 'data-margin': attrs.margin }
          : {}),
      },
      padding: {
        default: null,
        parseHTML: el => parseDataAttr(el as HTMLElement, 'padding'),
        renderHTML: attrs => (attrs.padding
          ? { 'data-padding': attrs.padding }
          : {}),
      },

      objectFit: {
        default: null,
        parseHTML: el => parseDataAttr(el as HTMLElement, 'object-fit'),
        renderHTML: attrs => (attrs.objectFit
          ? { 'data-object-fit': attrs.objectFit }
          : {}),
      },
      borderRadius: {
        default: null,
        parseHTML: el => parseDataAttr(el as HTMLElement, 'border-radius'),
        renderHTML: attrs => (attrs.borderRadius
          ? { 'data-border-radius': attrs.borderRadius }
          : {}),
      },
      border: {
        default: null,
        parseHTML: el => parseDataAttr(el as HTMLElement, 'border'),
        renderHTML: attrs => (attrs.border
          ? { 'data-border': attrs.border }
          : {}),
      },
      boxShadow: {
        default: null,
        parseHTML: el => parseDataAttr(el as HTMLElement, 'box-shadow'),
        renderHTML: attrs => (attrs.boxShadow
          ? { 'data-box-shadow': attrs.boxShadow }
          : {}),
      },
      opacity: {
        default: null,
        parseHTML: el => parseNumberAttr(el as HTMLElement, 'opacity'),
        renderHTML: attrs => (attrs.opacity != null
          ? { 'data-opacity': String(attrs.opacity) }
          : {}),
      },
      filter: {
        default: null,
        parseHTML: el => parseDataAttr(el as HTMLElement, 'filter'),
        renderHTML: attrs => (attrs.filter
          ? { 'data-filter': attrs.filter }
          : {}),
      },
      rotate: {
        default: null,
        parseHTML: el => parseNumberAttr(el as HTMLElement, 'rotate'),
        renderHTML: attrs => (attrs.rotate != null
          ? { 'data-rotate': String(attrs.rotate) }
          : {}),
      },
      className: {
        default: null,
        parseHTML: el => (el as HTMLElement).getAttribute('class'),
        renderHTML: attrs => (attrs.className
          ? { class: attrs.className }
          : {}),
      },
      style: {
        default: null,
        parseHTML: el => parseJsonAttr(el as HTMLElement, 'style-json'),
        renderHTML: attrs => (attrs.style
          ? { 'data-style-json': JSON.stringify(attrs.style) }
          : {}),
      },

      loading: {
        default: 'lazy',
        parseHTML: el => (el as HTMLElement).getAttribute('loading') ?? 'lazy',
        renderHTML: attrs => (attrs.loading
          ? { loading: attrs.loading }
          : {}),
      },
      decoding: {
        default: 'async',
        parseHTML: el => (el as HTMLElement).getAttribute('decoding') ?? 'async',
        renderHTML: attrs => (attrs.decoding
          ? { decoding: attrs.decoding }
          : {}),
      },
      placeholder: {
        default: null,
        parseHTML: el => parseDataAttr(el as HTMLElement, 'placeholder'),
        renderHTML: attrs => (attrs.placeholder
          ? { 'data-placeholder': attrs.placeholder }
          : {}),
      },
      fallbackSrc: {
        default: null,
        parseHTML: el => parseDataAttr(el as HTMLElement, 'fallback-src'),
        renderHTML: attrs => (attrs.fallbackSrc
          ? { 'data-fallback-src': attrs.fallbackSrc }
          : {}),
      },
      thumbnailSrc: {
        default: null,
        parseHTML: el => parseDataAttr(el as HTMLElement, 'thumbnail-src'),
        renderHTML: attrs => (attrs.thumbnailSrc
          ? { 'data-thumbnail-src': attrs.thumbnailSrc }
          : {}),
      },
      crossOrigin: {
        default: null,
        parseHTML: el => (el as HTMLElement).getAttribute('crossorigin'),
        renderHTML: attrs => (attrs.crossOrigin
          ? { crossorigin: attrs.crossOrigin }
          : {}),
      },
      referrerPolicy: {
        default: null,
        parseHTML: el => (el as HTMLElement).getAttribute('referrerpolicy'),
        renderHTML: attrs => (attrs.referrerPolicy
          ? { referrerpolicy: attrs.referrerPolicy }
          : {}),
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'img[src]' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addNodeView() {
    return createImageNodeView(this.options)
  },

  addCommands() {
    return {
      setImage:
        attrs =>
          ({ commands }) => {
            return commands.insertContent({
              type: this.name,
              attrs,
            })
          },
      updateImage:
        attrs =>
          ({ commands }) => {
            return commands.updateAttributes(this.name, attrs)
          },
    }
  },
})

export default ImageNode
