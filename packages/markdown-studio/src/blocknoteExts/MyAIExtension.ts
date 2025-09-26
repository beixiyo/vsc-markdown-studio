import { BlockNoteEditor, BlockNoteExtension } from '@blocknote/core'
import { proxy } from 'valtio'
import { getMockAIStream } from './mockLLMService'
import {
  applySuggestions,
  revertSuggestions,
  suggestChanges,
} from '@blocknote/prosemirror-suggest-changes'

// 定义 AI 状态机的具体状态
export type AIState = {
  aiMenuState:
    | 'closed'
    | {
        blockId: string
      } & (
        | { status: 'error'; error: any }
        | { status: 'user-input' | 'thinking' | 'ai-writing' | 'user-reviewing' }
      )
}

// 定义我们自己的 AI 扩展
export class MyAIExtension extends BlockNoteExtension {
  // BlockNote 要求每个扩展都有一个唯一的 key
  public static override key(): string {
    return "myAI"
  }

  public readonly editor: BlockNoteEditor<any, any, any>
  public readonly state: AIState

  constructor(editor: BlockNoteEditor<any, any, any>) {
    super()
    this.editor = editor
    this.state = proxy<AIState>({ aiMenuState: 'closed' })

    this.addProsemirrorPlugin(suggestChanges())
  }

  // 私有辅助方法，用于安全地更新 AI 状态
  private setAIStatus(
    status: 'thinking' | 'ai-writing' | 'user-reviewing' | 'error',
    error?: any
  ) {
    if (this.state.aiMenuState === 'closed') {
      return
    }

    this.state.aiMenuState = {
      blockId: this.state.aiMenuState.blockId,
      status: status,
      ...(error && { error }),
    }
  }

  // 打开 AI 菜单
  public openAIMenuAtBlock(blockId: string) {
    if (this.state.aiMenuState !== 'closed') {
      return
    }
    this.editor.isEditable = false
    this.state.aiMenuState = {
      blockId,
      status: 'user-input',
    }
  }

  // 关闭 AI 菜单
  public closeAIMenu() {
    this.state.aiMenuState = 'closed'
    this.editor.isEditable = true
    this.editor.focus()
  }

  // 编排和执行 AI 请求的核心方法
  public async callLLM() {
    if (
      this.state.aiMenuState === 'closed' ||
      this.state.aiMenuState.status !== 'user-input'
    ) {
      return
    }

    this.setAIStatus('thinking')

    const stream = await getMockAIStream()
    const reader = stream.getReader()
    const decoder = new TextDecoder()

    this.setAIStatus('ai-writing')

    const readStream = async () => {
      const { done, value } = await reader.read()
      if (done) {
        if (this.state.aiMenuState !== 'closed') {
          this.setAIStatus('user-reviewing')
        }
        return
      }

      const chunk = decoder.decode(value)

      // 正确的方式：创建一个常规的文本插入事务，
      // 然后用 `setMeta` 给它打上一个特殊的标记。
      // `suggestChanges` 插件会捕获这个标记，并将其渲染为“建议”。
      const { state } = this.editor.prosemirrorView
      const tr = state.tr.insertText(chunk)
      tr.setMeta('suggestion', true)
      this.editor.prosemirrorView.dispatch(tr)

      await readStream()
    }

    await readStream()
  }

  // 接受 AI 建议
  public acceptChanges() {
    if (
      this.state.aiMenuState === 'closed' ||
      this.state.aiMenuState.status !== 'user-reviewing'
    ) {
      return
    }

    applySuggestions(this.editor.prosemirrorView.state, this.editor.prosemirrorView.dispatch)
    this.closeAIMenu()
  }

  // 拒绝 AI 建议
  public rejectChanges() {
    if (
      this.state.aiMenuState === 'closed' ||
      this.state.aiMenuState.status !== 'user-reviewing'
    ) {
      return
    }

    revertSuggestions(this.editor.prosemirrorView.state, this.editor.prosemirrorView.dispatch)
    this.closeAIMenu()
  }
}

// 工厂函数
export const createMyAIExtension = () => {
  return (editor: BlockNoteEditor<any, any, any>) => {
    return new MyAIExtension(editor)
  }
}

// 帮助函数
export const getMyAIExtension = (editor: BlockNoteEditor<any, any, any>): MyAIExtension => {
  const aiExtension = editor.extension(MyAIExtension)

  if (!aiExtension) {
    throw new Error('MyAIExtension is not configured')
  }

  return aiExtension
}
