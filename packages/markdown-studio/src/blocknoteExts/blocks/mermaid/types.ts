import type {
  BlockFromConfig,
  BlockNoteEditor,
  BlockSchemaWithBlock,
  defaultProps,
  InlineContentSchema,
  StyleSchema,
} from '@blocknote/core'

/**
 * Mermaid 块配置
 */
export interface MermaidBlockConfig {
  type: 'mermaid'
  content: 'none'
  propSchema: {
    diagram: {
      default: string
      type: 'string'
    }
    textAlignment: typeof defaultProps.textAlignment
    textColor: typeof defaultProps.textColor
  }
}

/**
 * 包含 Mermaid 块的 BlockSchema
 */
export type MermaidBlockSchema = BlockSchemaWithBlock<'mermaid', MermaidBlockConfig>

/**
 * Mermaid 块类型 - 使用 BlockNote 的 BlockFromConfig
 * 这里使用 any 是因为 BlockNote 的类型系统过于复杂，直接使用会导致类型转换问题
 * 但通过接口约束保证类型安全
 */
export type MermaidBlock = BlockFromConfig<MermaidBlockConfig, InlineContentSchema, StyleSchema>

/**
 * 包含 Mermaid 块的编辑器类型
 */
export type MermaidBlockNoteEditor = BlockNoteEditor<MermaidBlockSchema, InlineContentSchema, StyleSchema>
