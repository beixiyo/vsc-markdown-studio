import type { GradientStyleType } from 'custom-blocknote-gradient-styles'
import type { SpeakerType } from 'custom-blocknote-speaker'
import type { MarkdownOperate } from 'markdown-operate'

/**
 * 暴露给 webview 的编辑器桥接接口
 * 基于 markdown-operate，并扩展了 speaker 和 gradient-styles 的能力
 */
export type MDBridge = MarkdownOperate & {
  // ======================
  // * Image operations
  // ======================

  /**
   * 通过URL设置图片到当前位置（光标位置）
   * @param imageUrls 图片URL数组
   */
  setImagesWithURL: (imageUrls: string[]) => Promise<void>

  /**
   * 通过URL设置底部图片
   * @param imageUrls 图片URL数组
   */
  setFooterImagesWithURL: (imageUrls: string[]) => Promise<void>

  /**
   * 通过URL设置头部图片
   * @param imageUrls 图片URL数组
   */
  setHeaderImagesWithURL: (imageUrls: string[]) => Promise<void>

  // ======================
  // * Speaker operations
  // ======================

  /**
   * 设置说话人列表
   * 如果编辑器已有内容，会重新处理 speaker 标签
   * @param speakers 说话人列表
   */
  setSpeakers: (speakers: SpeakerType[]) => Promise<void>

  /**
   * 设置内容和说话人列表（合并方法）
   * @param data 包含内容和 speakers 的对象
   */
  setContentWithSpeakers: (data: { content: string, speakers: SpeakerType[] }) => Promise<void>

  // ======================
  // * Commands (扩展 MarkdownOperate 的 command)
  // ======================

  /**
   * 提供快捷的格式化命令
   * 继承自 MarkdownOperate，并扩展了渐变样式相关命令
   */
  command: MarkdownOperate['command'] & {
    /** 设置渐变 */
    setGradient: (type: GradientStyleType) => void
    /** 移除渐变 */
    unsetGradient: () => void
  }
}


