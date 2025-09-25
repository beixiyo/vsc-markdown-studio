import { codeBlockOptions } from '@blocknote/code-block'
import { BlockNoteSchema, createCodeBlockSpec } from '@blocknote/core'
import { LabelInputBlock } from './blocks/labelInput'
import { MermaidBlock } from './blocks/mermaid'
import { GradientStyles } from './styles/gradientStyles'

export const schema = BlockNoteSchema.create().extend({
  blockSpecs: {
    mermaid: MermaidBlock(),
    labelInput: LabelInputBlock(),
    codeBlock: createCodeBlockSpec(codeBlockOptions),
  },
  styleSpecs: {
    gradient: GradientStyles,
  },
})
