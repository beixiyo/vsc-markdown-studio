/**
 * Speaker 数据类型（与老版 `packages/markdown-mobile` 保持一致，字段为数字）
 * Native 侧直接传 JSON，字段值是 number
 */
export interface SpeakerType {
  /**
   * Markdown 匹配标识
   * 对应文本中的 `[speaker:X]`
   */
  originalLabel: number
  /**
   * 显示名称
   */
  name: string
  /**
   * 业务唯一标识
   */
  id?: number
  /**
   * 标签值
   */
  label?: number
}

/**
 * Speaker 点击事件的 payload（与老版一致）
 */
export interface SpeakerTappedPayload {
  label: number
  originalLabel: number
  id?: number
  name: string
  speakerName: string
}
