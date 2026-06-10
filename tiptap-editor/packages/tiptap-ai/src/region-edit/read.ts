/**
 * readBlocks：导出文档顶层块列表（hash 锚点 + Markdown，必要时附无损 HTML）
 */

import type { Editor } from '@tiptap/core'
import type { ReadBlocksOptions, ReadBlocksResult, RegionBlock } from './types'
import { isBlockLossy, serializeBlockHtml, serializeBlockMarkdown } from './content'
import { buildBlockIndex } from './hash'

/**
 * 区域编辑协议版本号
 *
 * 兼容性公约：响应只增字段不删字段、枚举只增不减、语义只放宽不收紧；
 * 仅当出现无法兼容的破坏性变更时 +1
 */
export const REGION_EDIT_PROTOCOL_VERSION = 1

export function readBlocks(editor: Editor, docVersion: number, options?: ReadBlocksOptions): ReadBlocksResult {
  const detectLossy = options?.detectLossy ?? true
  const entries = buildBlockIndex(editor.state.doc)

  const blocks: RegionBlock[] = entries.map((entry) => {
    let markdown = ''
    try {
      markdown = serializeBlockMarkdown(editor, entry.node).trim()
    }
    catch {
      markdown = entry.node.textContent
    }

    const block: RegionBlock = {
      hash: entry.hash,
      type: entry.node.type.name,
      markdown,
    }

    if (detectLossy && isBlockLossy(editor, entry.node, markdown)) {
      block.lossy = true
      block.html = serializeBlockHtml(editor, entry.node)
    }

    return block
  })

  return { protocolVersion: REGION_EDIT_PROTOCOL_VERSION, docVersion, blocks }
}
