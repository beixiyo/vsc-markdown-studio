/**
 * 节点操作相关工具函数
 */
import type { Node as PMNode } from '@tiptap/pm/model'
import type { Transaction } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/react'
import { TextSelection } from '@tiptap/pm/state'

/**
 * 检查值是否为有效数字（非 null、undefined 或 NaN）
 * @param value - 要检查的值
 * @returns 布尔值，表示该值是否为有效数字
 */
export function isValidPosition(pos: number | null | undefined): pos is number {
  return typeof pos === 'number' && pos >= 0
}

/**
 * 在指定位置查找节点，带有错误处理
 * @param editor Tiptap 编辑器实例
 * @param position 文档中要查找节点的位置
 * @returns 指定位置的节点，如果未找到则返回 null
 */
export function findNodeAtPosition(editor: Editor, position: number) {
  try {
    const node = editor.state.doc.nodeAt(position)
    if (!node) {
      console.warn(`No node found at position ${position}`)
      return null
    }
    return node
  }
  catch (error) {
    console.error(`Error getting node at position ${position}:`, error)
    return null
  }
}

/**
 * 查找文档中节点的位置和实例
 * @param props 包含编辑器、节点（可选）和节点位置（可选）的对象
 * @param props.editor Tiptap 编辑器实例
 * @param props.node 要查找的节点（如果提供了 nodePos 则可选）
 * @param props.nodePos 要查找的节点位置（如果提供了 node 则可选）
 * @returns 包含位置和节点的对象，如果未找到则返回 null
 */
export function findNodePosition(props: {
  editor: Editor | null
  node?: PMNode | null
  nodePos?: number | null
}): { pos: number, node: PMNode } | null {
  const { editor, node, nodePos } = props

  if (!editor || !editor.state?.doc)
    return null

  // Zero is valid position
  const hasValidNode = node !== undefined && node !== null
  const hasValidPos = isValidPosition(nodePos)

  if (!hasValidNode && !hasValidPos) {
    return null
  }

  // First search for the node in the document if we have a node
  if (hasValidNode) {
    let foundPos = -1
    let foundNode: PMNode | null = null

    editor.state.doc.descendants((currentNode, pos) => {
      // TODO: Needed?
      // if (currentNode.type && currentNode.type.name === node!.type.name) {
      if (currentNode === node) {
        foundPos = pos
        foundNode = currentNode
        return false
      }
      return true
    })

    if (foundPos !== -1 && foundNode !== null) {
      return { pos: foundPos, node: foundNode }
    }
  }

  // If we have a valid position, use findNodeAtPosition
  if (hasValidPos) {
    const nodeAtPos = findNodeAtPosition(editor, nodePos!)
    if (nodeAtPos) {
      return { pos: nodePos!, node: nodeAtPos }
    }
  }

  return null
}

/**
 * 更新多个节点上的单个属性
 *
 * @param tr - 要变更的事务
 * @param targets - { node, pos } 数组
 * @param attrName - 要更新的属性键
 * @param next - 新值或接收前一个值的更新函数
 *               传递 `undefined` 以删除该属性
 * @returns 如果至少有一个节点被更新则返回 true，否则返回 false
 */
export function updateNodesAttr<A extends string = string, V = unknown>(
  tr: Transaction,
  targets: readonly { node: PMNode, pos: number }[],
  attrName: A,
  next: V | ((prev: V | undefined) => V | undefined),
): boolean {
  if (!targets.length)
    return false

  let changed = false

  for (const { pos } of targets) {
    // Always re-read from the transaction's current doc
    const currentNode = tr.doc.nodeAt(pos)
    if (!currentNode)
      continue

    const prevValue = (currentNode.attrs as Record<string, unknown>)[
      attrName
    ] as V | undefined
    const resolvedNext
      = typeof next === 'function'
        ? (next as (p: V | undefined) => V | undefined)(prevValue)
        : next

    if (prevValue === resolvedNext)
      continue

    const nextAttrs: Record<string, unknown> = { ...currentNode.attrs }
    if (resolvedNext === undefined) {
      // Remove the key entirely instead of setting null
      delete nextAttrs[attrName]
    }
    else {
      nextAttrs[attrName] = resolvedNext
    }

    tr.setNodeMarkup(pos, undefined, nextAttrs)
    changed = true
  }

  return changed
}

/**
 * 如果选择为空，则选择当前块节点的全部内容。
 * 如果选择不为空，则不执行任何操作。
 * @param editor Tiptap 编辑器实例
 */
export function selectCurrentBlockContent(editor: Editor) {
  const { selection, doc } = editor.state

  if (!selection.empty)
    return

  const $pos = selection.$from
  let blockNode = null
  let blockPos = -1

  for (let depth = $pos.depth; depth >= 0; depth--) {
    const node = $pos.node(depth)
    const pos = $pos.start(depth)

    if (node.isBlock && node.textContent.trim()) {
      blockNode = node
      blockPos = pos
      break
    }
  }

  if (blockNode && blockPos >= 0) {
    const from = blockPos
    const to = blockPos + blockNode.nodeSize - 2 // -2 to exclude the closing tag

    if (from < to) {
      const $from = doc.resolve(from)
      const $to = doc.resolve(to)
      const newSelection = TextSelection.between($from, $to, 1)

      if (newSelection && !selection.eq(newSelection)) {
        editor.view.dispatch(editor.state.tr.setSelection(newSelection))
      }
    }
  }
}
