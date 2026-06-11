import type { ImageAttrs, ImageOptions } from './types'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { mergeAttributes, Node } from '@tiptap/react'
import { nanoid } from 'nanoid'
import { escapeHtmlAttr } from '../markdown-utils'
import { createImageNodeView } from './image-node-view'

/**
 * 生成图片节点的稳定 id
 *
 * 用 `nanoid` 而非 `crypto.randomUUID`：后者在**非 secure context**（如 WebView 的 http 场景）
 * 不可用，会报 `crypto.randomUUID is not a function`。nanoid 自带 fallback，全环境可用。
 *
 * 前缀 `img_` 方便肉眼 / 日志排查来源。
 */
export function generateImageId(): string {
  return `img_${nanoid(12)}`
}

const IMAGE_ID_PLUGIN_KEY = new PluginKey('imageAutoId')

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
 * Markdown 富属性映射表：节点 attr → `<img>` 上的 HTML 属性名
 *
 * 顺序即输出顺序，固定顺序保证 markdown 多轮往返逐字符幂等。
 * width/height 输出标准 HTML 属性（GitHub / VS Code 预览可识别尺寸），
 * 其余走 data-*，与 addAttributes 的 renderHTML 保持同名，解析侧免费复用
 */
const MARKDOWN_RICH_ATTRS: [attrKey: string, htmlName: string][] = [
  ['width', 'width'],
  ['height', 'height'],
  ['aspectRatio', 'data-aspect-ratio'],
  ['display', 'data-display'],
  ['align', 'data-align'],
  ['verticalAlign', 'data-vertical-align'],
  ['float', 'data-float'],
  ['margin', 'data-margin'],
  ['padding', 'data-padding'],
  ['objectFit', 'data-object-fit'],
  ['borderRadius', 'data-border-radius'],
  ['border', 'data-border'],
  ['boxShadow', 'data-box-shadow'],
  ['opacity', 'data-opacity'],
  ['filter', 'data-filter'],
  ['rotate', 'data-rotate'],
  ['className', 'class'],
  ['style', 'data-style-json'],
  ['loading', 'loading'],
  ['decoding', 'decoding'],
  ['placeholder', 'data-placeholder'],
  ['fallbackSrc', 'data-fallback-src'],
  ['thumbnailSrc', 'data-thumbnail-src'],
  ['crossOrigin', 'crossorigin'],
  ['referrerPolicy', 'referrerpolicy'],
]

/** 与 addAttributes 的 default 一致的值不输出，避免每张图都降级为 HTML */
const MARKDOWN_ATTR_DEFAULTS: Record<string, unknown> = {
  display: 'inline-block',
  loading: 'lazy',
  decoding: 'async',
}

/**
 * 收集需要进入 Markdown 的富属性（[htmlName, value] 有序对）
 * 返回空数组表示纯净图片，可用标准 `![]()` 语法
 */
function collectMarkdownRichAttrs(attrs: Record<string, any>): [string, string][] {
  const out: [string, string][] = []
  for (const [key, htmlName] of MARKDOWN_RICH_ATTRS) {
    const value = attrs[key]
    if (value == null || value === '' || MARKDOWN_ATTR_DEFAULTS[key] === value)
      continue
    out.push([htmlName, dataAttr(value)!])
  }
  return out
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
      /**
       * 稳定 id —— 只活在 ProseMirror 状态里
       * `rendered: false` + `parseHTML: null` 确保不序列化到 DOM / 复制粘贴的 HTML
       * 未填充的节点会由下方 `addProseMirrorPlugins` 兜底补 id
       */
      id: {
        default: null,
        rendered: false,
        parseHTML: () => null,
      },
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

  /**
   * Markdown 双向转换
   *
   * - 纯净图片（仅 src/alt/title）：标准 `![alt](src "title")`，marked 原生
   *   `image` token 解析，无需自定义 tokenizer
   * - 含富属性（尺寸 / 对齐 / 样式等）：降级为自闭合 `<img ... />`，导入侧由
   *   @tiptap/markdown 的 HTML token 解析路径（parseHTMLToken → 本扩展
   *   parseHTML）自动还原；自闭合写法可避开成对标签的前向扫描
   */
  markdownTokenName: 'image',

  parseMarkdown: (token) => {
    return {
      type: 'image',
      attrs: {
        src: token.href || '',
        alt: token.text || null,
        title: token.title || null,
      },
    }
  },

  renderMarkdown: (node) => {
    const attrs = node.attrs ?? {}
    const src = attrs.src || ''
    const alt = attrs.alt || ''
    const title = attrs.title

    const rich = collectMarkdownRichAttrs(attrs)
    if (!rich.length) {
      return title
        ? `![${alt}](${src} "${title}")`
        : `![${alt}](${src})`
    }

    const parts = [`src="${escapeHtmlAttr(src)}"`]
    if (alt)
      parts.push(`alt="${escapeHtmlAttr(alt)}"`)
    if (title)
      parts.push(`title="${escapeHtmlAttr(title)}"`)
    for (const [name, value] of rich)
      parts.push(`${name}="${escapeHtmlAttr(value)}"`)

    return `<img ${parts.join(' ')} />`
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

  /**
   * 兜底补 id：任何 image 节点进入文档时若 `id` 为空，就用生成的 UUID 填上
   *
   * 覆盖：首次插入、复制粘贴（因 `rendered:false` 粘贴解析出的 id 为 null）、外部 setContent
   * 无需专门的粘贴钩子 —— attr 本身不序列化到 HTML，重置天然发生
   */
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: IMAGE_ID_PLUGIN_KEY,
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some(tr => tr.docChanged))
            return null
          const tr = newState.tr
          let modified = false
          newState.doc.descendants((node, pos) => {
            if (node.type.name === 'image' && !node.attrs.id) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, id: generateImageId() })
              modified = true
            }
          })
          return modified
            ? tr
            : null
        },
      }),
    ]
  },
})

export default ImageNode
