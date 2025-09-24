/**
 * 说话人类型定义
 */
export interface SpeakerType {
  /** 说话人唯一标识 */
  blockId?: string
  /** 说话人显示名称 */
  name: string
  /** 内容字符串 */
  content: string
}

/**
 * 上级标题信息类型定义
 */
export interface ParentHeadingInfo {
  /** 标题块对象 */
  block: any
  /** 标题级别 (1-6) */
  level: number
  /** 标题文本内容 */
  text: string
  /** 标题在文档中的索引位置 */
  index: number
}