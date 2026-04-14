import type { Editor } from '@tiptap/core'
import type { SpeakerAttributes } from 'tiptap-nodes/speaker'
import type { TiptapOperate } from '../operate'

/**
 * 暴露给 Native WebView 的桥接接口
 * 基于 tiptap 封装，与老版 BlockNote 版本在"block id 语义"的 API 上**不兼容**
 */
export type MDBridge = TiptapOperate & {
  /** 原始 editor 实例（调试用，Native 不应依赖） */
  readonly _editor: Editor

  /** 在文档顶部插入图片（替换已有"头部连续图片块"） */
  setHeaderImagesWithURL: (imageUrls: string[]) => Promise<void>
  /** 在文档底部插入图片（替换已有"尾部连续图片块"） */
  setFooterImagesWithURL: (imageUrls: string[]) => Promise<void>
  /** 在光标位置追加图片 */
  setImagesWithURL: (imageUrls: string[]) => Promise<void>

  /** 设置说话人映射（重新渲染已有 speaker 节点） */
  setSpeakers: (speakers: SpeakerAttributes[]) => Promise<void>
  /** 同时设置 markdown 内容与说话人映射 */
  setContentWithSpeakers: (data: { content: string, speakers: SpeakerAttributes[] }) => Promise<void>
}
