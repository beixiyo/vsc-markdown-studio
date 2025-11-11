/**
 * 文件作用：创建并组装 MDBridge，对接图片、演讲者、命令、块检测等扩展能力
 * 一句话概括：统一构造可供外部使用的编辑器桥对象
 * 被谁使用：`useSetupMDBridge/index.ts` 调用创建实例，随后由 `GlobalBridgeManager` 挂载到全局
 */
import type { Block, BlockNoteEditor } from '@blocknote/core'
import type { BlockIdManager, CallbackManager } from './types'
import type { MDBridge } from '@/types/MDBridge'
import { setContentWithSpeakers as speakerSetContentWithSpeakers, setSpeakers as speakerSetSpeakers } from 'custom-blocknote-speaker'
import { createMarkdownOperate, extractBlockText, getParentHeading, groupBlockByHeading } from 'markdown-operate'
import { getBlockAtPosition, getBlockFromElement, scrollToBlock } from './blockOperations'
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

    // ======================
    // * Speakers
    // ======================
    setSpeakers: async speakers => speakerSetSpeakers(editor, speakers),
    setContentWithSpeakers: async data => speakerSetContentWithSpeakers(editor, data.content || '', data.speakers),

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
    command: createCommands(editor),

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
