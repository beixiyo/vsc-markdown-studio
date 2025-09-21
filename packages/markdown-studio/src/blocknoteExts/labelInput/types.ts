import type {
  BlockFromConfig,
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
 * LabelInput 块类型
 */
export type LabelInputBlock = BlockFromConfig<LabelInputBlockConfig, InlineContentSchema, StyleSchema>

/**
 * 包含 LabelInput 块的编辑器类型
 */
export type LabelInputBlockNoteEditor = BlockNoteEditor<LabelInputBlockSchema, InlineContentSchema, StyleSchema>

/**
 * LabelInput 渲染器属性
 */
export interface LabelInputRendererProps {
  block: LabelInputBlock
  editor: LabelInputBlockNoteEditor
}

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
