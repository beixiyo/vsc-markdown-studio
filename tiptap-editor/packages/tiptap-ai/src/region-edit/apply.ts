/**
 * applyOperations 引擎：把操作数组编译为单个 ProseMirror Transaction
 *
 * - 逐操作针对 tr.doc（中间态）重新寻址，操作天然按序生效
 * - 部分成功是设计行为：单条失败不影响其余操作
 * - 只构建不 dispatch，落盘 / 预览由调用方（facade）决定
 */

import type { Editor } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import type { Transaction } from '@tiptap/pm/state'
import type { BlockEntry } from './hash'
import type { RegionErrorCode, RegionOperation, RegionOperationResult } from './types'
import { hashBlock } from 'tiptap-utils'
import { parseContentToNodes } from './content'
import { findBlock } from './hash'

/** 带协议错误码的操作异常 */
export class RegionOpError extends Error {
  constructor(public code: RegionErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'RegionOpError'
  }
}

/** 操作执行后用于装饰高亮的范围记录（from/to 为该步骤后的坐标，需经后续 mapping） */
type DecoRecord = {
  /** 记录时已执行的 step 数，用 tr.mapping.slice(stepIndex) 映射到最终坐标 */
  stepIndex: number
  from: number
  to: number
}

export type BuiltOperations = {
  tr: Transaction
  results: RegionOperationResult[]
  /** 映射到最终文档坐标的装饰范围 */
  decoRanges: { from: number, to: number }[]
}

/**
 * 把操作数组编译为单个事务
 */
export function buildOperationsTransaction(editor: Editor, operations: RegionOperation[]): BuiltOperations {
  const tr = editor.state.tr
  const results: RegionOperationResult[] = []
  const decoRecords: DecoRecord[] = []

  for (const op of operations) {
    try {
      const outcome = execOperation(editor, tr, op)
      results.push({
        target: op.target,
        success: true,
        ...(outcome.newHash !== undefined
          ? { newHash: outcome.newHash }
          : {}),
      })
      if (outcome.decoRange) {
        decoRecords.push({ stepIndex: tr.steps.length, ...outcome.decoRange })
      }
    }
    catch (err) {
      results.push({
        target: op.target,
        success: false,
        error: err instanceof RegionOpError
          ? err.code
          : 'INVALID_OPERATION',
      })
    }
  }

  const decoRanges = decoRecords.map((record) => {
    const mapping = tr.mapping.slice(record.stepIndex)
    return {
      from: mapping.map(record.from, 1),
      to: mapping.map(record.to, -1),
    }
  })

  return { tr, results, decoRanges }
}

type OpOutcome = {
  newHash?: string | string[]
  decoRange?: { from: number, to: number }
}

function execOperation(editor: Editor, tr: Transaction, op: RegionOperation): OpOutcome {
  if (op.target === 'doc') {
    return execDocOperation(editor, tr, op)
  }
  return execBlockOperation(editor, tr, op)
}

/** target = "doc" 的文档级操作 */
function execDocOperation(editor: Editor, tr: Transaction, op: RegionOperation): OpOutcome {
  if (op.op !== 'append' && op.op !== 'prepend' && op.op !== 'replaceAll') {
    throw new RegionOpError('INVALID_OPERATION', `target "doc" 不支持 op "${op.op}"`)
  }

  const nodes = parseOpContent(editor, op)
  const size = totalSize(nodes)

  switch (op.op) {
    case 'append': {
      const pos = tr.doc.content.size
      tr.insert(pos, nodes)
      return { newHash: toNewHash(nodes), decoRange: { from: pos, to: pos + size } }
    }
    case 'prepend': {
      tr.insert(0, nodes)
      return { newHash: toNewHash(nodes), decoRange: { from: 0, to: size } }
    }
    case 'replaceAll': {
      tr.replaceWith(0, tr.doc.content.size, nodes)
      return { newHash: toNewHash(nodes), decoRange: { from: 0, to: size } }
    }
  }
}

/** target = 块 hash 的块级操作 */
function execBlockOperation(editor: Editor, tr: Transaction, op: RegionOperation): OpOutcome {
  const entry = findBlock(tr.doc, op.target)
  if (!entry) {
    throw new RegionOpError('TARGET_NOT_FOUND')
  }

  switch (op.op) {
    case 'replace': {
      const nodes = parseOpContent(editor, op)
      tr.replaceWith(entry.pos, entry.pos + entry.node.nodeSize, nodes)
      return {
        newHash: toNewHash(nodes),
        decoRange: { from: entry.pos, to: entry.pos + totalSize(nodes) },
      }
    }

    case 'insertBefore': {
      const nodes = parseOpContent(editor, op)
      tr.insert(entry.pos, nodes)
      return {
        newHash: toNewHash(nodes),
        decoRange: { from: entry.pos, to: entry.pos + totalSize(nodes) },
      }
    }

    case 'insertAfter': {
      const nodes = parseOpContent(editor, op)
      const pos = entry.pos + entry.node.nodeSize
      tr.insert(pos, nodes)
      return {
        newHash: toNewHash(nodes),
        decoRange: { from: pos, to: pos + totalSize(nodes) },
      }
    }

    case 'delete': {
      tr.delete(entry.pos, entry.pos + entry.node.nodeSize)
      return {}
    }

    case 'searchReplace': {
      if (!op.search || op.replace === undefined) {
        throw new RegionOpError('INVALID_OPERATION', 'searchReplace 需要 search 与 replace 字段')
      }
      const range = findTextRangeInBlock(entry, op.search)
      tr.insertText(op.replace, range.from, range.to)

      const updated = tr.doc.childAfter(entry.pos)
      return {
        newHash: updated.node
          ? hashBlock(updated.node)
          : undefined,
        decoRange: { from: range.from, to: range.from + op.replace.length },
      }
    }

    default:
      throw new RegionOpError('INVALID_OPERATION', `块目标不支持 op "${op.op}"`)
  }
}

/** 解析 content 字段，失败统一抛 INVALID_CONTENT */
function parseOpContent(editor: Editor, op: RegionOperation): PMNode[] {
  if (!op.content?.value) {
    throw new RegionOpError('INVALID_CONTENT', `op "${op.op}" 缺少 content`)
  }
  try {
    return parseContentToNodes(editor, op.content)
  }
  catch {
    throw new RegionOpError('INVALID_CONTENT')
  }
}

/**
 * 在块内定位 search 串的文档绝对坐标
 *
 * 把块内文本按出现顺序拼接（跨段落处插入 \n 哨兵，阻止跨块误匹配），
 * 同时记录每个字符的绝对位置，命中后直接换算 from/to
 */
function findTextRangeInBlock(entry: BlockEntry, search: string): { from: number, to: number } {
  let text = ''
  const posMap: number[] = []

  entry.node.descendants((child, relPos) => {
    if (child.isTextblock && text.length > 0) {
      text += '\n'
      posMap.push(-1)
    }
    if (child.isText && child.text) {
      for (let i = 0; i < child.text.length; i++) {
        posMap.push(entry.pos + 1 + relPos + i)
      }
      text += child.text
    }
    return true
  })

  const first = text.indexOf(search)
  if (first === -1) {
    throw new RegionOpError('SEARCH_NOT_FOUND')
  }
  if (text.includes(search, first + 1)) {
    throw new RegionOpError('SEARCH_NOT_UNIQUE')
  }

  const from = posMap[first]
  const last = posMap[first + search.length - 1]
  if (from === -1 || last === -1 || from === undefined || last === undefined) {
    /** 命中了跨块哨兵，视为无有效匹配 */
    throw new RegionOpError('SEARCH_NOT_FOUND')
  }

  return { from, to: last + 1 }
}

function totalSize(nodes: PMNode[]): number {
  return nodes.reduce((sum, node) => sum + node.nodeSize, 0)
}

function toNewHash(nodes: PMNode[]): string | string[] {
  const hashes = nodes.map(node => hashBlock(node))
  return hashes.length === 1
    ? hashes[0]
    : hashes
}
