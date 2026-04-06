/**
 * Hover 探测：类型定义（与实现分离，见同目录 `position` / `content` / `highlight`）
 */

/**
 * Hover 位置信息
 */
export interface HoverPosition {
  /** 文档位置 */
  pos: number
  /** 是否在有效位置 */
  inside: number
}

/**
 * getHoverContent / getHoverContentFromCoords 的可选配置
 */
export interface GetHoverContentOptions {
  /**
   * 是否填充当前块全文 `blockText` 以及 `blockFrom` / `blockTo`（用于块级高亮等）
   * 默认关闭：hover 以逻辑行为主，避免整块文本与模型边界带来的「断裂」观感
   * @default false
   */
  includeBlock?: boolean
  /**
   * 是否按块内硬换行（hardBreak 等）切分并填充当前「逻辑行」
   * 注意：浏览器因宽度折行的「视觉行」不在 ProseMirror 模型内，无法由此字段得到
   * @default true
   */
  includeLineInBlock?: boolean
  /**
   * 以 pos 为中心向两侧扩展的字符数，用于 `contextText`；为 0 时不填充上下文
   * @default 0
   */
  contextRadius?: number
}

/**
 * Hover 时获取到的内容信息
 *
 * **能力边界**：
 * - `textContent`：当前解析位置下的**单个文本叶子**或邻近叶子，故往往只有几个字符。
 * - `blockText` / `blockFrom` / `blockTo`：仅当 `GetHoverContentOptions.includeBlock === true` 时填充。
 * - `lineInBlockText`：块内按 **hardBreak / 叶子换行** 切分的逻辑行；**不是** CSS 折行后的屏幕行（默认 hover 主信息）。
 * - `contextText`：文档中连续字符窗口；跨块时含块分隔符换行。
 * - **视觉行**（自动换行）：需用 `caretRangeFromPoint` 等与 DOM 布局结合，本模块不实现。
 */
export interface HoverContent {
  /** 文档位置 */
  pos: number
  /** 文本节点内容（如果存在）——通常为当前叶子的全文，长度较短 */
  textContent?: string
  /** 所在的块节点类型 */
  blockType?: string
  /** 块节点的属性 */
  blockAttrs?: Record<string, unknown>
  /** 块级节点在文档中的 inner 范围 [blockFrom, blockTo) */
  blockFrom?: number
  blockTo?: number
  /** 当前块内全部纯文本（与模型一致，硬换行会反映为 \\n） */
  blockText?: string
  /**
   * 光标所在「逻辑行」：块内按硬换行切分后包含 pos 的那一段（无硬换行时等于整段）
   */
  lineInBlockText?: string
  /** 上述逻辑行在块内的序号，从 0 开始 */
  lineInBlockIndex?: number
  /** 以 pos 为中心截取的上下文（长度约 2 * contextRadius） */
  contextText?: string
  contextFrom?: number
  contextTo?: number
  /**
   * 当前逻辑行在文档中的范围（与 `blockText` 按 \\n 切分一致；空行不填）
   */
  lineInBlockFrom?: number
  lineInBlockTo?: number
  /** 所有应用的 marks */
  marks: Array<{
    type: string
    attrs?: Record<string, unknown>
  }>
  /** 是否在文本节点上 */
  isText: boolean
  /** 父节点类型（如果有） */
  parentType?: string
}

/**
 * 编辑器内 hover 高亮分层：与 {@link HoverContent} 中块范围、上下文范围对应
 */
export type HoverHighlightLayer = 'block' | 'context' | 'line'

export interface HoverHighlightSpec {
  from: number
  to: number
  layer: HoverHighlightLayer
}
