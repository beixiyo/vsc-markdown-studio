import type { Editor } from '@tiptap/core'
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
   * 只传需要覆盖的字段，未传的保持默认值。
   * 传空对象 `{}` 可重置为默认排版。
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
}

export type { SpeakerTappedPayload, SpeakerType } from './Speaker'
