import type { BlockNoteEditor } from '@blocknote/core'
import { BlockNoteExtension } from '@blocknote/core'
import {
  applySuggestions,
  disableSuggestChanges,
  enableSuggestChanges,
  revertSuggestions,
  suggestChanges,
  withSuggestChanges,
} from '@blocknote/prosemirror-suggest-changes'
import { proxy } from 'valtio'
import { getMockAIStream } from './mockLLMService'

/**
 * AI 扩展类
 *
 * 为 BlockNote 编辑器提供 AI 功能，包括：
 * - AI 菜单的打开/关闭管理
 * - 流式 AI 文本生成
 * - 建议变更的显示、接受和拒绝
 * - 自动包装 ProseMirror 的 dispatch 以支持建议变更标记
 *
 * 该扩展使用 `@blocknote/prosemirror-suggest-changes` 插件来自动处理
 * 插入、删除和修改标记的显示，无需手动管理标记。
 */
export class AIExtension extends BlockNoteExtension {
  /**
   * 扩展的唯一标识符
   */
  static override key(): string {
    return 'myAI'
  }

  /** BlockNote 编辑器实例 */
  readonly editor: BlockNoteEditor<any, any, any>

  /** AI 扩展的响应式状态，使用 valtio 进行状态管理 */
  readonly state: AIState

  /** 标记是否已经包装了 ProseMirror 的 dispatch 函数 */
  private suggestionDispatchWrapped = false

  constructor(editor: BlockNoteEditor<any, any, any>) {
    super()
    this.editor = editor
    this.state = proxy<AIState>({ aiMenuState: 'closed' })

    /** 添加建议变更插件 */
    this.addProsemirrorPlugin(suggestChanges())
    /** 确保 ProseMirror 的 dispatch 被正确包装以支持建议变更 */
    this.ensureSuggestDispatch()
  }

  /**
   * 确保 ProseMirror 的 dispatch 函数被正确包装
   *
   * 这个方法使用 `withSuggestChanges` 包装 ProseMirror 编辑器的 `dispatchTransaction` 函数，
   * 使得编辑器能够自动处理建议变更标记（插入、删除、修改标记）。
   *
   * 如果编辑器还没有完全初始化，会使用 `setTimeout` 异步重试。
   * 通过 `suggestionDispatchWrapped` 标志确保只包装一次。
   */
  private ensureSuggestDispatch() {
    if (this.suggestionDispatchWrapped) {
      return
    }

    const tiptapEditor = this.editor._tiptapEditor

    if (!tiptapEditor || !tiptapEditor.view) {
      /** 如果编辑器还没有完全初始化，异步重试 */
      setTimeout(() => {
        this.ensureSuggestDispatch()
      }, 0)
      return
    }

    const view = tiptapEditor.view
    const existing = view.props.dispatchTransaction
    /** 包装现有的 dispatch 函数，如果没有则创建新的 */
    const wrapped = existing
      ? withSuggestChanges(existing)
      : withSuggestChanges()
    view.setProps({
      dispatchTransaction: wrapped,
    })
    this.suggestionDispatchWrapped = true
  }

  /**
   * 更新 AI 菜单的状态，包括思考中、AI 写作中、用户审查中等状态。
   * 如果菜单已关闭，则不会更新状态。
   *
   * @param status - 新的状态
   * @param error - 如果是错误状态，可选的错误信息
   */
  private setAIStatus(
    status: 'thinking' | 'ai-writing' | 'user-reviewing' | 'error',
    error?: unknown,
  ) {
    if (this.state.aiMenuState === 'closed') {
      return
    }

    if (status === 'error') {
      this.state.aiMenuState = {
        blockId: this.state.aiMenuState.blockId,
        status: 'error',
        error: error ?? '未知错误',
      }
    }
    else {
      this.state.aiMenuState = {
        blockId: this.state.aiMenuState.blockId,
        status,
      }
    }
  }

  /**
   * 启用编辑器的建议变更功能，使得 AI 生成的文本能够以建议的形式显示，
   * 用户可以选择接受或拒绝这些建议。
   */
  private enableSuggestions() {
    this.editor.exec((state, dispatch) => {
      return enableSuggestChanges(state, dispatch)
    })
  }

  /**
   * 禁用编辑器的建议变更功能，通常在 AI 完成文本生成后调用，
   */
  private disableSuggestions() {
    this.editor.exec((state, dispatch) => {
      return disableSuggestChanges(state, dispatch)
    })
  }

  /**
   * 在指定的块位置打开 AI 菜单，禁用编辑器编辑功能，
   * 并设置状态为用户输入模式。
   *
   * @param blockId - 要打开 AI 菜单的块 ID
   */
  openAIMenuAtBlock(blockId: string) {
    if (this.state.aiMenuState !== 'closed') {
      return
    }
    this.editor.isEditable = false
    this.state.aiMenuState = {
      blockId,
      status: 'user-input',
    }
  }

  /**
   * 关闭 AI 菜单，禁用建议变更功能，恢复编辑器编辑功能，
   * 并将焦点重新设置到编辑器上。
   */
  async closeAIMenu() {
    await this.disableSuggestions()
    this.state.aiMenuState = 'closed'
    this.editor.isEditable = true
    this.editor.focus()
  }

  /**
   * 调用 LLM 进行文本生成
   *
   * 这是 AI 扩展的核心方法，负责：
   * 1. 验证当前状态是否允许调用 LLM
   * 2. 启用建议变更功能
   * 3. 流式读取 AI 生成的文本并实时插入到编辑器中
   * 4. 处理错误和状态转换
   *
   * 由于使用了 `ensureSuggestDispatch` 包装的 dispatch 函数，
   * 插入的文本会自动被标记为建议变更，用户可以在生成完成后选择接受或拒绝。
   *
   * @param userPrompt - 用户输入的提示词，可选
   */
  async callLLM(userPrompt?: string) {
    if (
      this.state.aiMenuState === 'closed'
      || this.state.aiMenuState.status !== 'user-input'
    ) {
      return
    }

    this.setAIStatus('thinking')

    try {
      /** 启用建议变更功能，使得后续的文本插入会被标记为建议 */
      this.enableSuggestions()

      const stream = await getMockAIStream({ prompt: userPrompt })
      const reader = stream.getReader()
      const decoder = new TextDecoder()

      this.setAIStatus('ai-writing')

      /**
       * 递归读取流式数据
       *
       * 逐块读取 AI 生成的文本并插入到编辑器中。
       * 由于 dispatch 已被 `withSuggestChanges` 包装，
       * 插入的文本会自动显示为建议变更。
       */
      const readStream = async (): Promise<void> => {
        const { done, value } = await reader.read()
        if (done) {
          if (this.state.aiMenuState !== 'closed') {
            this.setAIStatus('user-reviewing')
            this.disableSuggestions()
          }
          return
        }

        if (this.state.aiMenuState === 'closed') {
          return
        }

        const chunk = decoder.decode(value)
        const { state } = this.editor.prosemirrorView
        const tr = state.tr.insertText(chunk)
        /** 由于 dispatch 已被包装，这里会自动添加建议变更标记 */
        this.editor.prosemirrorView.dispatch(tr)

        await readStream()
      }

      await readStream()
    }
    catch (error) {
      this.setAIStatus('error', error)
      this.disableSuggestions()
    }
  }

  /**
   * 将 AI 生成的所有建议变更正式应用到文档中，
   * 移除建议标记，使变更成为文档的正式内容。
   * 只有在用户审查状态下才能调用此方法。
   */
  async acceptChanges() {
    if (
      this.state.aiMenuState === 'closed'
      || this.state.aiMenuState.status !== 'user-reviewing'
    ) {
      return
    }

    this.editor.exec((state, dispatch) => {
      return applySuggestions(state, dispatch)
    })

    await this.closeAIMenu()
  }

  /**
   * 撤销所有 AI 生成的建议变更，恢复到 AI 生成前的状态。
   * 变更不会添加到历史记录中，所以用户可以通过撤销操作回到更早的状态。
   * 只有在用户审查状态下才能调用此方法。
   */
  async rejectChanges() {
    if (
      this.state.aiMenuState === 'closed'
      || this.state.aiMenuState.status !== 'user-reviewing'
    ) {
      return
    }

    this.editor.exec((state, dispatch) => {
      return revertSuggestions(state, (tr) => {
        if (dispatch) {
          dispatch(tr.setMeta('addToHistory', false))
        }
      })
    })

    await this.closeAIMenu()
  }
}

/**
 * 返回一个函数，该函数接受 BlockNote 编辑器实例并创建 AIExtension 实例。
 * 这个函数通常作为扩展传递给 BlockNote 编辑器的 `extensions` 选项。
 *
 * @returns 创建 AIExtension 实例的函数
 */
export function createAIExtension() {
  return (editor: BlockNoteEditor<any, any, any>) => {
    return new AIExtension(editor)
  }
}

/**
 * 从已配置的 BlockNote 编辑器中获取 AIExtension 实例。
 * 如果编辑器没有配置 AI 扩展，会抛出错误。
 *
 * @param editor - BlockNote 编辑器实例
 * @returns AIExtension 实例
 * @throws 如果 AI 扩展未配置
 */
export function getAIExtension(editor: BlockNoteEditor<any, any, any>): AIExtension {
  const aiExtension = editor.extension(AIExtension)

  if (!aiExtension) {
    throw new Error('AIExtension is not configured')
  }

  return aiExtension
}

/**
 * AI 扩展的状态类型定义
 *
 * 管理 AI 菜单的状态，包括菜单是否打开、当前操作的块 ID 以及操作状态
 */
export type AIState = {
  aiMenuState:
    | 'closed' // 菜单关闭状态
    | {
      blockId: string // 当前操作的块 ID
    } & (
      | { status: 'error', error: unknown } // 错误状态
      | { status: 'user-input' | 'thinking' | 'ai-writing' | 'user-reviewing' } // 正常操作状态
  )
}
