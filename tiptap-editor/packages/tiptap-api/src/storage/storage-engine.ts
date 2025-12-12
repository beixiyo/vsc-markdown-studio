/**
 * 编辑器内容存储引擎接口
 */
export interface StorageEngine {
  /**
   * 保存编辑器内容
   * @param content 要保存的内容
   * @param key 存储键名
   * @returns Promise<boolean> 保存是否成功
   */
  save(content: string, key: string): Promise<boolean>

  /**
   * 加载编辑器内容
   * @param key 存储键名
   * @returns Promise<string | null> 加载的内容，如果不存在则返回 null
   */
  load(key: string): Promise<string | null>

  /**
   * 删除存储的内容
   * @param key 存储键名
   * @returns Promise<boolean> 删除是否成功
   */
  remove(key: string): Promise<boolean>

  /**
   * 检查存储的内容是否存在
   * @param key 存储键名
   * @returns Promise<boolean> 内容是否存在
   */
  exists(key: string): Promise<boolean>

  /**
   * 清空所有存储
   * @returns Promise<boolean> 清空是否成功
   */
  clear(): Promise<boolean>
}

/**
 * 存储引擎配置选项
 */
export interface StorageEngineOptions {
  /**
   * 存储键名前缀
   */
  keyPrefix?: string

  /**
   * 是否启用压缩
   */
  enableCompression?: boolean

  /**
   * 存储过期时间（毫秒），-1 表示永不过期
   * @default -1
   */
  expiration?: number
}

/**
 * 存储内容元数据
 */
export interface StorageMetadata {
  /**
   * 创建时间
   */
  createdAt: number

  /**
   * 更新时间
   */
  updatedAt: number

  /**
   * 过期时间
   */
  expiresAt?: number

  /**
   * 内容类型
   */
  contentType?: string

  /**
   * 内容版本
   */
  version?: string
}

/**
 * 带元数据的存储项
 */
export interface StorageItem {
  /**
   * 内容
   */
  content: string

  /**
   * 元数据
   */
  metadata: StorageMetadata
}
