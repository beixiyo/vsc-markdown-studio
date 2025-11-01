import { codeBlockOptions } from '@blocknote/code-block'
import { BlockNoteSchema, createCodeBlockSpec } from '@blocknote/core'
import { GradientStyles } from 'custom-blocknote-gradient-styles'
import { MermaidBlock } from 'custom-blocknote-mermaid'
import { createSpeaker } from 'custom-blocknote-speaker'

export const schema = BlockNoteSchema.create().extend({
  blockSpecs: {
    mermaid: MermaidBlock(),
    codeBlock: createCodeBlockSpec(codeBlockOptions),
  },
  inlineContentSpecs: {
    speaker: createSpeaker(),
  },
  styleSpecs: {
    gradient: GradientStyles,
  },
})
