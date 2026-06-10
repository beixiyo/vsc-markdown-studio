/**
 * ctx-ref 兼容层：把算法侧 V2 的 HTML comment marker 升格为真实文档节点
 *
 * 背景：ProseMirror 的 DOMParser 不解析 comment 节点，`<!--ctx-ref:...-->` 这类
 * marker 经编辑器 roundtrip 会被静默丢弃。本模块通过 @tiptap/markdown 的
 * markdownTokenizer 在词法层把 marker 解析为不可见的 atom 节点，序列化时原样还原，
 * 保证「加载 → 编辑 → 保存」全程 marker 不丢、不变形
 *
 * - `CtxRefNode`：`<!--ctx-ref:{type}:{id}-->` → 行内数据锚点（携带 data 属性与点击事件，
 *   默认无样式；视觉呈现由业务侧基于 `tiptap-ctx-ref--{type}` 类名或自有插件实现）
 * - `SummaryBoundaryNode`：`<!--summary-added-images:start|end-->` → 不可见块级边界
 */

import type { Node as PMNode } from '@tiptap/pm/model'
import type { EditorView } from '@tiptap/pm/view'
import type { CtxRefOptions } from './types'
import { mergeAttributes, Node } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'

const CTX_REF_TOKEN = 'ctxRef'
const CTX_REF_START = '<!--ctx-ref:'
const CTX_REF_REGEX = /^<!--ctx-ref:(mark|note|image):([\w-]+)-->/

const BOUNDARY_TOKEN = 'summaryBoundary'
const BOUNDARY_START = '<!--summary-added-images:'
const BOUNDARY_REGEX = /^<!--summary-added-images:(start|end)-->(?:\n+|$)/

/**
 * 取 marker 前紧邻的加粗斜体句（Note / Image 点击详情展示用）
 *
 * 约定来自算法侧 V2：summary 中与引用对应的一句话以 ***加粗斜体*** 形式
 * 紧邻 marker 之前。向前收集同段内连续的 bold + italic 文本
 */
function getLeadingSentence(doc: PMNode, pos: number): string {
  try {
    const $pos = doc.resolve(pos)
    const parent = $pos.parent
    let sentence = ''

    for (let i = $pos.index() - 1; i >= 0; i--) {
      const child = parent.child(i)
      const isBoldItalic = child.isText
        && child.marks.some(m => m.type.name === 'bold')
        && child.marks.some(m => m.type.name === 'italic')
      if (!isBoldItalic)
        break
      sentence = (child.text ?? '') + sentence
    }
    return sentence
  }
  catch {
    return ''
  }
}

export const CtxRefNode = Node.create<CtxRefOptions>({
  name: 'ctxRef',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: false,
  draggable: false,

  addOptions() {
    return {
      onClick: undefined,
      className: undefined,
    }
  },

  addAttributes() {
    return {
      refType: {
        default: 'mark',
        parseHTML: element => element.getAttribute('data-ctx-ref'),
        renderHTML: attrs => ({ 'data-ctx-ref': attrs.refType }),
      },
      refId: {
        default: '',
        parseHTML: element => element.getAttribute('data-ctx-id'),
        renderHTML: attrs => ({ 'data-ctx-id': attrs.refId }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-ctx-ref]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        HTMLAttributes,
        { class: `tiptap-ctx-ref tiptap-ctx-ref--${node.attrs.refType}` },
        this.options.className
          ? { class: this.options.className }
          : {},
      ),
    ]
  },

  /** marker 不进入纯文本提取结果 */
  renderText() {
    return ''
  },

  markdownTokenName: CTX_REF_TOKEN,

  markdownTokenizer: {
    name: CTX_REF_TOKEN,
    level: 'inline',
    start: CTX_REF_START,
    tokenize: (src: string) => {
      const match = CTX_REF_REGEX.exec(src)
      if (!match)
        return undefined
      return {
        type: CTX_REF_TOKEN,
        raw: match[0],
        refType: match[1],
        refId: match[2],
      }
    },
  },

  parseMarkdown: (token) => {
    return {
      type: 'ctxRef',
      attrs: {
        refType: token.refType,
        refId: token.refId,
      },
    }
  },

  /**
   * 原样还原 comment marker
   * 两侧不补任何字符，保证 parse → serialize 往返幂等（参见 speaker 的教训）
   */
  renderMarkdown: (node) => {
    return `<!--ctx-ref:${node.attrs?.refType}:${node.attrs?.refId}-->`
  },

  addProseMirrorPlugins() {
    const onClick = this.options.onClick
    if (!onClick) {
      return []
    }

    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            click: (view: EditorView, event: MouseEvent) => {
              const target = event.target as HTMLElement | null
              const el = target?.closest?.('[data-ctx-ref]') as HTMLElement | null
              if (!el) {
                return false
              }

              const refType = el.getAttribute('data-ctx-ref') ?? ''
              /** 产品约定：mark 旗子无交互 */
              if (refType !== 'note' && refType !== 'image') {
                return false
              }

              const pos = view.posAtDOM(el, 0)
              onClick({
                refType,
                refId: el.getAttribute('data-ctx-id') ?? '',
                sentence: getLeadingSentence(view.state.doc, pos),
              }, event)
              return false
            },
          },
        },
      }),
    ]
  },
})

export const SummaryBoundaryNode = Node.create({
  name: 'summaryBoundary',
  group: 'block',
  atom: true,
  selectable: false,
  draggable: false,

  addAttributes() {
    return {
      kind: {
        default: 'start',
        parseHTML: element => element.getAttribute('data-summary-boundary'),
        renderHTML: attrs => ({ 'data-summary-boundary': attrs.kind }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-summary-boundary]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { class: 'tiptap-summary-boundary' }),
    ]
  },

  renderText() {
    return ''
  },

  markdownTokenName: BOUNDARY_TOKEN,

  markdownTokenizer: {
    name: BOUNDARY_TOKEN,
    level: 'block',
    start: BOUNDARY_START,
    tokenize: (src: string) => {
      const match = BOUNDARY_REGEX.exec(src)
      if (!match)
        return undefined
      return {
        type: BOUNDARY_TOKEN,
        raw: match[0],
        kind: match[1],
      }
    },
  },

  parseMarkdown: (token) => {
    return {
      type: 'summaryBoundary',
      attrs: { kind: token.kind },
    }
  },

  renderMarkdown: (node) => {
    return `<!--summary-added-images:${node.attrs?.kind}-->`
  },
})
