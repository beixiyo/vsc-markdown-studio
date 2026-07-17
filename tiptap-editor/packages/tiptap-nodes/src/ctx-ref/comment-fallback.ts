/**
 * 兜底 HTML 注释节点：在词法层消费所有未被更具体 tokenizer 处理的行内 `<!--...-->`
 *
 * 背景：@tiptap/markdown 的通用 HTML 解析会把行内 comment 解析成
 * 「嵌在 inline 内容里的空 paragraph」——非法 doc。渲染阶段不校验所以看不出异常，
 * 但后续任何触及该段落的 transaction（编辑、setNodeMarkup、切 checkbox 等）
 * 都会抛 `RangeError: Invalid content for node paragraph`，导致整页崩溃
 *
 * 本节点把注释吞成不可见 atom 并原样序列化还原，保证未知 marker 既不炸文档也不丢失
 *
 * 边界：
 * - `<!--ctx-ref:{type}:{id}-->` 让位给 CtxRefNode 的 tokenizer（不依赖注册顺序，按正则让行）
 * - 仅覆盖行内注释；独占一行的注释走 marked 的 block 词法，不经过 inline tokenizer
 *   （block 场景解析为空段落，结构合法，只是往返会丢，暂不处理）
 */
import { Node } from '@tiptap/core'
import { CTX_REF_REGEX } from './rules'

const HTML_COMMENT_TOKEN = 'htmlComment'
const HTML_COMMENT_REGEX = /^<!--[\s\S]*?-->/

export const HtmlCommentNode = Node.create({
  name: 'htmlComment',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: false,
  draggable: false,

  addAttributes() {
    return {
      /** 注释原文（含 `<!--` / `-->` 定界符），序列化时原样吐回 */
      raw: {
        default: '',
        parseHTML: element => element.getAttribute('data-html-comment') ?? '',
        renderHTML: attrs => ({ 'data-html-comment': attrs.raw }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-html-comment]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, style: 'display: none' }]
  },

  /** 注释不进入纯文本提取结果 */
  renderText() {
    return ''
  },

  markdownTokenName: HTML_COMMENT_TOKEN,

  markdownTokenizer: {
    name: HTML_COMMENT_TOKEN,
    level: 'inline',
    start: '<!--',
    tokenize: (src: string) => {
      /** 合法 ctx-ref marker 交给 CtxRefNode（返回 undefined 时 marked 会继续尝试其他 tokenizer） */
      if (CTX_REF_REGEX.test(src))
        return undefined

      const match = HTML_COMMENT_REGEX.exec(src)
      if (!match)
        return undefined

      return {
        type: HTML_COMMENT_TOKEN,
        raw: match[0],
      }
    },
  },

  parseMarkdown: (token) => {
    return {
      type: 'htmlComment',
      attrs: { raw: token.raw },
    }
  },

  /** 原样还原注释，保证 parse → serialize 往返幂等 */
  renderMarkdown: (node) => {
    return String(node.attrs?.raw ?? '')
  },
})
