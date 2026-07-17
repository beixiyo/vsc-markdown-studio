/**
 * speaker 节点属性（示例最小集）
 *
 * 只保留展示与匹配必需的字段。业务侧若要携带更多数据（说话人 id 等），
 * 应在自己的宿主层扩展，而非塞进这个通用示例节点
 */
export type SpeakerAttributes = {
  /** markdown 匹配键，对应文本中的 `[speaker:X]` */
  originalLabel: string
  /**
   * 展示名；由宿主写入节点 attrs（如从服务端说话人列表同步）
   * @default null
   */
  name?: string | null
}

/** speaker 扩展配置 */
export type SpeakerOptions = {
  /**
   * originalLabel → 展示信息的映射，仅作为节点 attrs.name 缺失时的初始兜底。
   * tiptap 的 extension options 运行时不可变，动态改名请直接写节点 attrs
   * @default {}
   */
  speakerMap?: Record<string, { name: string }>
  /**
   * 标签自定义类名
   * @default undefined
   */
  className?: string
  /**
   * 渲染所用标签
   * @default 'strong'
   */
  renderTag?: string
  /**
   * 展示 originalLabel 前的变换（如 0 基序号 +1）
   * @default undefined
   */
  formatLabel?: (originalLabel: string) => string
  /**
   * 点击标签的回调（如打开「编辑说话人」面板）；不传则标签不可点
   * @default undefined
   */
  onClick?: (attrs: SpeakerAttributes, event: MouseEvent) => void
}
