import type { StateManager } from './bridgeFactory'
import { getGlobalStateManager } from './globalStateManager'

/**
 * 状态管理器实现
 * 通过依赖注入的方式管理状态，避免直接访问全局变量
 */
export class MDBridgeStateManager implements StateManager {
  private globalStateManager = getGlobalStateManager()

  constructor() {
    /** 初始化全局状态 */
    this.globalStateManager.initializeState()
  }

  getImageUrls(): string[] {
    return this.globalStateManager.getImageUrls()
  }

  setImageUrls(urls: string[]): void {
    this.globalStateManager.setImageUrls(urls)
  }

  getHeaderImageUrls(): string[] {
    return this.globalStateManager.getHeaderImageUrls()
  }

  setHeaderImageUrls(urls: string[]): void {
    this.globalStateManager.setHeaderImageUrls(urls)
  }
}

/**
 * 创建状态管理器实例
 */
export function createStateManager(): StateManager {
  return new MDBridgeStateManager()
}
