import type { CtxRefAttributes, CtxRefType } from './types'

/** @example `ctxRef` token 会被 parse 为 `{ type: 'ctxRef', attrs: { refType, refId } }` */
export const CTX_REF_TOKEN = 'ctxRef'

/** @example `<!--ctx-ref:image:42-->` 的起始片段为 `<!--ctx-ref:` */
export const CTX_REF_START = '<!--ctx-ref:'

/**
 * 匹配单个 ctx-ref markdown marker，且 marker 必须从当前字符串起始位置开始
 *
 * 类型段不做白名单（`[\w-]+`）：未知类型也必须在词法层被消费成 ctxRef 节点。
 * 否则会落入 @tiptap/markdown 的通用 HTML 解析，行内 comment 可能被解析成
 * 「嵌在 inline 内容里的空 paragraph」，产出非法 doc，后续任何触及该段落的
 * transaction（如 setNodeMarkup）都会抛 RangeError 导致整页崩溃。
 * 未知类型的节点不可见、无交互，序列化时原样还原
 *
 * @example
 * CTX_REF_REGEX.exec('<!--ctx-ref:image:42-->text')?.slice(1)
 * // => ['image', '42']
 *
 * @example
 * CTX_REF_REGEX.test('text<!--ctx-ref:image:42-->')
 * // => false
 */
export const CTX_REF_REGEX = /^<!--ctx-ref:([\w-]+):([\w-]+)-->/

/**
 * 全局匹配 ctx-ref marker，用于非 Tiptap 场景批量替换或提取 marker。
 *
 * @example
 * 'a<!--ctx-ref:note:1-->b'.replace(CTX_REF_GLOBAL_REGEX, '$1:$2')
 * // => 'anote:1b'
 */
export const CTX_REF_GLOBAL_REGEX = /<!--ctx-ref:([\w-]+):([\w-]+)-->/g

/**
 * 默认允许交互的 ctx-ref 类型；未知类型仍会解析和序列化，但不会触发点击交互
 *
 * @example
 * isClickableCtxRefType('image')
 * // => true
 *
 * @example
 * isClickableCtxRefType('unknown')
 * // => false
 */
export const CLICKABLE_CTX_REF_TYPES = new Set<CtxRefType>(['mark', 'note', 'image', 'scribe'])

export type CtxRefMarkdownToken = {
  type: typeof CTX_REF_TOKEN
  raw: string
  refType: CtxRefType
  refId: string
  trailingWhitespace: string
}

/**
 * 将 markdown 源码当前位置的 ctx-ref marker 转成 marked token
 *
 * @example
 * tokenizeCtxRefMarkdown('<!--ctx-ref:mark:17316--> tail')
 * // => { type: 'ctxRef', raw: '<!--ctx-ref:mark:17316-->', refType: 'mark', refId: '17316' }
 *
 * @example
 * tokenizeCtxRefMarkdown('tail <!--ctx-ref:mark:17316-->')
 * // => undefined
 */
export function tokenizeCtxRefMarkdown(src: string): CtxRefMarkdownToken | undefined {
  const match = CTX_REF_REGEX.exec(src)
  if (!match)
    return undefined

  const trailingWhitespace = src
    .slice(match[0].length)
    .match(/^[ \t]+/)?.[0] ?? ''

  return {
    type: CTX_REF_TOKEN,
    raw: match[0] + trailingWhitespace,
    refType: match[1],
    refId: match[2],
    trailingWhitespace,
  }
}

/**
 * 将 marked token 转成 Tiptap markdown parser 可消费的 JSON 节点
 *
 * @example
 * parseCtxRefMarkdownToken({ refType: 'image', refId: '42' })
 * // => { type: 'ctxRef', attrs: { refType: 'image', refId: '42' } }
 */
export function parseCtxRefMarkdownToken(token: unknown) {
  const attrs = token as {
    refType?: unknown
    refId?: unknown
    trailingWhitespace?: unknown
  } | null

  return {
    type: 'ctxRef',
    attrs: {
      refType: String(attrs?.refType || ''),
      refId: String(attrs?.refId || ''),
      trailingWhitespace: String(attrs?.trailingWhitespace || ''),
    },
  }
}

/**
 * 将 ctx-ref 节点属性序列化回原始 marker
 *
 * @example
 * renderCtxRefMarker({ refType: 'note', refId: 'abc' })
 * // => '<!--ctx-ref:note:abc-->'
 */
export function renderCtxRefMarker(attrs: Partial<CtxRefAttributes> = {}) {
  return `<!--ctx-ref:${attrs.refType}:${attrs.refId}-->`
}

/**
 * 批量替换 markdown 中的 ctx-ref marker。
 *
 * @example
 * replaceCtxRefMarkers('x<!--ctx-ref:mark:1-->', ({ refType, refId }) => `${refType}:${refId}`)
 * // => 'xmark:1'
 */
export function replaceCtxRefMarkers(
  content: string,
  render: (attrs: { refType: string, refId: string, raw: string }) => string,
) {
  return content.replace(CTX_REF_GLOBAL_REGEX, (raw, refType: string, refId: string) => {
    return render({ refType, refId, raw })
  })
}

/**
 * 判断 ctx-ref 类型是否允许点击交互
 *
 * @example
 * isClickableCtxRefType('scribe')
 * // => true
 */
export function isClickableCtxRefType(refType: string | null | undefined): refType is CtxRefType {
  return !!refType && CLICKABLE_CTX_REF_TYPES.has(refType)
}

/**
 * 删除 markdown 中的 ctx-ref marker（不可见数据锚点）
 *
 * 用于复制 / 导出等「锚点不该出现在产出文本里」的场景。marker 只服务编辑器内的
 * 高亮跳转，删掉不影响可读内容；反过来，**保存 / 往返序列化不要用它**，
 * 否则 mark/note/image 的定位锚点会丢失
 *
 * @param options.types 只删这些 refType 的 marker；不传则删全部
 *
 * @example
 * stripCtxRefMarkers('x<!--ctx-ref:mark:1--><!--ctx-ref:note:2-->')
 * // => 'x'
 *
 * @example
 * stripCtxRefMarkers('x<!--ctx-ref:mark:1--><!--ctx-ref:note:2-->', { types: ['note'] })
 * // => 'x<!--ctx-ref:mark:1-->'
 */
export function stripCtxRefMarkers(content: string, options: StripCtxRefMarkersOptions = {}): string {
  const allow = options.types
    ? new Set<string>(options.types)
    : null

  return replaceCtxRefMarkers(content, ({ refType, raw }) => (allow && !allow.has(refType)
    ? raw
    : ''))
}

export type StripCtxRefMarkersOptions = {
  /** 只删这些 refType 的 marker；不传删全部 */
  types?: CtxRefType[]
}
