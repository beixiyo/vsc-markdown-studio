/**
 * Speaker 数据类型定义
 */
export interface SpeakerType {
  /**
   * Markdown 匹配标识
   * 用于匹配 Markdown 中的 [speaker:X] 标签
   */
  originalLabel: number
  /**
   * 显示名称
   * Speaker 在编辑器中实际渲染的文本内容
   */
  name: string
  /**
   * 业务唯一标识（可选）
   * Speaker 在业务系统中的真实 ID
   */
  id?: number
  /**
   * 标签值
   */
  label?: number
}
