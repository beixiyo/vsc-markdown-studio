/**
 * 文件作用：开发/测试态的全局图片状态存储与统计（生产态不写入）
 * 一句话概括：为图片相关用例提供可检验的状态来源（仅 DEV）
 * 被谁使用：`bridgeFactory.ts` 写入图片 URL，`TestStateHelpers.ts` 读取断言
 */
import type { MDBridgeState } from '@/types/MDBridgeTest'

/**
 * 全局状态管理器：开发/测试期用于内部状态观测与断言（生产态不写入）
 */
export class GlobalStateManager {
  private static instance: GlobalStateManager | null = null
  private state: MDBridgeState = {
    imageUrls: [],
    headerImageUrls: [],
  }

  private constructor() {}

  static getInstance(): GlobalStateManager {
    if (!GlobalStateManager.instance) {
      GlobalStateManager.instance = new GlobalStateManager()
    }
    return GlobalStateManager.instance
  }

  /**
   * 初始化状态（现在只是确保状态已创建）
   */
  initializeState(): void {
    /** 状态已经在构造函数中初始化，这里不需要额外操作 */
  }

  /**
   * 获取图片 URL 列表
   */
  getImageUrls(): string[] {
    return [...(this.state.imageUrls || [])].filter(Boolean) as string[]
  }

  /**
   * 设置图片 URL 列表
   */
  setImageUrls(urls: string[]): void {
    if (!import.meta.env.DEV) {
      return
    }
    this.state.imageUrls = [...urls]
  }

  /**
   * 获取头部图片 URL 列表
   */
  getHeaderImageUrls(): string[] {
    return [...(this.state.headerImageUrls || [])].filter(Boolean) as string[]
  }

  /**
   * 设置头部图片 URL 列表
   */
  setHeaderImageUrls(urls: string[]): void {
    if (!import.meta.env.DEV) {
      return
    }
    this.state.headerImageUrls = [...urls]
  }

  /**
   * 清理状态
   */
  clearState(): void {
    this.state = {
      imageUrls: [],
      headerImageUrls: [],
    }
  }

  /**
   * 获取完整状态对象（用于测试）
   */
  getFullState(): MDBridgeState {
    return { ...this.state }
  }

  /**
   * 检查是否有头部图片
   */
  hasHeaderImages(): boolean {
    return this.getHeaderImageUrls().length > 0
  }

  /**
   * 检查是否有内容图片
   */
  hasContentImages(): boolean {
    return this.getImageUrls().length > 0
  }

  /**
   * 获取图片总数
   */
  getTotalImageCount(): number {
    return this.getImageUrls().length + this.getHeaderImageUrls().length
  }
}
