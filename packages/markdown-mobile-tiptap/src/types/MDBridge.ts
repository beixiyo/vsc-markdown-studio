import type { Editor } from '@tiptap/core'
import type {
  ApplyPayload,
  ApplyResult,
  BeginStreamPayload,
  BeginStreamResult,
  ReadBlocksOptions,
  ReadBlocksResult,
  RegionEditState,
} from 'tiptap-ai'
import type { ImageAttrs } from 'tiptap-nodes/image'
import type { TiptapOperate } from '../operate'
import type { SetImagePayload } from '../operate/image'
import type { SpeakerType } from './Speaker'

/** 可覆盖的 CSS 排版属性 */
export type TypographyCSSProperties = {
  fontSize?: string
  lineHeight?: string
  fontWeight?: string
  letterSpacing?: string
  fontFamily?: string
}

/** 排版配置：按元素类型分别设置样式 */
export type TypographyConfig = Partial<Record<
  | 'heading1' | 'heading2' | 'heading3'
  | 'heading4' | 'heading5' | 'heading6'
  | 'paragraph' | 'code' | 'inlineCode'
  | 'blockquote' | 'list',
  TypographyCSSProperties
>>

/**
 * 暴露给 Native WebView 的桥接接口
 */
export type MDBridge = TiptapOperate & {
  /** 原始 editor 实例（调试用，Native 不应依赖） */
  readonly _editor: Editor

  /**
   * 设置编辑器底部留白（px）
   * 给键盘弹出时的可视区域留余量，参数由 Native 侧传入
   * @param px 像素值；传 0 即清除
   */
  setBottomMargin: (px: number) => void

  /**
   * 设置文本方向（RTL / LTR / 自动检测）
   * @param direction `'rtl'` 右到左 | `'ltr'` 左到右 | `'auto'` 按内容自动判定
   */
  setTextDirection: (direction: 'ltr' | 'rtl' | 'auto') => void

  /**
   * 插入图片
   *
   * 使用见 [tiptap-editor/packages/tiptap-nodes/src/image/README.md](../../../tiptap-editor/packages/tiptap-nodes/src/image/README.md)
   */
  setImage: (payload: SetImagePayload) => Promise<void>

  /**
   * 按 id 更新图片属性（局部合并）
   * @returns 命中返回 true，未找到返回 false
   */
  updateImage: (payload: { id: string, attrs: Partial<ImageAttrs> }) => Promise<boolean>

  /**
   * 按 id 删除图片
   * @returns 命中返回 true，未找到返回 false
   */
  removeImage: (payload: { id: string }) => Promise<boolean>

  /**
   * 按 id 同步读取图片完整 attrs（按需拉全量，事件不再携带 attrs）
   * @returns 命中返回完整属性对象，未找到返回 null
   */
  getImageAttrs: (id: string) => ImageAttrs | null

  /**
   * 设置说话人列表
   * 会重新映射已有 speaker 节点，并把当前文档里的 `[speaker:X]` 原位替换
   */
  setSpeakers: (speakers: SpeakerType[]) => Promise<void>
  /**
   * 设置内容和说话人列表（合并调用）
   * `content` 为 Markdown 字符串；`speakers` 与 `setSpeakers` 一致
   */
  setContentWithSpeakers: (data: { content: string, speakers: SpeakerType[] }) => Promise<void>

  /**
   * 动态调整排版样式（字号、行高、字重等）
   *
   * 只传需要覆盖的字段，未传的保持默认值
   * 传空对象 `{}` 可重置为默认排版
   *
   * @example
   * ```ts
   * MDBridge.setTypography({
   *   heading1: { fontSize: '20px', fontWeight: '700' },
   *   paragraph: { fontSize: '18px', lineHeight: '2' },
   * })
   * ```
   */
  setTypography: (config: TypographyConfig) => void

  /**
   * AI 区域编辑（hash 锚点协议）
   *
   * 协议文档：tiptap-editor/docs/ai-region-edit-protocol.md
   * 流程：readBlocks 取锚点 → applyOperations 批量应用 / 流式三件套 → accept / reject
   *
   * web → 原生事件：`aiEditStateChanged`（idle / streaming / preview）、`aiEditConflict`
   */
  aiEdit: {
    /** 读取文档顶层块列表（hash 锚点 + Markdown，必要时附无损 HTML） */
    readBlocks: (options?: ReadBlocksOptions) => ReadBlocksResult
    /** 批量应用操作；options.preview 为 true 时进入预览态等待 accept/reject */
    applyOperations: (payload: ApplyPayload) => ApplyResult
    /** 开始流式编辑，返回 streamId；目标块进入处理中装饰 */
    beginStream: (payload: BeginStreamPayload) => BeginStreamResult
    /** 推送流式增量（web 端自动合批渲染，原生侧仍建议 ≥ 32ms 合批调用） */
    pushChunk: (streamId: string, delta: string) => void
    /** 结束流，进入预览态 */
    endStream: (streamId: string) => void
    /** 采纳当前预览（写入 undo 历史） */
    accept: () => void
    /** 放弃当前预览，还原原内容 */
    reject: () => void
    /** 当前状态 */
    getState: () => RegionEditState
  }

  /**
   * 块级 id-diff 增量同步（编辑器 → 后端）
   *
   * web 端在内容变更时按块算出增量，经 `notify` 的 `contentDiff` 事件上报；
   * 原生侧把载荷转发后端，再用下列方法把结果回执给 web（推进版本 / 要求重推）
   * 由 `useBlockSyncBridge` 注入，未启用时为 undefined
   */
  sync?: {
    /** 立即计算并发送增量（force=true 即使无变化也发） */
    flush: (force?: boolean) => void
    /** 整篇全量重推（首次 / 兜底） */
    pushFull: () => void
    /** 原生回执：推进 baseVersion（无回执传输下由原生在后端 ack 后调用） */
    ack: (version: number) => void
    /** 原生要求整篇重推（版本不符 / 校验和漂移时） */
    requestResync: (version?: number) => void
    /** 当前 baseVersion */
    getBaseVersion: () => number
    /** 客户端 id */
    getClientId: () => string
  }
}

export type { SpeakerTappedPayload, SpeakerType } from './Speaker'
