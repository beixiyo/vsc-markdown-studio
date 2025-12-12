import type { StorageEngine, StorageEngineOptions, StorageItem, StorageMetadata } from "./storage-engine"

/**
 * localStorage 存储引擎实现
 */
export class LocalStorageEngine implements StorageEngine {
  private options: Required<StorageEngineOptions>

  constructor(options: StorageEngineOptions = {}) {
    this.options = {
      keyPrefix: options.keyPrefix || "",
      enableCompression: options.enableCompression || false,
      expiration: options.expiration || -1
    }
  }

  /**
   * 获取完整的存储键名
   */
  private getFullKey(key: string): string {
    return `${this.options.keyPrefix}${key}`
  }

  /**
   * 创建存储元数据
   */
  private createMetadata(existingMetadata?: StorageMetadata): StorageMetadata {
    const now = Date.now()
    const expiration = this.options.expiration > -1
      ? now + this.options.expiration
      : undefined

    if (existingMetadata) {
      return {
        ...existingMetadata,
        updatedAt: now,
        expiresAt: expiration
      }
    }

    return {
      createdAt: now,
      updatedAt: now,
      expiresAt: expiration,
      contentType: "text/markdown",
      version: "1.0.0"
    }
  }

  /**
   * 检查内容是否过期
   */
  private isExpired(metadata: StorageMetadata): boolean {
    if (!metadata.expiresAt) return false
    return Date.now() > metadata.expiresAt
  }

  /**
   * 序列化存储项
   */
  private serialize(item: StorageItem): string {
    return JSON.stringify(item)
  }

  /**
   * 反序列化存储项
   */
  private deserialize(data: string): StorageItem | null {
    try {
      return JSON.parse(data) as StorageItem
    } catch {
      return null
    }
  }

  async save(content: string, key: string): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key)

      // 尝试获取现有元数据
      let existingMetadata: StorageMetadata | undefined
      const existingData = localStorage.getItem(fullKey)
      if (existingData) {
        const existingItem = this.deserialize(existingData)
        if (existingItem && !this.isExpired(existingItem.metadata)) {
          existingMetadata = existingItem.metadata
        }
      }

      const metadata = this.createMetadata(existingMetadata)
      const item: StorageItem = { content, metadata }

      localStorage.setItem(fullKey, this.serialize(item))
      return true
    }
    catch (error) {
      console.error("LocalStorage save failed:", error)
      return false
    }
  }

  async load(key: string): Promise<string | null> {
    try {
      const fullKey = this.getFullKey(key)
      const data = localStorage.getItem(fullKey)

      if (!data) return null

      const item = this.deserialize(data)
      if (!item) return null

      // 检查是否过期
      if (this.isExpired(item.metadata)) {
        // 删除过期内容
        await this.remove(key)
        return null
      }

      return item.content
    }
    catch (error) {
      console.error("LocalStorage load failed:", error)
      return null
    }
  }

  async remove(key: string): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key)
      localStorage.removeItem(fullKey)
      return true
    }
    catch (error) {
      console.error("LocalStorage remove failed:", error)
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key)
      const data = localStorage.getItem(fullKey)

      if (!data) return false

      const item = this.deserialize(data)
      if (!item) return false

      // 如果已过期，视为不存在
      if (this.isExpired(item.metadata)) {
        await this.remove(key)
        return false
      }

      return true
    }
    catch (error) {
      console.error("LocalStorage exists check failed:", error)
      return false
    }
  }

  async clear(): Promise<boolean> {
    try {
      const keysToRemove: string[] = []

      // 遍历所有 localStorage 键，找出匹配前缀的键
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.options.keyPrefix)) {
          keysToRemove.push(key)
        }
      }

      // 删除所有匹配的键
      keysToRemove.forEach(key => localStorage.removeItem(key))

      return true
    }
    catch (error) {
      console.error("LocalStorage clear failed:", error)
      return false
    }
  }

  /**
   * 获取所有存储的键名（不包含前缀）
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const keys: string[] = []
      const prefix = this.options.keyPrefix

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(prefix)) {
          const itemKey = key.substring(prefix.length)
          const exists = await this.exists(itemKey)
          if (exists) {
            keys.push(itemKey)
          }
        }
      }

      return keys
    } catch (error) {
      console.error("LocalStorage getAllKeys failed:", error)
      return []
    }
  }

  /**
   * 获取存储项的元数据
   */
  async getMetadata(key: string): Promise<StorageMetadata | null> {
    try {
      const fullKey = this.getFullKey(key)
      const data = localStorage.getItem(fullKey)

      if (!data) return null

      const item = this.deserialize(data)
      if (!item) return null

      // 检查是否过期
      if (this.isExpired(item.metadata)) {
        await this.remove(key)
        return null
      }

      return item.metadata
    } catch (error) {
      console.error("LocalStorage getMetadata failed:", error)
      return null
    }
  }
}
