import type { BlockNoteEditor } from '@blocknote/core'
import type { useNotify } from './useNotify'
import { useEffect, useRef } from 'react'
import { loadTestTools } from '../test'

export function useSetupMDBridge(
  editor: BlockNoteEditor<any, any, any> | null,
  notifyFns: ReturnType<typeof useNotify>,
) {
  const bridgeRef = useRef<MDBridge | null>(null)

  useEffect(() => {
    if (!editor)
      return

    if (import.meta.env.DEV) {
      loadTestTools()
    }

    const headerBlockIds: string[] = []
    const bottomBlockIds: string[] = []

    // ======================
    // * Fns
    // ======================
    const parseImagesToBlocks = async (urls: string[]) => {
      const imageBlocks = urls.map(u => ({
        type: 'image',
        props: {
          url: u,
          caption: '',
          previewWidth: 512,
          textAlignment: 'center',
        },
      }))
      return imageBlocks
    }

    const insertAtTop = async (blocks: any[]) => {
      /** 移除之前的头部图片块 */
      if (headerBlockIds.length)
        editor.removeBlocks([...headerBlockIds])
      headerBlockIds.length = 0

      if (editor.document.length === 0) {
        editor.replaceBlocks([], blocks)
        /** 读取当前文档前 N 个块作为新插入的头部图片块 ID */
        const take = Math.min(blocks.length, editor.document.length)
        for (let i = 0; i < take; i++)
          headerBlockIds.push(editor.document[i].id)
        return
      }

      const firstId = editor.document[0].id
      const inserted = editor.insertBlocks(blocks, firstId, 'before')
      for (const b of inserted)
        headerBlockIds.push(b.id)
    }

    const insertAtBottom = async (blocks: any[]) => {
      /** 移除之前的底部图片块 */
      if (bottomBlockIds.length)
        editor.removeBlocks([...bottomBlockIds])
      bottomBlockIds.length = 0

      if (editor.document.length === 0) {
        editor.replaceBlocks([], blocks)
        const take = Math.min(blocks.length, editor.document.length)
        for (let i = 0; i < take; i++)
          bottomBlockIds.push(editor.document[i].id)
        return
      }

      const lastId = editor.document[editor.document.length - 1].id
      const inserted = editor.insertBlocks(blocks, lastId, 'after')
      for (const b of inserted)
        bottomBlockIds.push(b.id)
    }

    /** 插入元素到当前光标位置 */
    const appendElements = async (blocks: any[]) => {
      const currentBlock = editor.getTextCursorPosition().block
      if (currentBlock) {
        editor.insertBlocks(blocks, currentBlock.id, 'after')
      }
    }

    // Create the bridge object with all the BlockNote editor methods
    const bridge: MDBridge = {
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

        const blocks = await parseImagesToBlocks(urls)
        await appendElements(blocks)
      },
      setFooterImagesWithURL: async (imageUrls: string[]) => {
        const urls = Array.isArray(imageUrls)
          ? imageUrls
          : []
        if (!window.__MDBridgeState)
          window.__MDBridgeState = {}
        window.__MDBridgeState.imageUrls = urls
        const blocks = await parseImagesToBlocks(urls)
        await insertAtBottom(blocks)
      },
      setHeaderImagesWithURL: async (imageUrls: string[]) => {
        const urls = Array.isArray(imageUrls)
          ? imageUrls
          : []
        if (!window.__MDBridgeState)
          window.__MDBridgeState = {}
        window.__MDBridgeState.headerImageUrls = urls
        const blocks = await parseImagesToBlocks(urls)
        await insertAtTop(blocks)
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

      scrollToBlock: (blockId: string) => {
        try {
          editor.setTextCursorPosition(blockId, 'start')

          /** 确保编辑器获得焦点 */
          editor.focus()

          /** 查找目标块元素 - BlockNote 使用 ProseMirror 的 DOM 结构 */
          const blockElement = document.querySelector(`[data-id="${blockId}"]`)

          if (blockElement) {
            blockElement.scrollIntoView()
          }
        }
        catch (error) {
          console.warn('跳转到块失败:', error)
        }
      },

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
      command: {
        setHeading: (level: 1 | 2 | 3) => {
          const currentBlock = editor.getTextCursorPosition().block
          if (currentBlock) {
            editor.updateBlock(currentBlock, { type: 'heading', props: { level } })
            notifyFns.notifyBlockTypeChanged()
          }
        },
        setParagraph: () => {
          const currentBlock = editor.getTextCursorPosition().block
          if (currentBlock) {
            editor.updateBlock(currentBlock, { type: 'paragraph' })
            notifyFns.notifyBlockTypeChanged()
          }
        },
        setOrderedList: () => {
          const currentBlock = editor.getTextCursorPosition().block
          if (currentBlock) {
            editor.updateBlock(currentBlock, { type: 'numberedListItem' })
            notifyFns.notifyBlockTypeChanged()
          }
        },
        setUnorderedList: () => {
          const currentBlock = editor.getTextCursorPosition().block
          if (currentBlock) {
            editor.updateBlock(currentBlock, { type: 'bulletListItem' })
            notifyFns.notifyBlockTypeChanged()
          }
        },
        setBold: () => {
          editor.toggleStyles({ bold: true })
          notifyFns.notifyBlockTypeChanged()
        },
        setItalic: () => {
          editor.toggleStyles({ italic: true })
          notifyFns.notifyBlockTypeChanged()
        },
        setCheckList: () => {
          const currentBlock = editor.getTextCursorPosition().block
          if (currentBlock) {
            editor.updateBlock(currentBlock, { type: 'checkListItem' })
            notifyFns.notifyBlockTypeChanged()
          }
        },
      },

      // ======================
      // * Event callbacks
      // ======================
      onChange: (callback: (editor: any) => void) => {
        notifyFns.notifyContentChanged()
        notifyFns.notifyBlockTypeChanged()
        return editor.onChange(callback)
      },
      onSelectionChange: (callback: (editor: any) => void) => {
        return editor.onSelectionChange(callback)
      },
    }

    bridgeRef.current = bridge
    window.MDBridge = bridge

    if (!window.__MDBridgeState) {
      window.__MDBridgeState = {}
    }
    window.__MDBridgeState.imageUrls ||= []
    window.__MDBridgeState.headerImageUrls ||= []

    return () => {
      window.MDBridge = null
      bridgeRef.current = null
    }
  }, [editor])

  return bridgeRef.current
}
