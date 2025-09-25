import { codeBlockOptions } from '@blocknote/code-block'
import { BlockNoteSchema, createCodeBlockSpec } from '@blocknote/core'
import { GradientStyles } from './gradientStyles/GradientStyles'
import { LabelInputBlock } from './labelInput'
import { MermaidBlock } from './mermaid'

export const schema = BlockNoteSchema.create().extend({
  blockSpecs: {
    mermaid: MermaidBlock(),
    labelInput: LabelInputBlock(),
    codeBlock: createCodeBlockSpec(codeBlockOptions),
  },
  styleSpecs: {
    gradientStyles: GradientStyles,
  },
})
