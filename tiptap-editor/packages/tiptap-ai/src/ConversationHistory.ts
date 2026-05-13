import type { ConversationMessage } from './types'

/**
 * 多轮对话历史管理器，独立于 orchestrator 使用
 */
export class ConversationHistory {
  private messages: ConversationMessage[] = []
  private maxRounds: number

  constructor(options?: ConversationHistoryOptions) {
    this.maxRounds = options?.maxRounds ?? 100
  }

  /** 获取全部消息（返回副本） */
  getMessages(): ConversationMessage[] {
    return [...this.messages]
  }

  /** 消息总数 */
  get length() {
    return this.messages.length
  }

  isEmpty() {
    return this.messages.length === 0
  }

  /** 获取最后一条指定角色的消息 */
  getLastMessage(role?: 'user' | 'assistant'): ConversationMessage | undefined {
    if (!role)
      return this.messages.at(-1)
    for (let i = this.messages.length - 1; i >= 0; i--) {
      if (this.messages[i].role === role)
        return this.messages[i]
    }
    return undefined
  }

  /** 获取按轮次分组的对话（每轮 = user + assistant） */
  getRounds(): ConversationRound[] {
    const rounds: ConversationRound[] = []

    for (let i = 0; i < this.messages.length - 1; i += 2) {
      const user = this.messages[i]
      const assistant = this.messages[i + 1]
      if (user?.role === 'user' && assistant?.role === 'assistant')
        rounds.push({ user, assistant })
    }

    return rounds
  }

  /** 添加一条消息 */
  push(message: ConversationMessage) {
    this.messages.push(message)
    this.trim()
  }

  /** 添加完整一轮（user + assistant） */
  addRound(userContent: string, assistantContent: string) {
    if (userContent)
      this.messages.push({ role: 'user', content: userContent })
    if (assistantContent)
      this.messages.push({ role: 'assistant', content: assistantContent })
    this.trim()
  }

  /** 替换全部消息 */
  set(messages: ConversationMessage[]) {
    this.messages = [...messages]
    this.trim()
  }

  /** 清空 */
  clear() {
    this.messages = []
  }

  /** 更新最大轮数 */
  setMaxRounds(max: number) {
    this.maxRounds = max
    this.trim()
  }

  private trim() {
    const max = this.maxRounds * 2
    if (this.messages.length > max)
      this.messages = this.messages.slice(-max)
  }
}

export type ConversationHistoryOptions = {
  /**
   * 最大保留轮数（一轮 = user + assistant）
   * @default 100
   */
  maxRounds?: number
}

export type ConversationRound = {
  user: ConversationMessage
  assistant: ConversationMessage
}
