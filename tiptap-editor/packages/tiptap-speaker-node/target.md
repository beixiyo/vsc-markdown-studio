# 目标
1. 实现特殊的 markdown 解析，将 `[speaker:数字]` 文本(下面成为 STag)，转为加粗的文本，并检测 STag 两侧是否有空格，如果没有，则自动添加上空格
2. 这个 STag 冒号后的数字，将替换为特殊的文本，外部会传入一个 map 结构，来渲染 speaker 标签的内容
  ```ts
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
    * 比如 Speaker:X 在编辑器中实际渲染的文本内容
    */
    name: string
    /**
    * 业务唯一标识（可选）
    * Speaker 在业务系统中的真实 ID
    */
    id?: number
    /**
     * 标签值，可选
     */
    label?: number
  }
  ```
3. 转为 html 解析时，携带 data-speaker-original-label、data-speaker-label、data-speaker-id、data-speaker-name
