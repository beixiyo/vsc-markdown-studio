import type { Block, BlockNoteEditor, PartialBlock } from '@blocknote/core'
import type { DocSection, ParentHeadingInfo, SpeakerType } from './BlocknoteExt'
import type { GradientStyleType } from '@/blocknoteExts/styles/gradientStyles'

/**
 * MDBridge编辑器桥接接口
 * 用于在webview中操作BlockNote编辑器，提供完整的编辑器API访问
 * 通过 MDBridge 全局访问
 *
 * @example
 * ```javascript
 * // 设置内容
 * MDBridge.setMarkdown('# Hello World');
 *
 * // 监听变化
 * MDBridge.onChange((editor) => {
 *   console.log('Content changed');
 * });
 * ```
 */
export interface MDBridge {
  editor: BlockNoteEditor<any, any, any>
  state: {
    /** 上一次分组块 */
    lastGroupBlock: DocSection
    /** 上一次分组块的 Markdown 内容 */
    lastGroupMarkdown: string
  }

  // ======================
  // * Content management
  // ======================

  /**
   * 获取文档的所有顶层块
   * @returns 文档块数组
   */
  getDocument: () => Block<any, any, any>[]

  /**
   * 设置文档内容（替换所有块）
   * @example
   * ```ts
   * MDBridge.setContent([
   *   { type: 'heading', props: { level: 1 }, content: '标题 1' },
   *   { type: 'paragraph', content: '这是一个段落' },
   * ])
   * ```
   * @param blocks 要设置的块数组
   */
  setContent: (blocks: PartialBlock<any, any, any>[]) => void

  /**
   * 获取文档的HTML格式内容
   * @returns HTML字符串
   */
  getHTML: () => string

  /**
   * 通过HTML设置文档内容
   * @param html HTML字符串
   */
  setHTML: (html: string) => void

  /**
   * 获取文档的Markdown格式内容
   * @returns Markdown字符串
   */
  getMarkdown: (blocks?: PartialBlock<any, any, any>[] | undefined) => string

  /**
   * 通过Markdown设置文档内容（异步）
   * @param markdown Markdown字符串
   */
  setMarkdown: (markdown: string) => void

  // ======================
  // * Image operations
  // ======================

  /** 通过URL设置图片到当前位置 */
  setImagesWithURL: (imageUrls: string[]) => void

  /** 通过URL设置底部图片 */
  setFooterImagesWithURL: (imageUrls: string[]) => void

  /** 通过URL设置头部图片 */
  setHeaderImagesWithURL: (imageUrls: string[]) => void

  // ======================
  // * Speaker operations
  // ======================

  /**
   * 设置说话人列表，blockId 可选，传递则为修改对应 ID 的内容
   * @param speakers 说话人数组
   * @returns 设置后的块 ID
   *
   * @example
   * ```ts
   * MDBridge.setSpeaker({ blockId: '1', name: '张三', content: '你好' })
   * ```
   */
  setSpeaker: (speakers: SpeakerType) => string

  // ======================
  // * Block operations
  // ======================

  /**
   * 在指定位置插入新块
   * @param blocks 要插入的块数组
   * @param referenceBlockId 参考块ID
   * @param placement 插入位置，'before'或'after'
   * @returns 插入的块数组
   */
  insertBlocks: (blocks: Block[], referenceBlockId: string, placement?: 'before' | 'after') => Block<any, any, any>[]

  /**
   * 更新指定块的内容
   * @param blockId 块ID
   * @param update 更新的块数据
   * @returns 更新后的块
   */
  updateBlock: (blockId: string, update: Partial<Block>) => Block<any, any, any>

  /**
   * 删除指定的块
   * @param blockIds 要删除的块ID数组
   * @returns 删除的块数组
   */
  removeBlocks: (blockIds: string[]) => Block<any, any, any>[]

  /**
   * 替换指定块为新块
   * @param blockIdsToRemove 要删除的块ID数组
   * @param blocksToInsert 要插入的新块数组
   * @returns 包含插入和删除块的结果对象
   */
  replaceBlocks: (blockIdsToRemove: string[], blocksToInsert: Block[]) => void

  /**
   * 跳转到指定块
   * @param blockId 块ID
   */
  scrollToBlock: (blockId: string) => void

  // ======================
  // * Text operations
  // ======================

  /**
   * 获取当前选中的文本
   * @returns 选中的文本字符串
   */
  getSelectedText: () => string

  /**
   * 提取块中的纯文本内容
   * @param block 块对象
   * @returns 提取的文本内容
   *
   * @example
   * ```ts
   * const block = MDBridge.getDocument()[0]
   * const text = MDBridge.extractBlockText(block)
   * console.log(text) // "这是块中的文本内容"
   * ```
   */
  extractBlockText: (blocks: Block[]) => string

  /**
   * 在当前光标位置插入文本
   * @param text 要插入的文本
   */
  insertText: (text: string) => void

  // ======================
  // * Formatting
  // ======================

  /**
   * 为选中内容添加样式
   * @example
   * ```ts
   * // 基础样式
   * MDBridge.addStyles({ bold: true, italic: true })
   *
   * // 渐变样式
   * MDBridge.addStyles({ gradient: 'mysticNight' })
   *
   * // 组合样式
   * MDBridge.addStyles({
   *   bold: true,
   *   gradient: 'skyBlue'
   * })
   * ```
   *
   * @param styles 样式对象，支持以下属性：
   * - `bold`: 粗体样式
   * - `italic`: 斜体样式
   * - `underline`: 下划线样式
   * - `strike`: 删除线样式
   * - `code`: 行内代码样式
   * - `gradient`: 渐变样式，可选值：
   *   - `'mysticPurpleBlue'`: 神秘紫蓝
   *   - `'skyBlue'`: 天空蓝
   *   - `'gorgeousPurpleRed'`: 瑰丽紫红
   *   - `'warmSunshine'`: 温暖阳光
   *   - `'naturalGreen'`: 自然绿意
   *   - `'mysticNight'`: 神秘暗夜
   *   - `'colorfulCandy'`: 多彩糖果
   *   - `'starryNight'`: 星空夜幕
   *   - `'metallic'`: 金属质感
   *   - `'snowyGlacier'`: 雪山冰川
   *   - `'tropicalSummer'`: 热带夏日
   */
  addStyles: (styles: Record<string, any>) => void

  /**
   * 移除选中内容的样式
   * @example
   * ```ts
   * // 移除粗体和渐变样式
   * MDBridge.removeStyles({
   *   bold: true,
   *   gradient: 'mysticNight'
   * })
   * ```
   * @param styles 要移除的样式对象，属性与 addStyles 相同
   */
  removeStyles: (styles: Record<string, any>) => void

  /**
   * 切换选中内容的样式
   * @example
   * ```ts
   * // 切换渐变样式（如果已应用则移除，未应用则添加）
   * MDBridge.toggleStyles({ gradient: 'skyBlue' })
   * ```
   * @param styles 要切换的样式对象，属性与 addStyles 相同
   */
  toggleStyles: (styles: Record<string, any>) => void

  /**
   * 获取当前激活的样式
   * @example
   * ```ts
   * const styles = MDBridge.getActiveStyles()
   * console.log(styles.gradient) // 'mysticNight' 或 undefined
   * console.log(styles.bold) // true 或 false
   * ```
   * @returns 当前样式对象，包含所有激活的样式属性
   */
  getActiveStyles: () => Record<string, any>

  // ======================
  // * Links
  // ======================

  /**
   * 创建链接
   * @param url 链接URL
   * @param text 可选的链接文本
   */
  createLink: (url: string, text?: string) => void

  /**
   * 获取当前选中的链接URL
   * @returns 链接URL，如果没有选中链接则返回undefined
   */
  getSelectedLinkUrl: () => string | undefined

  // ======================
  // * Selection and cursor
  // ======================

  /**
   * 获取当前文本光标位置
   * @returns 光标位置信息
   */
  getTextCursorPosition: () => ReturnType<BlockNoteEditor['getTextCursorPosition']>

  /**
   * 设置文本光标位置
   * @param blockId 目标块ID
   * @param placement 位置，'start'或'end'
   */
  setTextCursorPosition: (blockId: string, placement?: 'start' | 'end') => void

  /**
   * 获取当前选择范围
   * @returns 选择范围信息
   */
  getSelection: () => ReturnType<BlockNoteEditor['getSelection']>

  /**
   * 设置选择范围
   * @param startBlockId 开始块ID
   * @param endBlockId 结束块ID
   */
  setSelection: (startBlockId: string, endBlockId: string) => void

  /**
   * 根据鼠标位置获取对应的块
   * @param x 鼠标X坐标
   * @param y 鼠标Y坐标
   * @returns 鼠标位置对应的块信息，如果没有找到则返回null
   */
  getBlockAtPosition: (x: number, y: number) => Block | null

  /**
   * 根据DOM元素获取对应的块
   * @param element DOM元素
   * @returns 对应的块信息，如果没有找到则返回null
   */
  getBlockFromElement: (element: Element) => Block | null

  /**
   * 获取指定块的上级标题
   * @param blockId 目标块 ID
   * @returns 上级标题信息，包含块对象、级别、文本内容和索引，如果没有找到则返回 null
   *
   * @example
   * ```ts
   * const parentHeading = MDBridge.getParentHeading('block-id-123')
   * if (parentHeading) {
   *   console.log(`上级标题: H${parentHeading.level} - ${parentHeading.text}`)
   * }
   * ```
   */
  getParentHeading: (blockId: string) => ParentHeadingInfo | null

  /**
   * 根据块和最后一个块，将块分组，如果块是标题，则将块分组
   * @param editor 编辑器实例
   * @param blockId 块ID
   * @returns 分组后的块数组
   */
  groupBlockByHeading: (
    editor: BlockNoteEditor,
    blockId: string
  ) => DocSection

  /**
   * 添加鼠标悬浮监听器
   * @param callback 悬浮回调函数，参数为块信息
   * @returns 取消监听的函数
   */
  onBlockHover: (callback: (block: Block | null) => void) => () => void

  /**
   * 添加鼠标点击监听器
   * @param callback 点击回调函数，参数为块信息
   * @returns 取消监听的函数
   */
  onBlockClick: (callback: (block: Block | null) => void) => () => void

  // ======================
  // * Editor state
  // ======================

  /** 聚焦编辑器 */
  focus: () => void

  /**
   * 检查编辑器是否可编辑
   * @returns 是否可编辑
   */
  isEditable: () => boolean

  /**
   * 设置编辑器可编辑状态
   * @param editable 是否可编辑
   */
  setEditable: (editable: boolean) => void

  /**
   * 检查编辑器是否为空
   * @returns 是否为空
   */
  isEmpty: () => boolean

  // ======================
  // * History
  // ======================

  /**
   * 撤销操作
   * @returns 是否成功撤销
   */
  undo: () => boolean

  /**
   * 重做操作
   * @returns 是否成功重做
   */
  redo: () => boolean

  // ======================
  // * Block nesting
  // ======================

  /**
   * 检查当前块是否可以嵌套
   * @returns 是否可以嵌套
   */
  canNestBlock: () => boolean

  /** 将当前块嵌套到上一个块中 */
  nestBlock: () => void

  /**
   * 检查当前块是否可以取消嵌套
   * @returns 是否可以取消嵌套
   */
  canUnnestBlock: () => boolean

  /** 将当前块从嵌套中提升出来 */
  unnestBlock: () => void

  // ======================
  // * Block movement
  // ======================

  /** 将选中的块向上移动 */
  moveBlocksUp: () => void

  /** 将选中的块向下移动 */
  moveBlocksDown: () => void

  // ======================
  // * Commands for compatibility
  // ======================

  /**
   * 提供快捷的格式化命令
   */
  command: {
    /**
     * 将当前块设置为标题
     * @param level 标题级别 (1-3)
     */
    setHeading: (level: 1 | 2 | 3) => void

    /** 将当前块设置为段落 */
    setParagraph: () => void

    /** 将当前块设置为有序列表项 */
    setOrderedList: () => void

    /** 将当前块设置为无序列表项 */
    setUnorderedList: () => void

    /** 切换选中文本的粗体样式 */
    setBold: () => void
    unsetBold: () => void

    /** 切换选中文本的斜体样式 */
    setItalic: () => void
    unsetItalic: () => void

    /** 切换选中文本的删除线样式 */
    setUnderline: () => void
    unsetUnderline: () => void

    /** 将当前块设置为检查列表项 */
    setCheckList: () => void

    /** 设置渐变 */
    setGradient: (type: GradientStyleType) => void
    unsetGradient: () => void
  }

  // ======================
  // * Event callbacks
  // ======================

  /**
   * 监听编辑器内容变化
   * @param callback 变化时的回调函数
   * @returns 取消监听的函数，如果失败返回undefined
   */
  onChange: (callback: (editor: BlockNoteEditor) => void) => (() => void) | undefined

  /**
   * 监听编辑器选择变化
   * @param callback 选择变化时的回调函数
   * @returns 取消监听的函数，如果失败返回undefined
   */
  onSelectionChange: (callback: (editor: BlockNoteEditor) => void) => (() => void) | undefined
}
