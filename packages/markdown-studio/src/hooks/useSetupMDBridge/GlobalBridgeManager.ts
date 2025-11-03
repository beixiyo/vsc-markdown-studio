/**
 * 文件作用：全局桥接器，持有并暴露 MDBridge，同时集中写入选区上下文到 bridge.state
 * 一句话概括：对外统一的 MDBridge 访问与选区上下文同步入口
 * 被谁使用：`useSetupMDBridge/index.ts` 设置/清理实例，`useClickSection.ts` 与 `useHoverSection.ts` 调用 `setSelectionContexts`，外部也可通过 `window.MDBridge` 访问
 */
import type { DocSection } from 'markdown-operate'
import type { MDBridge, SelectionContext, SelectionContextMap } from '@/types/MDBridge'

const emptySection: DocSection = {
  blocks: [],
  heading: null,
  startBlock: null,
  endBlock: null,
}

/**
 * 全局桥接器
 * 用于在外部访问 MDBridge，但不直接在 useSetupMDBridge 内部操作全局变量
 */
export class GlobalBridgeManager {
  private static instance: GlobalBridgeManager | null = null
  private bridge: MDBridge | null = null

  private constructor() { }

  static getInstance(): GlobalBridgeManager {
    if (!GlobalBridgeManager.instance) {
      GlobalBridgeManager.instance = new GlobalBridgeManager()
    }
    return GlobalBridgeManager.instance
  }

  setSelectionContexts(contexts: SelectionContext[]) {
    if (!this.bridge) {
      return
    }

    const bridge = this.bridge
    if (!bridge.state.selectionContexts) {
      bridge.state.selectionContexts = {} as SelectionContextMap
    }
    const selectionContexts = bridge.state.selectionContexts

    contexts.forEach((context) => {
      selectionContexts[context.mode] = {
        ...context,
        section: context.section
          ? {
              ...context.section,
              blocks: [...context.section.blocks],
            }
          : null,
      }

      if (context.mode === 'headingSection') {
        bridge.state.lastGroupBlock = context.section
          ? {
              ...context.section,
              blocks: [...context.section.blocks],
            }
          : emptySection
        bridge.state.lastGroupMarkdown = context.section
          ? context.markdown
          : ''
      }

      if (context.mode === 'block') {
        bridge.state.lastBlock = context.block
        bridge.state.lastBlockMarkdown = context.block
          ? context.markdown
          : ''
      }
    })
  }

  /**
   * 设置 MDBridge 实例
   */
  setBridge(bridge: MDBridge): void {
    this.bridge = bridge
    /** 同步到全局 window 对象，供外部使用 */
    if (typeof window !== 'undefined') {
      window.MDBridge = bridge
    }
  }

  /**
   * 获取 MDBridge 实例
   */
  getBridge(): MDBridge | null {
    return this.bridge
  }

  /**
   * 清理 MDBridge 实例
   */
  clearBridge(): void {
    this.bridge = null
    if (typeof window !== 'undefined') {
      window.MDBridge = null as any
    }
  }
}
