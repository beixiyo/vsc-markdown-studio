import type { Block, BlockNoteEditor, PartialBlock } from '@blocknote/core'
import type { MarkdownOperateOptions } from './types'

/**
 * 创建通用的 BlockNote 操作对象
 * 仅封装 editor 的常用能力，适合在多项目中复用
 */
export function createMarkdownOperate(
  editor: BlockNoteEditor<any, any, any>,
  options: MarkdownOperateOptions = {},
) {
  const { defaultCursorPlacement = 'end' } = options

  return {
    // ======================
    /** 内容管理 */
    // ======================
    /**
     * 获取文档内容
     */
    getDocument: () => editor.document,
    /**
     * 设置文档内容
     * @param blocks 块数组
     */
    setContent: (blocks: PartialBlock<any, any, any>[]) => {
      const currentIds = editor.document.map(b => b.id)
      editor.replaceBlocks(currentIds, blocks)
    },
    /**
     * 获取 HTML 格式内容
     */
    getHTML: () => editor.blocksToHTMLLossy(),
    /**
     * 设置 HTML 格式内容
     * @param html HTML 字符串
     */
    setHTML: (html: string) => {
      const blocks = editor.tryParseHTMLToBlocks(html)
      const currentIds = editor.document.map(b => b.id)
      editor.replaceBlocks(currentIds, blocks as unknown as Block[])
    },
    /**
     * 获取 Markdown 格式内容
     * @param blocks 可选的块数组，如果不提供则使用当前文档
     */
    getMarkdown: (blocks?: PartialBlock<any, any, any>[]) => {
      const source = blocks && blocks.length > 0
        ? blocks
        : editor.document
      return editor.blocksToMarkdownLossy(source)
    },
    /**
     * 设置 Markdown 格式内容
     * @param markdown Markdown 字符串
     */
    setMarkdown: (markdown: string) => {
      const blocks = editor.tryParseMarkdownToBlocks(markdown)
      const currentIds = editor.document.map(b => b.id)
      editor.replaceBlocks(currentIds, blocks as unknown as Block[])
    },

    // ======================
    /** 块操作 */
    // ======================
    /**
     * 插入块
     * @param blocks 要插入的块数组
     * @param referenceBlockId 参考块 ID
     * @param placement 插入位置，'before' 或 'after'，默认为 'after'
     */
    insertBlocks: (blocks: Block[], referenceBlockId: string, placement: 'before' | 'after' = 'after') => {
      return editor.insertBlocks(blocks, referenceBlockId, placement)
    },
    /**
     * 更新块
     * @param blockId 块 ID
     * @param update 要更新的块属性
     */
    updateBlock: (blockId: string, update: Partial<Block>) => {
      return editor.updateBlock(blockId, update)
    },
    /**
     * 删除块
     * @param blockIds 要删除的块 ID 数组
     */
    removeBlocks: (blockIds: string[]) => {
      return editor.removeBlocks(blockIds)
    },
    /**
     * 替换块
     * @param blockIdsToRemove 要删除的块 ID 数组
     * @param blocksToInsert 要插入的块数组
     */
    replaceBlocks: (blockIdsToRemove: string[], blocksToInsert: Block[]) => {
      return editor.replaceBlocks(blockIdsToRemove, blocksToInsert)
    },

    // ======================
    /** 文本 */
    // ======================
    /**
     * 获取选中的文本
     */
    getSelectedText: () => editor.getSelectedText(),
    /**
     * 插入文本
     * @param text 要插入的文本
     */
    insertText: (text: string) => {
      editor.insertInlineContent(text)
    },

    // ======================
    /** 样式 */
    // ======================
    /**
     * 添加样式
     * @param styles 样式对象
     */
    addStyles: (styles: Record<string, any>) => editor.addStyles(styles),
    /**
     * 移除样式
     * @param styles 要移除的样式对象
     */
    removeStyles: (styles: Record<string, any>) => editor.removeStyles(styles),
    /**
     * 切换样式
     * @param styles 要切换的样式对象
     */
    toggleStyles: (styles: Record<string, any>) => editor.toggleStyles(styles),
    /**
     * 获取当前激活的样式
     */
    getActiveStyles: () => editor.getActiveStyles(),

    // ======================
    /** 链接 */
    // ======================
    /**
     * 创建链接
     * @param url 链接 URL
     * @param text 可选的链接文本
     */
    createLink: (url: string, text?: string) => editor.createLink(url, text),
    /**
     * 获取选中的链接 URL
     */
    getSelectedLinkUrl: () => editor.getSelectedLinkUrl(),

    // ======================
    /** 选择与光标 */
    // ======================
    /**
     * 获取文本光标位置
     */
    getTextCursorPosition: () => editor.getTextCursorPosition(),
    /**
     * 设置文本光标位置
     * @param blockId 块 ID
     * @param placement 光标位置，'start' 或 'end'，默认为配置的 defaultCursorPlacement
     */
    setTextCursorPosition: (blockId: string, placement: 'start' | 'end' = defaultCursorPlacement) => {
      editor.setTextCursorPosition(blockId, placement)
    },
    /**
     * 获取选区
     */
    getSelection: () => editor.getSelection(),
    /**
     * 设置选区
     * @param startBlockId 起始块 ID
     * @param endBlockId 结束块 ID
     */
    setSelection: (startBlockId: string, endBlockId: string) => {
      editor.setSelection(startBlockId, endBlockId)
    },

    // ======================
    /** 编辑器状态 */
    // ======================
    /**
     * 聚焦编辑器
     */
    focus: () => editor.focus(),
    /**
     * 获取是否可编辑
     */
    isEditable: () => editor.isEditable,
    /**
     * 设置是否可编辑
     * @param editable 是否可编辑
     */
    setEditable: (editable: boolean) => {
      editor.isEditable = editable
    },
    /**
     * 判断是否为空
     */
    isEmpty: () => editor.isEmpty,

    // ======================
    /** 历史 */
    // ======================
    /**
     * 撤销
     */
    undo: () => editor.undo(),
    /**
     * 重做
     */
    redo: () => editor.redo(),

    // ======================
    /** 嵌套与移动 */
    // ======================
    /**
     * 判断是否可以嵌套块
     */
    canNestBlock: () => editor.canNestBlock(),
    /**
     * 嵌套块
     */
    nestBlock: () => editor.nestBlock(),
    /**
     * 判断是否可以取消嵌套块
     */
    canUnnestBlock: () => editor.canUnnestBlock(),
    /**
     * 取消嵌套块
     */
    unnestBlock: () => editor.unnestBlock(),
    /**
     * 向上移动块
     */
    moveBlocksUp: () => editor.moveBlocksUp(),
    /**
     * 向下移动块
     */
    moveBlocksDown: () => editor.moveBlocksDown(),

    // ======================
    /** 格式化命令 */
    // ======================
    command: {
      /**
       * 将当前块设置为标题
       * @param level 标题级别 (1-3)
       */
      setHeading: (level: 1 | 2 | 3) => {
        const currentBlock = editor.getTextCursorPosition().block
        if (currentBlock) {
          editor.updateBlock(currentBlock, { type: 'heading', props: { level } })
        }
      },

      /**
       * 将当前块设置为段落
       */
      setParagraph: () => {
        const currentBlock = editor.getTextCursorPosition().block
        if (currentBlock) {
          editor.updateBlock(currentBlock, { type: 'paragraph' })
        }
      },

      /**
       * 将当前块设置为有序列表项
       */
      setOrderedList: () => {
        const currentBlock = editor.getTextCursorPosition().block
        if (currentBlock) {
          editor.updateBlock(currentBlock, { type: 'numberedListItem' })
        }
      },

      /**
       * 将当前块设置为无序列表项
       */
      setUnorderedList: () => {
        const currentBlock = editor.getTextCursorPosition().block
        if (currentBlock) {
          editor.updateBlock(currentBlock, { type: 'bulletListItem' })
        }
      },

      /**
       * 设置选中文本为粗体
       */
      setBold: () => {
        editor.toggleStyles({ bold: true })
      },

      /**
       * 取消选中文本的粗体
       */
      unsetBold: () => {
        editor.toggleStyles({ bold: false })
      },

      /**
       * 设置选中文本为斜体
       */
      setItalic: () => {
        editor.toggleStyles({ italic: true })
      },

      /**
       * 取消选中文本的斜体
       */
      unsetItalic: () => {
        editor.toggleStyles({ italic: false })
      },

      /**
       * 设置选中文本为下划线
       */
      setUnderline: () => {
        editor.toggleStyles({ underline: true })
      },

      /**
       * 取消选中文本的下划线
       */
      unsetUnderline: () => {
        editor.toggleStyles({ underline: false })
      },

      /**
       * 将当前块设置为检查列表项
       */
      setCheckList: () => {
        const currentBlock = editor.getTextCursorPosition().block
        if (currentBlock) {
          editor.updateBlock(currentBlock, { type: 'checkListItem' })
        }
      },
    },
  }
}

export type MarkdownOperate = ReturnType<typeof createMarkdownOperate>
