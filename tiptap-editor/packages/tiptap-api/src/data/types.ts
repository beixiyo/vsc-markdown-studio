
/**
 * Markdown 大纲节点
 */
export type OutlineItem = {
  /**
   * 唯一标识，使用文档位置保证可追踪
   */
  id: string
  /**
   * 标题等级，1-6
   * @default 1
   */
  level: number
  /**
   * 标题纯文本
   */
  text: string
  /**
   * 在文档中的位置，可用于滚动或高亮
   */
  position: number
  /**
   * 子标题
   * @default []
   */
  children: OutlineItem[]
}
