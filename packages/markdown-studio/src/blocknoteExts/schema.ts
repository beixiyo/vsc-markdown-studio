import { codeBlockOptions } from '@blocknote/code-block'
import { BlockNoteSchema, createCodeBlockSpec } from '@blocknote/core'
import { GradientStyles } from 'custom-blocknote-gradient-styles'
import { MermaidBlock } from 'custom-blocknote-mermaid'

export const schema = BlockNoteSchema.create().extend({
  blockSpecs: {
    mermaid: MermaidBlock(),
    codeBlock: createCodeBlockSpec(codeBlockOptions),
  },
  styleSpecs: {
    gradient: GradientStyles,
  },
})
