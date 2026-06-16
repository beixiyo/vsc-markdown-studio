/**
 * HTML comment marker 兼容层：把 `<!--...-->` marker 升格为真实文档节点
 *
 * 背景：ProseMirror 的 DOMParser 不解析 comment 节点，`<!--ctx-ref:...-->` 这类
 * marker 经编辑器 roundtrip 会被静默丢弃。本模块通过 @tiptap/markdown 的
 * markdownTokenizer 在词法层把 marker 解析为不可见的 atom 节点，序列化时原样还原，
 * 保证「加载 → 编辑 → 保存」全程 marker 不丢、不变形
 *
 * - `CtxRefNode`：`<!--ctx-ref:{type}:{id}-->` → 行内数据锚点（携带 data 属性与点击事件；
 *   默认渲染内置图标，可经 `options.icons` 覆盖或传 `false` / `null` 关闭）
 */

import type { CommandProps, Editor, NodeViewRendererProps } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import type { EditorView } from '@tiptap/pm/view'
import type { CtxRefIconContext, CtxRefOptions, CtxRefType } from './types'
import { mergeAttributes, Node } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { builtinCtxRefIcons } from './builtin-icons'

const CTX_REF_TOKEN = 'ctxRef'
const CTX_REF_START = '<!--ctx-ref:'
const CTX_REF_REGEX = /^<!--ctx-ref:(mark|note|image):([\w-]+)-->/

/**
 * 取 marker 前紧邻的加粗斜体句（随点击回调一并抛出）
 *
 * 约定：与引用对应的一句话以 ***加粗斜体*** 紧邻 marker 之前。
 * 向前收集同段内连续的 bold + italic 文本
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
      icons: undefined,
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
      /**
       * 流式替换态（图标渲染为动效）。纯运行时 UI 状态：
       * 不进 HTML / Markdown（`rendered: false`），不参与 marker 往返，
       * 仅由 `setCtxRefStreaming` 命令在编辑器内临时切换
       */
      streaming: {
        default: false,
        rendered: false,
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

  /**
   * 编辑器内的实时渲染：把锚点升格为可见图标挂载点
   *
   * - 默认渲染内置图标；`options.icons[refType]` 传函数则自定义，传 `false` / `null` 则不渲染
   * - `streaming` 变化时重新调用工厂，实现「静态图标 ⇄ 流式动效」切换
   *
   * 注：`renderHTML` 仅产出带 data 属性的纯 span，供 getHTML / 复制 / HTML 通道往返；
   * 图标只在 NodeView 实时渲染，不写入序列化结果
   */
  addNodeView() {
    const options = this.options
    return ({ node, editor, getPos }: NodeViewRendererProps) => {
      const dom = document.createElement('span')
      dom.setAttribute('contenteditable', 'false')

      let current = node.attrs as { refType: CtxRefType, refId: string, streaming: boolean }

      const resolvePos = () => (typeof getPos === 'function'
        ? getPos()
        : undefined)

      const render = () => {
        dom.replaceChildren()

        dom.setAttribute('data-ctx-ref', current.refType)
        dom.setAttribute('data-ctx-id', current.refId)
        if (current.streaming)
          dom.setAttribute('data-streaming', '')
        else
          dom.removeAttribute('data-streaming')

        dom.className = [
          'tiptap-ctx-ref',
          `tiptap-ctx-ref--${current.refType}`,
          current.streaming
            ? 'tiptap-ctx-ref--streaming'
            : '',
          options.className ?? '',
        ].filter(Boolean).join(' ')

        const configured = options.icons?.[current.refType]
        /** undefined → 内置默认；false / null → 不渲染；函数 → 自定义 */
        const renderer = configured === undefined
          ? builtinCtxRefIcons[current.refType]
          : configured

        if (renderer) {
          /** ctx.defaultIcon 让自定义工厂能取到内置图标做二次加工（包装 / 样式 / 绑事件） */
          const ctx: CtxRefIconContext = {
            refType: current.refType,
            refId: current.refId,
            streaming: current.streaming,
            editor: editor as Editor,
            getPos: resolvePos,
            defaultIcon: () => builtinCtxRefIcons[current.refType](ctx) ?? null,
          }
          const iconEl = renderer(ctx)
          if (iconEl)
            dom.appendChild(iconEl)
        }
      }

      render()

      return {
        dom,
        update: (newNode) => {
          if (newNode.type.name !== 'ctxRef')
            return false
          const prev = current
          current = newNode.attrs as typeof current
          if (
            prev.refType !== current.refType
            || prev.refId !== current.refId
            || prev.streaming !== current.streaming
          ) {
            render()
          }
          return true
        },
        /** atom 节点内部 DOM 由工厂托管，忽略 PM 的 DOM 变更观测 */
        ignoreMutation: () => true,
        /** 不拦截事件，交给 onClick 的 ProseMirror 插件统一处理 */
        stopEvent: () => false,
      }
    }
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
   * 两侧不补任何字符，保证 parse → serialize 往返幂等
   */
  renderMarkdown: (node) => {
    return `<!--ctx-ref:${node.attrs?.refType}:${node.attrs?.refId}-->`
  },

  addCommands() {
    return {
      /**
       * 切换匹配 refId 的 ctx-ref 节点的流式态（图标随之在「静态 ⇄ 动效」间切换）
       *
       * - 同一 refId 的多个节点会一并切换；可选 `refType` 进一步收窄
       * - 走 `addToHistory: false`，不污染 undo 栈（流式是临时 UI 态，不应被撤销）
       * - 无匹配节点时返回 `false`
       */
      setCtxRefStreaming: (
        target: string | { refId: string, refType?: CtxRefType },
        streaming: boolean,
      ) => ({ tr, state, dispatch }: CommandProps) => {
        const refId = typeof target === 'string'
          ? target
          : target.refId
        const refType = typeof target === 'string'
          ? undefined
          : target.refType

        let matched = false
        state.doc.descendants((node, pos) => {
          if (
            node.type.name === 'ctxRef'
            && node.attrs.refId === refId
            && (refType == null || node.attrs.refType === refType)
          ) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, streaming })
            matched = true
          }
        })

        if (matched && dispatch) {
          tr.setMeta('addToHistory', false)
          dispatch(tr)
        }
        return matched
      },
    }
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

              const refType = el.getAttribute('data-ctx-ref')
              /** 三类 marker 均触发回调；载荷带 refType，由调用方按类型决定行为 */
              if (refType !== 'mark' && refType !== 'note' && refType !== 'image') {
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

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    ctxRef: {
      /** 切换匹配 refId（可选 refType）的 ctx-ref 节点的流式态 */
      setCtxRefStreaming: (
        target: string | { refId: string, refType?: CtxRefType },
        streaming: boolean,
      ) => ReturnType
    }
  }
}
