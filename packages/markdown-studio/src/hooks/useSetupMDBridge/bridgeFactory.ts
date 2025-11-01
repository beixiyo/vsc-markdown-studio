import type { Block, BlockNoteEditor } from '@blocknote/core'
import type { useNotify } from '../useNotify'
import type { BlockIdManager, CallbackManager } from './types'
import type { MDBridge } from '@/types/MDBridge'
import { createMarkdownOperate } from 'markdown-operate'
import { extractBlockText, getBlockAtPosition, getBlockFromElement, getParentHeading, scrollToBlock } from './blockOperations'
import { groupBlockByHeading } from './blockSections'
import { createCommands } from './commands'
import { GlobalStateManager } from './GlobalStateManager'
import { appendElements, insertAtBottom, insertAtTop, parseImagesToBlocks } from './imageUtils'

/**
 * 创建 MDBridge 对象
 */
export function createMDBridge(
  editor: BlockNoteEditor<any, any, any>,
  callbackManager: CallbackManager,
  blockIdManager: BlockIdManager,
  notifyFns: ReturnType<typeof useNotify>,
): MDBridge {
  const globalStateManager = GlobalStateManager.getInstance()
  const base = createMarkdownOperate(editor)

  return {
    ...base,
    editor,
    state: {
      lastGroupBlock: {
        blocks: [],
        heading: null,
        startBlock: null,
        endBlock: null,
      },
      lastGroupMarkdown: '',
      lastBlock: null,
      lastBlockMarkdown: '',
      selectionContexts: {},
    },

    // ======================
    // * Images
    // ======================
    setImagesWithURL: async (images: string[]) => {
      const urls = Array.isArray(images)
        ? images
        : []
      globalStateManager.setImageUrls(urls)

      const blocks = parseImagesToBlocks(urls)
      await appendElements(editor, blocks)
    },
    setFooterImagesWithURL: async (imageUrls: string[]) => {
      const urls = Array.isArray(imageUrls)
        ? imageUrls
        : []
      globalStateManager.setImageUrls(urls)
      const blocks = parseImagesToBlocks(urls)
      await insertAtBottom(editor, blocks, blockIdManager)
    },
    setHeaderImagesWithURL: async (imageUrls: string[]) => {
      const urls = Array.isArray(imageUrls)
        ? imageUrls
        : []
      globalStateManager.setHeaderImageUrls(urls)
      const blocks = parseImagesToBlocks(urls)
      await insertAtTop(editor, blocks, blockIdManager)
    },

    scrollToBlock: (blockId: string) => scrollToBlock(editor, blockId),

    // ======================
    // * Text operations (扩展)
    // ======================
    extractBlockText,

    // ======================
    // * Formatting 由通用库提供
    // ======================

    // ======================
    // * Links 由通用库提供
    // ======================

    // ======================
    // * Selection and cursor (扩展)
    // ======================

    // ======================
    // * Block detection
    // ======================
    getBlockAtPosition: (x: number, y: number) => getBlockAtPosition(editor, x, y),
    getBlockFromElement: (element: Element) => getBlockFromElement(editor, element),

    /**
     * 获取指定块的上级标题
     * @param blockId 目标块 ID
     * @returns 上级标题信息，包含块对象、级别、文本内容和索引
     */
    getParentHeading: (blockId: string) => getParentHeading(editor, blockId),

    groupBlockByHeading: (editor: BlockNoteEditor, blockId: string) => groupBlockByHeading(editor, blockId),

    onBlockHover: (callback: (block: Block | null) => void) => {
      callbackManager.onBlockHoverCallbacks.add(callback)

      /** 返回取消监听的函数 */
      return () => {
        callbackManager.onBlockHoverCallbacks.delete(callback)
      }
    },

    onBlockClick: (callback: (block: Block | null) => void) => {
      callbackManager.onBlockClickCallbacks.add(callback)

      /** 返回取消监听的函数 */
      return () => {
        callbackManager.onBlockClickCallbacks.delete(callback)
      }
    },

    // ======================
    // * Commands for compatibility with MDBridge
    // ======================
    command: createCommands(editor, notifyFns),

    // ======================
    // * Event callbacks
    // ======================
    onChange: (callback: (editor: BlockNoteEditor<any, any, any>) => void) => {
      callbackManager.onChangeCallbacks.add(callback)

      /** 返回取消监听的函数 */
      return () => {
        callbackManager.onChangeCallbacks.delete(callback)
      }
    },
    onSelectionChange: (callback: (editor: BlockNoteEditor<any, any, any>) => void) => {
      callbackManager.onSelectionChangeCallbacks.add(callback)

      /** 返回取消监听的函数 */
      return () => {
        callbackManager.onSelectionChangeCallbacks.delete(callback)
      }
    },
  }
}
