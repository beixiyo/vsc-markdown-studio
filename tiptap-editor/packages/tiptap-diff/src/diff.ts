/**
 * 块级 diff：对比「当前文档」与「上次已同步快照」，产出最小 upsert / delete 操作
 *
 * 有了稳定 blockId，diff 退化为按 id 的集合比较（无需 LCS）：
 * - id 在 current 不在 prev，或内容 hash 变了 → upsert
 * - id 在 prev 不在 current → delete
 * - 纯重排（ids 与 hash 都没变、仅顺序变）→ 无 op，靠 order 数组表达
 */

import type { Editor } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import type { BlockDiffResult, BlockSnapshot, SyncContent, SyncOp } from './types'
import { fnv1a64, hashBlock, isBlockLossy, serializeBlockHtml, serializeBlockJson, serializeBlockMarkdown } from 'tiptap-utils'
import { SYNTHETIC_ID_PREFIX } from './id'

export interface BuildDiffOptions {
  /** 块身份 attr 名 @default 'blockId' */
  attributeName: string
  /** lossy 块的降级格式 @default 'html' */
  lossyFormat: 'html' | 'json'
}

export interface SyncIndexEntry {
  id: string
  hash: string
  type: string
  node: PMNode
}

/**
 * 构建当前文档的顶层块索引（id + 内容 hash）
 *
 * 容错：理论上经 BlockId 扩展后每块都有 id；万一缺失（如未注册扩展 / 未知类型），
 * 用 `__noid_{下标}_{hash}` 兜底，diff 仍可运作（只是该块退化为按位置匹配）
 */
export function buildSyncIndex(editor: Editor, attributeName: string): SyncIndexEntry[] {
  const entries: SyncIndexEntry[] = []
  let index = 0

  editor.state.doc.forEach((node) => {
    const hash = hashBlock(node, { stripAttr: attributeName })
    const rawId = node.attrs?.[attributeName]
    const id = typeof rawId === 'string' && rawId
      ? rawId
      : `${SYNTHETIC_ID_PREFIX}${index}_${hash}`

    entries.push({ id, hash, type: node.type.name, node })
    index += 1
  })

  return entries
}

/**
 * 把单块序列化为同步内容载荷（markdown 为主，lossy 降级 html / json）
 */
export function buildBlockContent(
  editor: Editor,
  node: PMNode,
  options: BuildDiffOptions,
): { content: SyncContent, lossy: boolean } {
  const { attributeName, lossyFormat } = options

  let markdown = ''
  try {
    markdown = serializeBlockMarkdown(editor, node).trim()
  }
  catch {
    markdown = node.textContent
  }

  const lossy = isBlockLossy(editor, node, markdown, { stripAttr: attributeName })
  if (!lossy) {
    return { content: { format: 'markdown', value: markdown }, lossy: false }
  }

  if (lossyFormat === 'json') {
    return { content: { format: 'json', value: serializeBlockJson(node, { stripAttr: attributeName }) }, lossy: true }
  }
  return { content: { format: 'html', value: serializeBlockHtml(editor, node) }, lossy: true }
}

/**
 * 计算「当前文档」相对「prev 快照」的增量
 */
export function computeBlockDiff(
  editor: Editor,
  prev: BlockSnapshot,
  options: BuildDiffOptions,
): BlockDiffResult {
  const index = buildSyncIndex(editor, options.attributeName)
  const order = index.map(e => e.id)
  const ops: SyncOp[] = []
  const hashes = new Map<string, string>()

  for (const entry of index) {
    hashes.set(entry.id, entry.hash)

    /** 新块 或 内容变了 → upsert */
    if (prev.hashes.get(entry.id) !== entry.hash) {
      const { content, lossy } = buildBlockContent(editor, entry.node, options)
      ops.push({
        op: 'upsert',
        id: entry.id,
        type: entry.type,
        hash: entry.hash,
        content,
        ...(lossy
          ? { lossy: true }
          : {}),
      })
    }
  }

  /** prev 有、current 无 → delete */
  for (const id of prev.hashes.keys()) {
    if (!hashes.has(id)) {
      ops.push({ op: 'delete', id })
    }
  }

  const checksum = computeChecksum(index)
  const orderChanged = !arrayEqual(order, prev.order)
  const snapshot: BlockSnapshot = { hashes, order, checksum }

  return {
    ops,
    order,
    checksum,
    orderChanged,
    changed: ops.length > 0 || orderChanged,
    snapshot,
  }
}

/**
 * 文档校验和：fnv1a64 over 有序的 `id\0hash`，用于后端比对、静默漂移检测
 */
export function computeChecksum(index: SyncIndexEntry[]): string {
  return fnv1a64(index.map(e => `${e.id}\x00${e.hash}`).join('\x01'))
}

/** 空快照（首次同步基线 / resync 用） */
export function emptySnapshot(): BlockSnapshot {
  return { hashes: new Map(), order: [], checksum: fnv1a64('') }
}

function arrayEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length)
    return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i])
      return false
  }
  return true
}
