import type { MarkdownOperate } from 'tiptap-api'

/**
 * 说话人类型（与 markdown-mobile MDBridge 契约一致）
 */
export type SpeakerType = {
  id?: string
  name: string
  label?: string
}

/**
 * 渐变样式类型（与 markdown-mobile MDBridge 契约一致；
 * 具体枚举见 MISSING_IMPLEMENTATIONS.md，待 tiptap 渐变扩展实现）
 */
export type GradientStyleType = string

/**
 * 暴露给 webview 的编辑器桥接接口
 * 与 packages/markdown-mobile 的 MDBridge 接口兼容，基于 tiptap-api createMarkdownOperate 扩展
 */
export type MDBridge = MarkdownOperate & {
  // ======================
  // * Image operations
  // ======================

  setImagesWithURL: (imageUrls: string[]) => Promise<void>
  setFooterImagesWithURL: (imageUrls: string[]) => Promise<void>
  setHeaderImagesWithURL: (imageUrls: string[]) => Promise<void>

  // ======================
  // * Speaker operations
  // ======================

  setSpeakers: (speakers: SpeakerType[]) => Promise<void>
  setContentWithSpeakers: (data: { content: string, speakers: SpeakerType[] }) => Promise<void>

  // ======================
  // * Commands (扩展 MarkdownOperate 的 command)
  // ======================

  command: MarkdownOperate['command'] & {
    setGradient: (type: GradientStyleType) => void
    unsetGradient: () => void
  }
}
