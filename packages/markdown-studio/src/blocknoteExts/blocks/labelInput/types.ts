import type {
  BlockNoteEditor,
  BlockSchemaWithBlock,
  defaultProps,
  InlineContentSchema,
  StyleSchema,
} from '@blocknote/core'

/**
 * LabelInput 块配置
 */
export interface LabelInputBlockConfig {
  type: 'labelInput'
  content: 'inline'
  propSchema: {
    /** 标签文本 */
    label: {
      default: string
      type: 'string'
    }
    /** 文本对齐方式 */
    textAlignment: typeof defaultProps.textAlignment
    /** 文本颜色 */
    textColor: typeof defaultProps.textColor
  }
}

/**
 * 包含 LabelInput 块的 BlockSchema
 */
export type LabelInputBlockSchema = BlockSchemaWithBlock<'labelInput', LabelInputBlockConfig>

/**
 * 包含 LabelInput 块的编辑器类型
 */
export type LabelInputBlockNoteEditor = BlockNoteEditor<LabelInputBlockSchema, InlineContentSchema, StyleSchema>

/**
 * LabelInput 菜单项配置
 */
export interface LabelInputMenuItemConfig {
  key: string
  title: string
  onItemClick: (editor: LabelInputBlockNoteEditor) => void
  aliases: string[]
  group: string
  icon: React.ReactNode
  hint: string
}
