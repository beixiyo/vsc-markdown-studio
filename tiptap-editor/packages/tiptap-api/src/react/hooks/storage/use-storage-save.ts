import type { Editor } from '@tiptap/react'
import { useDebounceFn } from 'hooks'
import { useCallback } from 'react'
import { getEditorContent } from '../../../operate'
import { DEFAULT_STORAGE_KEY, LocalStorageEngine, type StorageEngine } from '../../../storage'

export function useStorageSave(options: UseStorageSaveOptions = {}) {
  const {
    storageKey = DEFAULT_STORAGE_KEY,
    debounceMs = 300,
    storageEngine = new LocalStorageEngine(),
    onError,
  } = options

  /** 保存内容到存储引擎 */
  const saveToStorage = useCallback(async (editor: Editor): Promise<boolean> => {
    const content = getEditorContent(editor)
    if (content === null)
      return false

    try {
      return await storageEngine.save(JSON.stringify(content), storageKey)
    }
    catch (error) {
      onError?.(error instanceof Error
        ? error
        : new Error(String(error)))
      return false
    }
  }, [storageEngine, storageKey, onError])

  /** 防抖保存函数 */
  const debouncedSave = useDebounceFn((editor: Editor) => {
    saveToStorage(editor)
  }, debounceMs, [saveToStorage])

  /** 立即保存函数（不使用防抖） */
  const immediateSave = useCallback(async (editor: Editor): Promise<boolean> => {
    return await saveToStorage(editor)
  }, [saveToStorage])

  /** 从存储加载内容 */
  const loadFromStorage = useCallback(async (): Promise<string | null> => {
    try {
      return await storageEngine.load(storageKey)
    }
    catch (error) {
      onError?.(error instanceof Error
        ? error
        : new Error(String(error)))
      return null
    }
  }, [storageEngine, storageKey, onError])

  /** 检查存储的内容是否存在 */
  const storageExists = useCallback(async (): Promise<boolean> => {
    try {
      return await storageEngine.exists(storageKey)
    }
    catch (error) {
      onError?.(error instanceof Error
        ? error
        : new Error(String(error)))
      return false
    }
  }, [storageEngine, storageKey, onError])

  /** 删除存储的内容 */
  const removeFromStorage = useCallback(async (): Promise<boolean> => {
    try {
      return await storageEngine.remove(storageKey)
    }
    catch (error) {
      onError?.(error instanceof Error
        ? error
        : new Error(String(error)))
      return false
    }
  }, [storageEngine, storageKey, onError])

  return {
    debouncedSave,
    immediateSave,
    loadFromStorage,
    storageExists,
    removeFromStorage,
    storageEngine,
  }
}

export type UseStorageSaveResult = ReturnType<typeof useStorageSave>

export interface UseStorageSaveOptions {
  /**
   * 存储键名
   */
  storageKey?: string
  /**
   * 防抖延迟时间（毫秒）
   */
  debounceMs?: number
  /**
   * 自定义存储引擎
   */
  storageEngine?: StorageEngine
  /**
   * 错误回调
   */
  onError?: (error: Error) => void
}
