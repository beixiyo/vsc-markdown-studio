/**
 * 内容序列化 / 反序列化 / lossy 检测
 *
 * Markdown 走 @tiptap/markdown 的 MarkdownManager（经 editor.markdown 访问）；
 * HTML 走 ProseMirror DOMParser / DOMSerializer，按编辑器 schema 解析，天然支持自定义节点
 */

import type { Editor } from '@tiptap/core'
import type { MarkdownManager } from '@tiptap/markdown'
import type { Node as PMNode } from '@tiptap/pm/model'
import type { RegionContent } from './types'
import { DOMSerializer, DOMParser as PMDOMParser } from '@tiptap/pm/model'

/**
 * 取 MarkdownManager；编辑器未启用 Markdown 扩展时抛错（本协议的硬前提）
 */
export function getMarkdownManager(editor: Editor): MarkdownManager {
  const manager = editor.markdown ?? editor.storage.markdown?.manager
  if (!manager) {
    throw new Error('[region-edit] 编辑器未启用 @tiptap/markdown 扩展，无法序列化块内容')
  }
  return manager
}

/**
 * 单块 → Markdown
 */
export function serializeBlockMarkdown(editor: Editor, node: PMNode): string {
  return getMarkdownManager(editor).serialize({ type: 'doc', content: [node.toJSON()] })
}

/**
 * 单块 → HTML（无损，含自定义节点的 data-* 属性）
 */
export function serializeBlockHtml(editor: Editor, node: PMNode): string {
  const serializer = DOMSerializer.fromSchema(editor.schema)
  const container = document.createElement('div')
  container.appendChild(serializer.serializeNode(node))
  return container.innerHTML
}

/**
 * 操作 content → 顶层 ProseMirror 节点数组
 *
 * @throws 解析结果为空或非法时抛错，由调用方转为 INVALID_CONTENT
 */
export function parseContentToNodes(editor: Editor, content: RegionContent): PMNode[] {
  const format = content.format ?? 'markdown'

  /** json 通道：直接按 schema 校验构造节点，无损（不经过 markdown / html 中间表示） */
  if (format === 'json') {
    return parseJsonToNodes(editor, content.value)
  }

  let docNode: PMNode
  if (format === 'html') {
    const container = document.createElement('div')
    container.innerHTML = String(content.value)
    docNode = PMDOMParser.fromSchema(editor.schema).parse(container)
  }
  else {
    const json = getMarkdownManager(editor).parse(String(content.value))
    docNode = editor.schema.nodeFromJSON(json)
  }

  const nodes: PMNode[] = []
  docNode.forEach(node => nodes.push(node))

  if (!nodes.length) {
    throw new Error('[region-edit] content 解析结果为空')
  }
  return nodes
}

/**
 * ProseMirror JSON → 顶层节点数组
 *
 * 接受三种形态：单节点对象、节点数组、整个 doc（取其 content）；字符串视为 JSON 串先解析。
 * 行内节点（如纯 text）不在顶层块词表内，nodeFromJSON 之后由 ProseMirror 在
 * replaceWith 时做 schema 校验，非法结构会抛错而不是污染文档
 */
function parseJsonToNodes(editor: Editor, value: RegionContent['value']): PMNode[] {
  const raw = typeof value === 'string'
    ? JSON.parse(value)
    : value

  const list = Array.isArray(raw)
    ? raw
    : raw?.type === 'doc'
      ? raw.content ?? []
      : [raw]

  const nodes = (list as Record<string, any>[]).map(item => editor.schema.nodeFromJSON(item))

  if (!nodes.length) {
    throw new Error('[region-edit] json content 解析结果为空')
  }
  return nodes
}

/**
 * lossy 检测：Markdown roundtrip（JSON → md → JSON）后内容不一致即视为有损
 *
 * 误报（标记 lossy 但其实无损）只是多附带一个 html 字段，无害；漏报才有害，所以比较从严
 */
export function isBlockLossy(editor: Editor, node: PMNode, markdown: string): boolean {
  try {
    const manager = getMarkdownManager(editor)
    const reparsed = manager.parse(markdown)
    const original = { type: 'doc', content: [node.toJSON()] }
    return !jsonContentEqual(normalizeJson(original), normalizeJson(reparsed))
  }
  catch {
    return true
  }
}

/**
 * 归一化 JSONContent：去掉值为 null / undefined 的 attrs 与空容器，避免「缺省 vs 显式空」造成误判
 */
function normalizeJson(value: any): any {
  if (Array.isArray(value)) {
    return value.map(normalizeJson)
  }
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {}
    for (const [key, val] of Object.entries(value)) {
      if (val === null || val === undefined)
        continue
      const normalized = normalizeJson(val)
      if (
        typeof normalized === 'object'
        && !Array.isArray(normalized)
        && Object.keys(normalized).length === 0
      ) {
        continue
      }
      if (Array.isArray(normalized) && normalized.length === 0)
        continue
      out[key] = normalized
    }
    return out
  }
  return value
}

function jsonContentEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
