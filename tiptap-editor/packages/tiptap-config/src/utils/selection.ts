/**
 * 选择相关工具函数
 */
import type { Node as PMNode } from '@tiptap/pm/model'
import {
  AllSelection,
  NodeSelection,
  Selection,
  TextSelection,
} from '@tiptap/pm/state'
import { cellAround, CellSelection } from '@tiptap/pm/tables'
import {
  type Editor,
  findParentNodeClosestToPos,
  type NodeWithPos,
} from '@tiptap/react'

/**
 * 确定当前选择是否包含类型与提供的节点类型名称之一匹配的节点
 * @param editor Tiptap 编辑器实例
 * @param nodeTypeNames 要匹配的节点类型名称列表
 * @param checkAncestorNodes 是否检查深度链上的祖先节点类型
 */
export function isNodeTypeSelected(
  editor: Editor | null,
  nodeTypeNames: string[] = [],
  checkAncestorNodes: boolean = false,
): boolean {
  if (!editor || !editor.state.selection)
    return false

  const { selection } = editor.state
  if (selection.empty)
    return false

  // Direct node selection check
  if (selection instanceof NodeSelection) {
    const selectedNode = selection.node
    return selectedNode
      ? nodeTypeNames.includes(selectedNode.type.name)
      : false
  }

  // Depth-based ancestor node check
  if (checkAncestorNodes) {
    const { $from } = selection
    for (let depth = $from.depth; depth > 0; depth--) {
      const ancestorNode = $from.node(depth)
      if (nodeTypeNames.includes(ancestorNode.type.name)) {
        return true
      }
    }
  }

  return false
}

/**
 * 检查当前选择是否完全位于类型名称在提供的 `types` 列表中的节点内
 *
 * - NodeSelection → 检查选定的节点
 * - Text/AllSelection → 确保 [from, to) 内的所有文本块都是允许的
 */
export function selectionWithinConvertibleTypes(
  editor: Editor,
  types: string[] = [],
): boolean {
  if (!editor || types.length === 0)
    return false

  const { state } = editor
  const { selection } = state
  const allowed = new Set(types)

  if (selection instanceof NodeSelection) {
    const nodeType = selection.node?.type?.name
    return !!nodeType && allowed.has(nodeType)
  }

  if (selection instanceof TextSelection || selection instanceof AllSelection) {
    let valid = true
    state.doc.nodesBetween(selection.from, selection.to, (node) => {
      if (node.isTextblock && !allowed.has(node.type.name)) {
        valid = false
        return false // stop early
      }
      return valid
    })
    return valid
  }

  return false
}

/**
 * 从当前选择中检索指定类型的所有节点
 * @param selection 当前编辑器选择
 * @param allowedNodeTypes 要查找的节点类型名称数组（例如 ["image", "table"]）
 * @returns 包含节点及其位置的对象数组
 */
export function getSelectedNodesOfType(
  selection: Selection,
  allowedNodeTypes: string[],
): NodeWithPos[] {
  const results: NodeWithPos[] = []
  const allowed = new Set(allowedNodeTypes)

  if (selection instanceof CellSelection) {
    selection.forEachCell((node: PMNode, pos: number) => {
      if (allowed.has(node.type.name)) {
        results.push({ node, pos })
      }
    })
    return results
  }

  if (selection instanceof NodeSelection) {
    const { node, from: pos } = selection
    if (node && allowed.has(node.type.name)) {
      results.push({ node, pos })
    }
    return results
  }

  const { $anchor } = selection
  const cell = cellAround($anchor)

  if (cell) {
    const cellNode = selection.$anchor.doc.nodeAt(cell.pos)
    if (cellNode && allowed.has(cellNode.type.name)) {
      results.push({ node: cellNode, pos: cell.pos })
      return results
    }
  }

  // Fallback: find parent nodes of allowed types
  const parentNode = findParentNodeClosestToPos($anchor, node =>
    allowed.has(node.type.name))

  if (parentNode) {
    results.push({ node: parentNode.node, pos: parentNode.pos })
  }

  return results
}