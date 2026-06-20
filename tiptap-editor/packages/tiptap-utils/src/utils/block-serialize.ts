/**
 * 顶层块的序列化 / lossy 检测 —— region-edit（外部 → 编辑器）与 block-sync（编辑器 → 后端）共用
 *
 * 把「块 ↔ markdown / html / json」这组通用原语收在这里作为单一真相源：
 * - region-edit 用它把块导出给算法侧
 * - block-sync 用它把变化块发给后端（通过 `stripAttr` 在比较前剔除稳定 blockId）
 *
 * Markdown 走 @tiptap/markdown 的 MarkdownManager（`editor.markdown`）；
 * HTML 走 ProseMirror DOMSerializer，按 schema 解析，天然支持自定义节点
 */

import type { MarkdownManager } from '@tiptap/markdown'
import type { Node as PMNode } from '@tiptap/pm/model'
import type { Editor } from '@tiptap/react'
import { DOMSerializer } from '@tiptap/pm/model'

/**
 * 取 MarkdownManager；编辑器未启用 @tiptap/markdown 扩展时抛错
 */
export function getMarkdownManager(editor: Editor): MarkdownManager {
  const manager = editor.markdown ?? editor.storage.markdown?.manager
  if (!manager) {
    throw new Error('[tiptap-utils] 编辑器未启用 @tiptap/markdown 扩展，无法序列化块内容')
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
 * 单块 → ProseMirror JSON
 * @param node 顶层块节点
 * @param options 序列化选项；`stripAttr` 会在输出前递归剔除该 attr（如稳定 blockId），不传则原样输出
 */
export function serializeBlockJson(node: PMNode, options?: BlockSerializeOptions): Record<string, any> {
  const json = node.toJSON()
  return options?.stripAttr
    ? stripAttrDeep(json, options.stripAttr)
    : json
}

/**
 * lossy 检测：Markdown 往返（JSON → md → JSON）后内容不一致即视为有损
 *
 * 比较前两侧都归一化（去 null / 空容器）；可选 `stripAttr` 剔除稳定 id
 * （否则块上的身份 id 会让往返永远不等 → 全员误判 lossy）。
 * 误报无害（只多带 html / json），漏报有害，故比较从严
 */
export function isBlockLossy(editor: Editor, node: PMNode, markdown: string, options?: BlockSerializeOptions): boolean {
  try {
    const manager = getMarkdownManager(editor)
    const reparsed = manager.parse(markdown)
    const originalNode = options?.stripAttr
      ? stripAttrDeep(node.toJSON(), options.stripAttr)
      : node.toJSON()
    const original = { type: 'doc', content: [originalNode] }
    return !jsonContentEqual(normalizeJson(original), normalizeJson(reparsed))
  }
  catch {
    return true
  }
}

/**
 * 递归剥离 JSON 里指定 attr（把稳定 id 从内容比较 / hash 中排除）
 */
export function stripAttrDeep(value: any, attrName: string): any {
  if (Array.isArray(value)) {
    return value.map(v => stripAttrDeep(v, attrName))
  }
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {}
    for (const [key, val] of Object.entries(value)) {
      if (key === 'attrs' && val && typeof val === 'object') {
        const attrs: Record<string, any> = { ...(val as Record<string, any>) }
        delete attrs[attrName]
        out.attrs = stripAttrDeep(attrs, attrName)
      }
      else {
        out[key] = stripAttrDeep(val, attrName)
      }
    }
    return out
  }
  return value
}

/**
 * 归一化 JSONContent：去掉值为 null / undefined 的 attrs 与空容器
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

/** 块序列化可选项 */
export interface BlockSerializeOptions {
  /** 比较 / 序列化前需递归剔除的 attr 名（如稳定 blockId）；不传则不剔除 */
  stripAttr?: string
}
