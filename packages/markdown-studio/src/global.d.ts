declare global {

  /**
   * MDBridge编辑器桥接接口
   * 用于在webview中操作BlockNote编辑器，提供完整的编辑器API访问
   * 通过 window.MDBridge 全局访问
   *
   * @example
   * ```javascript
   * // 设置内容
   * window.MDBridge.setMarkdown('# Hello World');
   *
   * // 监听变化
   * window.MDBridge.onChange((editor) => {
   *   console.log('Content changed');
   * });
   * ```
   */
  interface MDBridge {
    // ======================
    // * Content management
    // ======================

    /**
     * 获取文档的所有顶层块
     * @returns 文档块数组
     */
    getDocument: () => any[]

    /**
     * 设置文档内容（替换所有块）
     * @param blocks 要设置的块数组
     */
    setContent: (blocks: any[]) => void

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
    getMarkdown: () => string

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
    // * Block operations
    // ======================

    /**
     * 在指定位置插入新块
     * @param blocks 要插入的块数组
     * @param referenceBlockId 参考块ID
     * @param placement 插入位置，'before'或'after'
     * @returns 插入的块数组
     */
    insertBlocks: (blocks: any[], referenceBlockId: string, placement?: 'before' | 'after') => any[]

    /**
     * 更新指定块的内容
     * @param blockId 块ID
     * @param update 更新的块数据
     * @returns 更新后的块
     */
    updateBlock: (blockId: string, update: any) => any

    /**
     * 删除指定的块
     * @param blockIds 要删除的块ID数组
     * @returns 删除的块数组
     */
    removeBlocks: (blockIds: string[]) => any[]

    /**
     * 替换指定块为新块
     * @param blockIdsToRemove 要删除的块ID数组
     * @param blocksToInsert 要插入的新块数组
     * @returns 包含插入和删除块的结果对象
     */
    replaceBlocks: (blockIdsToRemove: string[], blocksToInsert: any[]) => { insertedBlocks: any[]; removedBlocks: any[] }

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
     * window.MDBridge.addStyles({ bold: true, italic: true })
     *
     * // 渐变样式
     * window.MDBridge.addStyles({ gradientStyles: 'mysticNight' })
     *
     * // 组合样式
     * window.MDBridge.addStyles({
     *   bold: true,
     *   gradientStyles: 'skyBlue'
     * })
     * ```
     *
     * @param styles 样式对象，支持以下属性：
     * - `bold`: 粗体样式
     * - `italic`: 斜体样式
     * - `underline`: 下划线样式
     * - `strike`: 删除线样式
     * - `code`: 行内代码样式
     * - `gradientStyles`: 渐变样式，可选值：
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
    addStyles: (styles: any) => void

    /**
     * 移除选中内容的样式
     * @example
     * ```ts
     * // 移除粗体和渐变样式
     * window.MDBridge.removeStyles({
     *   bold: true,
     *   gradientStyles: 'mysticNight'
     * })
     * ```
     * @param styles 要移除的样式对象，属性与 addStyles 相同
     */
    removeStyles: (styles: any) => void

    /**
     * 切换选中内容的样式
     * @example
     * ```ts
     * // 切换渐变样式（如果已应用则移除，未应用则添加）
     * window.MDBridge.toggleStyles({ gradientStyles: 'skyBlue' })
     * ```
     * @param styles 要切换的样式对象，属性与 addStyles 相同
     */
    toggleStyles: (styles: any) => void

    /**
     * 获取当前激活的样式
     * @example
     * ```ts
     * const styles = window.MDBridge.getActiveStyles()
     * console.log(styles.gradientStyles) // 'mysticNight' 或 undefined
     * console.log(styles.bold) // true 或 false
     * ```
     * @returns 当前样式对象，包含所有激活的样式属性
     */
    getActiveStyles: () => any



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
    getTextCursorPosition: () => any

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
    getSelection: () => any

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
    getBlockAtPosition: (x: number, y: number) => any | null

    /**
     * 根据DOM元素获取对应的块
     * @param element DOM元素
     * @returns 对应的块信息，如果没有找到则返回null
     */
    getBlockFromElement: (element: Element) => any | null

    /**
     * 添加鼠标悬浮监听器
     * @param callback 悬浮回调函数，参数为块信息
     * @returns 取消监听的函数
     */
    onBlockHover: (callback: (block: any | null) => void) => () => void

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

      /** 切换选中文本的斜体样式 */
      setItalic: () => void

      /** 将当前块设置为检查列表项 */
      setCheckList: () => void

    }

    // ======================
    // * Event callbacks
    // ======================

    /**
     * 监听编辑器内容变化
     * @param callback 变化时的回调函数
     * @returns 取消监听的函数，如果失败返回undefined
     */
    onChange: (callback: (editor: any) => void) => (() => void) | undefined

    /**
     * 监听编辑器选择变化
     * @param callback 选择变化时的回调函数
     * @returns 取消监听的函数，如果失败返回undefined
     */
    onSelectionChange: (callback: (editor: any) => void) => (() => void) | undefined
  }

  /**
   * 全局Window对象扩展
   * 包含编辑器桥接接口的全局访问点
   */
  interface Window {
    /** IOS 通信对象，用于与原生侧通信 */
    webkit?: {
      messageHandlers: {
        [key: string]: {
          postMessage: (content: any) => void
        }
      }
    }
    /** Android 通信对象，用于与原生侧通信 */
    Android?: {
      postMessage: (content: any) => void
    }

    /** MDBridge编辑器桥接接口 */
    MDBridge?: MDBridge | null

    /** 示例内部调试状态（仅验收脚本使用，不建议业务侧依赖） */
    __MDBridgeState?: {
      headerImageUrls?: string[]
      imageUrls?: string[]
      flowing?: boolean
    }

    /** 统一测试工具（在 Console 使用） */
    MDTest?: {
      createResults: () => { total: number; passed: number; failed: number; errors: string[] }
      deepEqual: (a: any, b: any) => boolean
      logTitle: (title: string) => void
      delay: (ms: number) => Promise<void>
      waitForBridge: (predicate: (w: Window & typeof globalThis) => boolean, timeoutMs?: number) => Promise<boolean>
      testCase: (results: { total: number; passed: number; failed: number; errors: string[] }, name: string, fn: () => any, expected?: any) => void
      asyncTestCase: (results: { total: number; passed: number; failed: number; errors: string[] }, name: string, fn: () => Promise<any>, expected?: any) => Promise<void>
      printSummary: (results: { total: number; passed: number; failed: number; errors: string[] }) => void
      clearContent: () => void
      std: {
        waitForMDBridge: (timeoutMs?: number) => Promise<boolean>
        waitForBlockNoteBridge: (timeoutMs?: number) => Promise<boolean>
      }
    }
  }
}

export { }