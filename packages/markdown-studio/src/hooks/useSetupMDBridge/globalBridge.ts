import type { MDBridge } from '@/types/MDBridge'

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

/**
 * 获取全局桥接器实例
 */
export function getGlobalBridgeManager(): GlobalBridgeManager {
  return GlobalBridgeManager.getInstance()
}
