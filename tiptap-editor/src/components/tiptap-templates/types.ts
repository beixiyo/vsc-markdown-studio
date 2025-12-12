import type { SpeakerClick, SpeakerMap } from './extensions'

/**
 * 简单编辑器的配置项
 */
export type EditorProps = {
  /**
   * 以 Markdown 文本作为初始内容
   */
  initialMarkdown?: string
  /**
   * Speaker 映射表，键为 originalLabel
   */
  speakerMap?: SpeakerMap
  /**
   * 点击 Speaker 时触发
   */
  onSpeakerClick?: SpeakerClick
}
