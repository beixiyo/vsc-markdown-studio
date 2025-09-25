import type { Block, BlockNoteEditor } from '@blocknote/core'
import type { BlockIdManager, ImageBlock } from './types'

/**
 * 将 URL 数组解析为图片块
 */
export function parseImagesToBlocks(urls: string[]): ImageBlock[] {
  return urls.map(u => ({
    type: 'image',
    props: {
      url: u,
      caption: '',
      previewWidth: 512,
      textAlignment: 'center',
    },
  }))
}

/**
 * 在文档顶部插入块
 */
export async function insertAtTop(editor: BlockNoteEditor, blocks: CommonBlock[], blockIdManager: BlockIdManager) {
  /** 移除之前的头部图片块 */
  if (blockIdManager.headerBlockIds.length)
    editor.removeBlocks([...blockIdManager.headerBlockIds])
  blockIdManager.headerBlockIds.length = 0

  if (editor.document.length === 0) {
    editor.replaceBlocks([], blocks as any)
    /** 读取当前文档前 N 个块作为新插入的头部图片块 ID */
    const take = Math.min(blocks.length, editor.document.length)
    for (let i = 0; i < take; i++)
      blockIdManager.headerBlockIds.push(editor.document[i].id)
    return
  }

  const firstId = editor.document[0].id
  const inserted = editor.insertBlocks(blocks as any, firstId, 'before')
  for (const b of inserted)
    blockIdManager.headerBlockIds.push(b.id)
}

/**
 * 在文档底部插入块
 */
export async function insertAtBottom(editor: BlockNoteEditor, blocks: CommonBlock[], blockIdManager: BlockIdManager) {
  /** 移除之前的底部图片块 */
  if (blockIdManager.bottomBlockIds.length)
    editor.removeBlocks([...blockIdManager.bottomBlockIds])
  blockIdManager.bottomBlockIds.length = 0

  if (editor.document.length === 0) {
    editor.replaceBlocks([], blocks as any)
    const take = Math.min(blocks.length, editor.document.length)
    for (let i = 0; i < take; i++)
      blockIdManager.bottomBlockIds.push(editor.document[i].id)
    return
  }

  const lastId = editor.document[editor.document.length - 1].id
  const inserted = editor.insertBlocks(blocks as any, lastId, 'after')
  for (const b of inserted)
    blockIdManager.bottomBlockIds.push(b.id)
}

/**
 * 插入元素到当前光标位置
 */
export async function appendElements(editor: BlockNoteEditor, blocks: CommonBlock[]) {
  const currentBlock = editor.getTextCursorPosition().block
  if (currentBlock) {
    editor.insertBlocks(blocks as any, currentBlock.id, 'after')
  }
}

type CommonBlock = Block<any, any, any> | ImageBlock
