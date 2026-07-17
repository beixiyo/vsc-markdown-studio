import type { CtxRefAttributes, CtxRefType } from './types'

/** @example `ctxRef` token 会被 parse 为 `{ type: 'ctxRef', attrs: { refType, refId } }` */
export const CTX_REF_TOKEN = 'ctxRef'

/** @example `<!--ctx-ref:note:42-->` 的起始片段为 `<!--ctx-ref:` */
export const CTX_REF_START = '<!--ctx-ref:'

/**
 * 匹配单个 ctx-ref marker，且必须从字符串起始位置开始
 *
 * 类型段不做白名单（`[\w-]+`）：未知类型也必须在词法层被消费成 ctxRef 节点，
 * 否则会落入 @tiptap/markdown 的通用 HTML 解析产出非法 doc（详见 README）
 *
 * @example
 * CTX_REF_REGEX.exec('<!--ctx-ref:note:42-->text')?.slice(1)
 * // => ['note', '42']
 */
export const CTX_REF_REGEX = /^<!--ctx-ref:([\w-]+):([\w-]+)-->/

/**
 * 全局匹配 ctx-ref marker，用于非 Tiptap 场景批量替换 / 剥离
 *
 * @example
 * 'a<!--ctx-ref:note:1-->b'.replace(CTX_REF_GLOBAL_REGEX, '$1:$2')
 * // => 'anote:1b'
 */
export const CTX_REF_GLOBAL_REGEX = /<!--ctx-ref:([\w-]+):([\w-]+)-->/g

export type CtxRefMarkdownToken = {
  type: typeof CTX_REF_TOKEN
  raw: string
  refType: CtxRefType
  refId: string
}

/**
 * 将 markdown 源码当前位置的 ctx-ref marker 转成 marked token
 *
 * @example
 * tokenizeCtxRefMarkdown('<!--ctx-ref:mark:17316--> tail')
 * // => { type: 'ctxRef', raw: '<!--ctx-ref:mark:17316-->', refType: 'mark', refId: '17316' }
 */
export function tokenizeCtxRefMarkdown(src: string): CtxRefMarkdownToken | undefined {
  const match = CTX_REF_REGEX.exec(src)
  if (!match)
    return undefined

  return {
    type: CTX_REF_TOKEN,
    raw: match[0],
    refType: match[1],
    refId: match[2],
  }
}

/**
 * 将 marked token 转成 Tiptap markdown parser 可消费的 JSON 节点
 *
 * @example
 * parseCtxRefMarkdownToken({ refType: 'note', refId: '42' })
 * // => { type: 'ctxRef', attrs: { refType: 'note', refId: '42' } }
 */
export function parseCtxRefMarkdownToken(token: unknown) {
  const attrs = token as { refType?: unknown, refId?: unknown } | null

  return {
    type: 'ctxRef',
    attrs: {
      refType: String(attrs?.refType || ''),
      refId: String(attrs?.refId || ''),
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
 * 批量替换 markdown 中的 ctx-ref marker
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
 * 删除 markdown 中的 ctx-ref marker（不可见数据锚点）
 *
 * 用于复制 / 导出等「锚点不该出现在产出文本里」的场景。**保存 / 往返序列化不要用它**，
 * 否则资源定位锚点会丢失
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
