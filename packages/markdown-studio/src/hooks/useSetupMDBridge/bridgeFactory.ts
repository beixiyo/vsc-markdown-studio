import type { BlockNoteEditor } from '@blocknote/core'
import type { useNotify } from '../useNotify'
import type { BlockIdManager, CallbackManager } from './types'
import type { SpeakerType } from '@/types/BlocknoteExt'
import type { MDBridge } from '@/types/MDBridge'
import { getBlockAtPosition, getBlockFromElement, getParentHeading, scrollToBlock } from './blockOperations'
import { createCommands } from './commands'
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
  return {
    // ======================
    // * Content management
    // ======================
    getDocument: () => editor.document,
    setContent: (blocks: any[]) => {
      editor.replaceBlocks(editor.document.map(block => block.id), blocks)
    },
    getHTML: () => editor.blocksToHTMLLossy(),
    setHTML: (html: string) => {
      const blocks = editor.tryParseHTMLToBlocks(html)
      editor.replaceBlocks(editor.document.map(block => block.id), blocks)
    },
    getMarkdown: () => editor.blocksToMarkdownLossy(),
    setMarkdown: async (markdown: string) => {
      const blocks = await editor.tryParseMarkdownToBlocks(markdown)
      editor.replaceBlocks(editor.document.map(block => block.id), blocks)
    },

    // ======================
    // * Images
    // ======================
    setImagesWithURL: async (images: string[]) => {
      const urls = Array.isArray(images)
        ? images
        : []
      if (!window.__MDBridgeState)
        window.__MDBridgeState = {}
      window.__MDBridgeState.imageUrls = urls

      const blocks = parseImagesToBlocks(urls)
      await appendElements(editor, blocks)
    },
    setFooterImagesWithURL: async (imageUrls: string[]) => {
      const urls = Array.isArray(imageUrls)
        ? imageUrls
        : []
      if (!window.__MDBridgeState)
        window.__MDBridgeState = {}
      window.__MDBridgeState.imageUrls = urls
      const blocks = parseImagesToBlocks(urls)
      await insertAtBottom(editor, blocks, blockIdManager)
    },
    setHeaderImagesWithURL: async (imageUrls: string[]) => {
      const urls = Array.isArray(imageUrls)
        ? imageUrls
        : []
      if (!window.__MDBridgeState)
        window.__MDBridgeState = {}
      window.__MDBridgeState.headerImageUrls = urls
      const blocks = parseImagesToBlocks(urls)
      await insertAtTop(editor, blocks, blockIdManager)
    },

    // ======================
    // * Speaker operations
    // ======================
    setSpeaker: (speaker: SpeakerType) => {
      /** 验证输入参数 */
      if (!speaker || typeof speaker !== 'object') {
        console.warn('setSpeaker: speakers 参数必须是对象')
        return ''
      }

      if (!speaker.name || typeof speaker.name !== 'string') {
        console.warn('setSpeaker: speakers.name 参数必须是字符串')
        return ''
      }

      /** 创建 LabelInput 块数据 */
      const labelInputBlock = {
        type: 'labelInput' as const,
        props: {
          label: speaker.name || '未知说话人',
        },
        content: [
          {
            type: 'text',
            text: speaker.content || '',
            styles: {},
          },
        ],
      }

      /** 如果有 blockId，则更新现有块；否则创建新块 */
      if (speaker.blockId) {
        /** 更新现有块 - 分别更新 props 和 content */
        editor.updateBlock(speaker.blockId, {
          props: { ...labelInputBlock.props },
        })
        editor.updateBlock(speaker.blockId, {
          content: labelInputBlock.content,
        })
        return speaker.blockId
      }
      else {
        /** 创建新块 */
        const lastBlock = editor.document[editor.document.length - 1]
        const newBlocks = lastBlock
          ? editor.insertBlocks([labelInputBlock], lastBlock.id, 'after')
          : editor.insertBlocks([labelInputBlock], editor.document[0]?.id || '', 'after')
        return newBlocks[0]?.id || ''
      }
    },

    // ======================
    // * Block operations
    // ======================
    insertBlocks: (blocks: any[], referenceBlockId: string, placement: 'before' | 'after' = 'after') => {
      return editor.insertBlocks(blocks, referenceBlockId, placement)
    },
    updateBlock: (blockId: string, update: any) => {
      return editor.updateBlock(blockId, update)
    },
    removeBlocks: (blockIds: string[]) => {
      return editor.removeBlocks(blockIds)
    },
    replaceBlocks: (blockIdsToRemove: string[], blocksToInsert: any[]) => {
      return editor.replaceBlocks(blockIdsToRemove, blocksToInsert)
    },
    scrollToBlock: (blockId: string) => scrollToBlock(editor, blockId),

    // ======================
    // * Text operations
    // ======================
    getSelectedText: () => editor.getSelectedText(),
    insertText: (text: string) => {
      editor.insertInlineContent(text)
    },

    // ======================
    // * Formatting
    // ======================
    addStyles: (styles: any) => editor.addStyles(styles),
    removeStyles: (styles: any) => editor.removeStyles(styles),
    toggleStyles: (styles: any) => editor.toggleStyles(styles),
    getActiveStyles: () => editor.getActiveStyles(),

    // ======================
    // * Links
    // ======================
    createLink: (url: string, text?: string) => editor.createLink(url, text),
    getSelectedLinkUrl: () => editor.getSelectedLinkUrl(),

    // ======================
    // * Selection and cursor
    // ======================
    getTextCursorPosition: () => editor.getTextCursorPosition(),
    setTextCursorPosition: (blockId: string, placement: 'start' | 'end' = 'end') => {
      editor.setTextCursorPosition(blockId, placement)
    },
    getSelection: () => editor.getSelection(),
    setSelection: (startBlockId: string, endBlockId: string) => {
      editor.setSelection(startBlockId, endBlockId)
    },

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

    onBlockHover: (callback: (block: any | null) => void) => {
      callbackManager.onBlockHoverCallbacks.add(callback)

      /** 返回取消监听的函数 */
      return () => {
        callbackManager.onBlockHoverCallbacks.delete(callback)
      }
    },

    // ======================
    // * Editor state
    // ======================
    focus: () => editor.focus(),
    isEditable: () => editor.isEditable,
    setEditable: (editable: boolean) => {
      editor.isEditable = editable
    },
    isEmpty: () => editor.isEmpty,

    // ======================
    // * History
    // ======================
    undo: () => editor.undo(),
    redo: () => editor.redo(),

    // ======================
    // * Block nesting
    // ======================
    canNestBlock: () => editor.canNestBlock(),
    nestBlock: () => editor.nestBlock(),
    canUnnestBlock: () => editor.canUnnestBlock(),
    unnestBlock: () => editor.unnestBlock(),

    // ======================
    // * Block movement
    // ======================
    moveBlocksUp: () => editor.moveBlocksUp(),
    moveBlocksDown: () => editor.moveBlocksDown(),

    // ======================
    // * Commands for compatibility with MDBridge
    // ======================
    command: createCommands(editor, notifyFns),

    // ======================
    // * Event callbacks
    // ======================
    onChange: (callback: (editor: any) => void) => {
      callbackManager.onChangeCallbacks.add(callback)

      /** 返回取消监听的函数 */
      return () => {
        callbackManager.onChangeCallbacks.delete(callback)
      }
    },
    onSelectionChange: (callback: (editor: any) => void) => {
      callbackManager.onSelectionChangeCallbacks.add(callback)

      /** 返回取消监听的函数 */
      return () => {
        callbackManager.onSelectionChangeCallbacks.delete(callback)
      }
    },
  }
}
