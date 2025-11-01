import { codeBlockOptions } from '@blocknote/code-block'
import { BlockNoteSchema, createCodeBlockSpec } from '@blocknote/core'
import { MermaidBlock } from './blocks/mermaid'
import { GradientStyles } from './styles/gradientStyles'

export const schema = BlockNoteSchema.create().extend({
  blockSpecs: {
    mermaid: MermaidBlock(),
    codeBlock: createCodeBlockSpec(codeBlockOptions),
  },
  styleSpecs: {
    gradient: GradientStyles,
  },
})
