import type { Node as PMNode } from '@tiptap/pm/model'
import type { EditorView } from '@tiptap/pm/view'
import type { CtxRefOptions } from './types'
import { mergeAttributes, Node } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import {
  CTX_REF_START,
  CTX_REF_TOKEN,
  parseCtxRefMarkdownToken,
  renderCtxRefMarker,
  tokenizeCtxRefMarkdown,
} from './rules'

/**
 * 内置小图标（inline SVG，无外部 CSS / 图标库依赖）
 *
 * 示例只给两类默认外观：mark → 旗帜，note → 笔记；未知类型回落到 note。
 * 生产版是一整套可外部接管的图标工厂，示例刻意只留这一张最小映射
 */
const CTX_REF_ICON_SVG: Record<string, string> = {
  mark: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.34961 1.98271C2.34961 1.33283 2.96879 0.877713 3.57422 1.04131L3.69434 1.08232L11.2412 4.19268C12.1675 4.57443 12.1462 5.89295 11.208 6.24443L3.65039 9.07549V12.4993C3.6503 12.8582 3.35893 13.1497 3 13.1497C2.64107 13.1497 2.3497 12.8582 2.34961 12.4993V1.98271Z" fill="#FAD541"/></svg>`,
  note: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.1338 4.38379L12.2041 4.28125C12.2321 4.26444 12.3616 4.28424 12.6592 4.49707C12.9577 4.71059 12.9742 4.80942 12.9453 4.83203L12.8994 4.89941C13.0133 5.01947 13.0216 5.08297 13.0195 5.12109L12.8232 5.38477L10.7432 8.39551L8.63379 11.4238C8.17427 11.9149 7.15617 12.8316 6.83203 12.624C6.50788 12.4164 7.08767 11.152 7.41797 10.5459L11.8125 4.26953H11.8838L12.1338 4.38379ZM6.3125 4.3623C6.67109 4.36267 6.96177 4.65308 6.96191 5.01172C6.96169 5.37029 6.67104 5.66174 6.3125 5.66211H1.75C1.39115 5.66211 1.09983 5.37051 1.09961 5.01172C1.09975 4.65286 1.3911 4.3623 1.75 4.3623H6.3125ZM8.91895 1.40039C9.27774 1.40061 9.56934 1.69193 9.56934 2.05078C9.56911 2.40944 9.27761 2.70095 8.91895 2.70117H1.75C1.39115 2.70117 1.09983 2.40958 1.09961 2.05078C1.09961 1.6918 1.39101 1.40039 1.75 1.40039H8.91895Z" fill="currentColor" fill-opacity="0.6"/></svg>`,
}

function ctxRefIconSvg(refType: string): string {
  return CTX_REF_ICON_SVG[refType] ?? CTX_REF_ICON_SVG.note
}

/**
 * 取 marker 前紧邻的加粗斜体句（随点击回调一并抛出）
 *
 * 约定：与引用对应的一句话以 `***加粗斜体***` 紧邻 marker 之前，
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

/**
 * CtxRef 上下文引用锚点（示例节点）
 *
 * markdown 里的 `<!--ctx-ref:{type}:{id}-->` 会被解析成一个行内**原子节点**，
 * 作为「不可见数据锚点」把总结里的一句话关联到某个资源（mark / note / …）。
 * 教学目标见同目录 README，核心三件事：
 * 1. 词法层消费 marker（含未知类型）——否则通用 HTML 解析会产出非法 doc 致崩溃
 * 2. `renderMarkdown` 原样吐回 marker——保证「加载 → 编辑 → 保存」往返幂等、锚点不丢
 * 3. `renderText` 返回 ''——锚点不进入纯文本 / 搜索（与 speaker 示例正相反）
 *
 * 相比业务生产版，示例刻意去掉了内置图标库、流式动效、图标工厂契约，
 * 只渲染一个简单可点的小圆点
 */
export const CtxRefNode = Node.create<CtxRefOptions>({
  name: CTX_REF_TOKEN,
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

  /** getHTML / 复制 HTML 通道：产出带 data 属性的纯 span（图标只在 NodeView 实时渲染） */
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

  /** marker 不进入纯文本提取结果（getText / 搜索都读不到，保持不可见） */
  renderText() {
    return ''
  },

  /**
   * 编辑器内实时渲染：把锚点升格为一个可见、可点的小图标
   * （生产版在这里挂图标库 / 流式动效；示例只给最小可交互形态）
   */
  addNodeView() {
    const options = this.options

    return ({ node }) => {
      const dom = document.createElement('span')
      dom.setAttribute('contenteditable', 'false')
      dom.setAttribute('data-ctx-ref', node.attrs.refType)
      dom.setAttribute('data-ctx-id', node.attrs.refId)
      dom.className = [
        'tiptap-ctx-ref',
        `tiptap-ctx-ref--${node.attrs.refType}`,
        options.className ?? '',
      ].filter(Boolean).join(' ')
      /** 无 CSS 依赖的默认外观：一张内联小图标，锚在斜体旁、鼠标可点 */
      dom.style.cssText = 'display:inline-flex;align-items:center;vertical-align:middle;margin:0 1px 0 3px;line-height:0;cursor:pointer;'
      dom.innerHTML = ctxRefIconSvg(node.attrs.refType)
      dom.title = `${node.attrs.refType}:${node.attrs.refId}`

      return {
        dom,
        /** atom 节点内部 DOM 自管，忽略 PM 的 DOM 变更观测 */
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
    tokenize: (src: string) => tokenizeCtxRefMarkdown(src),
  },

  parseMarkdown: token => parseCtxRefMarkdownToken(token),

  /** 原样还原 comment marker，两侧不补字符，保证 parse → serialize 往返幂等 */
  renderMarkdown: node => renderCtxRefMarker(node.attrs),

  /** 点击锚点回调：从 DOM 还原 attrs + 紧邻加粗斜体句，交给宿主 */
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

              const pos = view.posAtDOM(el, 0)
              onClick({
                refType: el.getAttribute('data-ctx-ref') ?? '',
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
