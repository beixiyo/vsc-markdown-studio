import { EventBus } from '@jl-org/tool'

export type MermaidState = {
  change: {
    id: string
    mode: 'edit'
  }
}
export const mermaidEvents = new EventBus<MermaidState>()
