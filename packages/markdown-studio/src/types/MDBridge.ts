import type { Block, BlockNoteEditor } from '@blocknote/core'
import type { GradientStyleType } from 'custom-blocknote-gradient-styles'
import type { SpeakerType } from 'custom-blocknote-speaker'
import type { createMarkdownOperate, DocSection, ParentHeadingInfo } from 'markdown-operate'
/**
 * 选区模式
 */
export type SelectionMode = 'headingSection' | 'block'

/**
 * 选区上下文信息
 */
export interface SelectionContext {
  /**
   * 选区的模式
   */
  mode: SelectionMode
  /**
   * 与选区关联的块
   */
  block: AnyBlock | null
  /**
   * 当模式为标题分组时的分组数据
   */
  section: DocSection | null
  /**
   * 当前模式下对应的 Markdown 内容
   */
  markdown: string
}

/**
 * 选区上下文集合
 */
export type SelectionContextMap = Partial<Record<SelectionMode, SelectionContext>>

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
type MarkdownOperateFromLib = ReturnType<typeof createMarkdownOperate>

export type MDBridge = MarkdownOperateFromLib & {
  editor: BlockNoteEditor<any, any, any>
  state: {
    /** 上一次分组块 */
    lastGroupBlock: DocSection
    /** 上一次分组块的 Markdown 内容 */
    lastGroupMarkdown: string
    /** 上一次选中的块 */
    lastBlock: AnyBlock | null
    /** 上一次选中的块的 Markdown 内容 */
    lastBlockMarkdown: string
    /** 当前保存的选区上下文集合 */
    selectionContexts: SelectionContextMap
  }

  // ======================
  // * Image operations
  // ======================

  /** 通过URL设置图片到当前位置 */
  setImagesWithURL: (imageUrls: string[]) => Promise<void>

  /** 通过URL设置底部图片 */
  setFooterImagesWithURL: (imageUrls: string[]) => Promise<void>

  /** 通过URL设置头部图片 */
  setHeaderImagesWithURL: (imageUrls: string[]) => Promise<void>

  // ======================
  // * Speaker operations
  // ======================

  /**
   * 设置说话人列表
   * 如果编辑器已有内容，会重新处理 speaker 标签
   * @param speakers 说话人列表
   */
  setSpeakers: (speakers: SpeakerType[]) => Promise<void>

  /**
   * 设置内容和说话人列表（合并方法）
   * @param data 包含内容和 speakers 的对象
   */
  setContentWithSpeakers: (data: { content: string, speakers: SpeakerType[] }) => Promise<void>

  // ======================
  // * Block operations (扩展)
  // ======================

  /**
   * 跳转到指定块
   * @param blockId 块ID
   */
  scrollToBlock: (blockId: string) => void

  // ======================
  // * Text operations (扩展)
  // ======================

  /**
   * 提取块中的纯文本内容
   * @param blocks 块对象或块数组
   * @returns 提取的文本内容
   *
   * @example
   * ```ts
   * // 提取单个块
   * const block = MDBridge.getDocument()[0]
   * const text = MDBridge.extractBlockText(block)
   *
   * // 提取多个块
   * const blocks = MDBridge.getDocument()
   * const text = MDBridge.extractBlockText(blocks)
   * console.log(text) // "这是块中的文本内容"
   * ```
   */
  extractBlockText: (blocks: AnyBlock | AnyBlock[]) => string

  /**
   * 在当前光标位置插入文本
   * @param text 要插入的文本
   */
  insertText: (text: string) => void

  // ======================
  // * Formatting (保持 MarkdownOperate 能力)
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
  getActiveStyles: () => ReturnType<BlockNoteEditor['getActiveStyles']>

  // ======================
  // * Links (保持 MarkdownOperate 能力)
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
  getSelectedLinkUrl: () => ReturnType<BlockNoteEditor['getSelectedLinkUrl']>

  // ======================
  // * Selection and cursor (扩展)
  // ======================

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
  // * Editor/History/Nesting/Movement 由 MarkdownOperate 提供
  // ======================

  // ======================
  // * Commands (扩展 MarkdownOperate 的 command)
  // ======================

  /**
   * 提供快捷的格式化命令
   * 继承自 MarkdownOperate，并扩展了渐变样式相关命令
   */
  command: MarkdownOperateFromLib['command'] & {
    /** 设置渐变 */
    setGradient: (type: GradientStyleType) => void
    /** 移除渐变 */
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

export type AnyBlock = ReturnType<MarkdownOperateFromLib['getDocument']>[number]
