/**
 * content → 节点反序列化（region-edit 专用）+ 复用 tiptap-utils 的块序列化原语
 *
 * 「块 → markdown / html / json」与 lossy 检测统一收在 `tiptap-utils`（与 block-sync 共用单一真相源）；
 * 这里只保留 region-edit 独有的「content → 顶层节点数组」解析（把外部内容解析进编辑器）
 */

import type { Editor } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import type { RegionContent } from './types'
import { DOMParser as PMDOMParser } from '@tiptap/pm/model'
import { getMarkdownManager } from 'tiptap-utils'

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
