export type SpeakerMapValue = {
  name: string
  id?: string
  label?: string
}

/**
 * 说话人节点属性
 */
export type SpeakerAttributes = {
  /**
   * 原始标签文本
   */
  originalLabel: string
  /**
   * 映射后的显示名称
   */
  name?: string
  /**
   * 说话人唯一标识
   */
  id?: string
  /**
   * 自定义标签
   */
  label?: string
}

/**
 * 说话人扩展配置
 */
export type SpeakerOptions = {
  /**
   * 标签与显示信息的映射表
   * @default {}
   */
  speakerMap?: Record<string, SpeakerMapValue>
  /**
   * 自定义类名
   * @default undefined
   */
  className?: string
  /**
   * 渲染所使用的标签
   * @default 'strong'
   */
  renderTag?: string
  /**
   * 点击回调
   * @default undefined
   */
  onClick?: (attrs: SpeakerAttributes, event: MouseEvent) => void
}