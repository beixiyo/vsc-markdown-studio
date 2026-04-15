import type { Editor } from '@tiptap/core'
import type { TiptapOperate } from '../operate'
import type { SpeakerType } from './Speaker'

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

  /** 在文档顶部插入图片（替换已有"头部连续图片块"） */
  setHeaderImagesWithURL: (imageUrls: string[]) => Promise<void>
  /** 在文档底部插入图片（替换已有"尾部连续图片块"） */
  setFooterImagesWithURL: (imageUrls: string[]) => Promise<void>
  /** 在光标位置追加图片 */
  setImagesWithURL: (imageUrls: string[]) => Promise<void>

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
}

export type { SpeakerTappedPayload, SpeakerType } from './Speaker'
