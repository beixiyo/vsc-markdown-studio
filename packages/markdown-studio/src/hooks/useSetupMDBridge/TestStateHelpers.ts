/**
 * 文件作用：封装 GlobalStateManager，提供测试期便捷断言方法
 * 一句话概括：图片状态的只读测试助手
 * 被谁使用：测试/调试代码直接调用其静态方法与便捷导出
 */
import { GlobalStateManager } from './GlobalStateManager'

/**
 * 测试辅助工具
 * 提供测试时访问状态的便捷方法，避免直接访问全局变量
 */
export class TestStateHelpers {
  private static globalStateManager = GlobalStateManager.getInstance()

  /**
   * 获取头部图片数量
   */
  static getHeaderImageCount(): number {
    return this.globalStateManager.getHeaderImageUrls().length
  }

  /**
   * 获取内容图片数量
   */
  static getContentImageCount(): number {
    return this.globalStateManager.getImageUrls().length
  }

  /**
   * 检查头部图片是否包含指定内容
   */
  static checkHeaderImageContains(index: number, content: string): boolean {
    const urls = this.globalStateManager.getHeaderImageUrls()
    return (urls[index] || '').includes(content)
  }

  /**
   * 检查内容图片是否包含指定内容
   */
  static checkContentImageContains(index: number, content: string): boolean {
    const urls = this.globalStateManager.getImageUrls()
    return (urls[index] || '').includes(content)
  }

  /**
   * 获取完整状态信息（用于测试验证）
   */
  static getTestState() {
    return {
      headerCount: this.getHeaderImageCount(),
      contentCount: this.getContentImageCount(),
      totalCount: this.globalStateManager.getTotalImageCount(),
      hasHeaderImages: this.globalStateManager.hasHeaderImages(),
      hasContentImages: this.globalStateManager.hasContentImages(),
    }
  }
}

/**
 * 导出便捷函数
 */
export const {
  getHeaderImageCount,
  getContentImageCount,
  checkHeaderImageContains,
  checkContentImageContains,
  getTestState,
} = TestStateHelpers
