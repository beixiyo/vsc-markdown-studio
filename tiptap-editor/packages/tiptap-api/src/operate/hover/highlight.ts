import type { Node as PMNode } from '@tiptap/pm/model'

import type { HoverContent, HoverHighlightSpec } from './types'

/**
 * 根据 HoverContent 生成 ProseMirror inline decoration 用的范围列表。
 * - `block`：仅当 `includeBlock` 填充了 `blockFrom`/`blockTo` 时才有
 * - `context`：`contextRadius > 0` 时有
 * - `line`：逻辑行范围（默认 hover 高亮主层）
 * 若块与上下文范围完全相同则只保留一层 context。
 */
export function getHoverHighlightSpecs(
  content: HoverContent | null,
  doc: PMNode,
): HoverHighlightSpec[] {
  if (!content)
    return []

  const size = doc.content.size

  const clamp = (from: number, to: number): { from: number, to: number } | null => {
    const f = Math.max(0, Math.min(from, size))
    const t = Math.max(0, Math.min(to, size))
    if (f >= t)
      return null
    return { from: f, to: t }
  }

  const blk = content.blockFrom != null && content.blockTo != null
    ? clamp(content.blockFrom, content.blockTo)
    : null
  const ctx = content.contextFrom != null && content.contextTo != null
    ? clamp(content.contextFrom, content.contextTo)
    : null
  const ln = content.lineInBlockFrom != null && content.lineInBlockTo != null
    ? clamp(content.lineInBlockFrom, content.lineInBlockTo)
    : null

  const same
    = blk != null
      && ctx != null
      && blk.from === ctx.from
      && blk.to === ctx.to

  if (same && ctx) {
    const out: HoverHighlightSpec[] = [{ ...ctx, layer: 'context' }]
    if (ln)
      out.push({ ...ln, layer: 'line' })
    return out
  }

  const specs: HoverHighlightSpec[] = []
  if (blk)
    specs.push({ ...blk, layer: 'block' })
  if (ctx)
    specs.push({ ...ctx, layer: 'context' })
  if (ln)
    specs.push({ ...ln, layer: 'line' })
  return specs
}
