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
import type { CtxRefIconContext, CtxRefIconRenderer, CtxRefImageItem, CtxRefOptions, CtxRefStorage, CtxRefType, KnownCtxRefType } from './types'
import { mergeAttributes, Node } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { TIPTAP_DATA_ATTR } from 'tiptap-utils'
import { builtinCtxRefIcons } from './builtin-icons'
import {
  CTX_REF_START,
  CTX_REF_TOKEN,
  isClickableCtxRefType,
  parseCtxRefMarkdownToken,
  renderCtxRefMarker,
  tokenizeCtxRefMarkdown,
} from './rules'

/**
 * 取 marker 前紧邻的加粗斜体句（随点击回调一并抛出）
 *
 * 约定：与引用对应的一句话以 ***加粗斜体*** 紧邻 marker 之前
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

  /**
   * `image` 角标的 URL 表（refId → url），由 `setCtxRefImages` 写入
   *
   * 放 storage 而非 options：options 在扩展注册时就固化，而 URL 往往晚于编辑器
   * 构造才到达（原生推送 / 接口返回）。storage 可在运行时改写，内置图标工厂
   * 每次重绘都读最新值
   */
  addStorage() {
    return {
      imageUrls: new Map<string, string>(),
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
      /**
       * 图标重绘计数器。同为纯运行时 UI 状态（`rendered: false`）
       *
       * 存在的理由：图标工厂只在 NodeView 创建 / attrs 变化时跑，工厂闭包里的外部
       * 数据源（如「refId → 图片 URL」映射表）晚于内容到达时，已渲染的角标不会自己
       * 重画。`refreshCtxRefIcons` 递增此值即可精确触发重绘，无需重建文档
       */
      iconVersion: {
        default: 0,
        rendered: false,
      },
      /** marker 后的横向空白：渲染时隐藏，序列化 Markdown 时原样还原 */
      trailingWhitespace: {
        default: '',
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

      let current = node.attrs as { refType: CtxRefType, refId: string, streaming: boolean, iconVersion: number }

      const resolvePos = () => (typeof getPos === 'function'
        ? getPos()
        : undefined)

      const render = () => {
        dom.replaceChildren()

        const pos = resolvePos()
        const previousIsCtxRef = pos !== undefined
          && pos >= 0
          && pos <= editor.state.doc.content.size
          && editor.state.doc.resolve(pos).nodeBefore?.type.name === 'ctxRef'
        const iconMargin = current.refType === 'note' || current.refType === 'image'
          ? 8
          : 7
        dom.style.marginLeft = previousIsCtxRef
          ? `-${iconMargin}px`
          : ''

        dom.setAttribute('data-ctx-ref', current.refType)
        dom.setAttribute('data-ctx-id', current.refId)
        if (current.streaming)
          dom.setAttribute(TIPTAP_DATA_ATTR.ctxRef.streaming, '')
        else
          dom.removeAttribute(TIPTAP_DATA_ATTR.ctxRef.streaming)

        dom.className = [
          'tiptap-ctx-ref',
          `tiptap-ctx-ref--${current.refType}`,
          current.streaming
            ? 'tiptap-ctx-ref--streaming'
            : '',
          options.className ?? '',
        ].filter(Boolean).join(' ')

        const configured = options.icons?.[current.refType]
        /** undefined → 内置默认；false / null → 不渲染；函数 → 自定义；未知类型无内置图标 → 不渲染 */
        const builtin = builtinCtxRefIcons[current.refType as KnownCtxRefType] as CtxRefIconRenderer | undefined
        const renderer = configured === undefined
          ? builtin
          : configured

        if (renderer) {
          /** ctx.defaultIcon 让自定义工厂能取到内置图标做二次加工（包装 / 样式 / 绑事件） */
          const ctx: CtxRefIconContext = {
            refType: current.refType,
            refId: current.refId,
            streaming: current.streaming,
            editor: editor as Editor,
            getPos: resolvePos,
            defaultIcon: () => builtin?.(ctx) ?? null,
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
            || prev.iconVersion !== current.iconVersion
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
      return tokenizeCtxRefMarkdown(src)
    },
  },

  parseMarkdown: (token) => {
    return parseCtxRefMarkdownToken(token)
  },

  /**
   * 原样还原 comment marker
   * 两侧不补任何字符，保证 parse → serialize 往返幂等
   */
  renderMarkdown: (node) => {
    return renderCtxRefMarker(node.attrs) + (node.attrs?.trailingWhitespace ?? '')
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

      /**
       * 写入 `image` 角标的 URL 表，并立刻重绘图片角标
       *
       * marker 里只有 `<!--ctx-ref:image:{id}-->`，URL 由业务侧提供（接口返回 /
       * 原生推送）。命中的角标渲染为缩略图，未命中的保持内置占位图标
       *
       * - **全量覆盖**而非增量合并：图片被删除时重推一次即可生效
       * - `id` 统一按字符串存，传数字会被转换（marker 里的 refId 永远是字符串）
       * - 调用时机不限，晚于内容设置也会重绘已渲染的占位角标
       * - 表内条目数读 `editor.storage.ctxRef.imageUrls.size`
       */
      setCtxRefImages: (list: CtxRefImageItem[]) => (props: CommandProps) => {
        const urls = props.editor.storage.ctxRef.imageUrls
        urls.clear()

        for (const item of Array.isArray(list)
          ? list
          : []) {
          const id = item?.id == null
            ? ''
            : String(item.id)

          if (id && item?.url)
            urls.set(id, item.url)
        }

        /**
         * 必须用 `props.commands` 而不是 `props.editor.commands`
         *
         * 后者会基于当前 state 另开一个事务并立即 dispatch，与外层这个 `tr` 同源，
         * 谁先落地另一个就成了陈旧事务，ProseMirror 抛
         * `RangeError: Applying a mismatched transaction`
         * `props.commands` 复用同一个 `tr`，写表与重绘合并成一次 dispatch
         *
         * 文档尚未设置时没有 marker，刷新返回 false，但表已写入，属正常路径
         */
        props.commands.refreshCtxRefIcons({ refType: 'image' })
        return true
      },

      /**
       * 强制重跑图标工厂，重绘匹配的 ctx-ref 角标
       *
       * 用于「工厂依赖的外部数据源晚于内容到达」：图标工厂只在 NodeView 创建 /
       * attrs 变化时执行，映射表（如 refId → 图片 URL）后到时，已渲染的角标仍是
       * 占位态。此命令递增运行时 `iconVersion`，触发 NodeView 重绘
       *
       * - 不传 target 刷新全部；传 `refType` / `refId` 收窄范围
       * - 走 `addToHistory: false`，不污染 undo 栈，也不动光标与选区
       * - 相比 `setMarkdown` 重建文档，代价小得多且不打断正在编辑的用户
       * - 无匹配节点时返回 `false`
       */
      refreshCtxRefIcons: (
        target?: { refType?: CtxRefType, refId?: string },
      ) => ({ tr, state, dispatch }: CommandProps) => {
        const { refType, refId } = target ?? {}

        let matched = false
        state.doc.descendants((node, pos) => {
          if (
            node.type.name === 'ctxRef'
            && (refType == null || node.attrs.refType === refType)
            && (refId == null || node.attrs.refId === refId)
          ) {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              iconVersion: (node.attrs.iconVersion ?? 0) + 1,
            })
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
              /** 内置 marker 均触发回调；载荷带 refType，由调用方按类型决定行为 */
              if (!isClickableCtxRefType(refType)) {
                return false
              }

              const pos = view.posAtDOM(el, 0)
              onClick({
                refType,
                refId: el.getAttribute('data-ctx-id') ?? '',
                sentence: getLeadingSentence(view.state.doc, pos),
              }, event)
              event.preventDefault()
              return true
            },
          },
        },
      }),
    ]
  },
})

declare module '@tiptap/core' {
  interface Storage {
    ctxRef: CtxRefStorage
  }

  interface Commands<ReturnType> {
    ctxRef: {
      /** 切换匹配 refId（可选 refType）的 ctx-ref 节点的流式态 */
      setCtxRefStreaming: (
        target: string | { refId: string, refType?: CtxRefType },
        streaming: boolean,
      ) => ReturnType
      /** 全量覆盖 image 角标的 URL 表并立刻重绘 */
      setCtxRefImages: (list: CtxRefImageItem[]) => ReturnType
      /** 重跑图标工厂重绘角标；不传 target 刷新全部，可按 refType / refId 收窄 */
      refreshCtxRefIcons: (
        target?: { refType?: CtxRefType, refId?: string },
      ) => ReturnType
    }
  }
}
