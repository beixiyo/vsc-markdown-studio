import type { Editor } from '@tiptap/react'
import { useCallback, useEffect, useRef } from 'react'
import { getEditorContent } from '../../../operate'
import { LocalStorageEngine, type StorageEngine } from '../../../storage'

/** 默认存储键名 */
const DEFAULT_STORAGE_KEY = '@@STORAGE_KEY'

export function useStorageSave(options: UseStorageSaveOptions = {}) {
  const {
    storageKey = DEFAULT_STORAGE_KEY,
    debounceMs = 300,
    storageEngine = new LocalStorageEngine(),
  } = options

  /** 防抖定时器引用 */
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** 保存内容到存储引擎 */
  const saveToStorage = useCallback(async (editor: Editor): Promise<boolean> => {
    const content = getEditorContent(editor)
    if (content === null)
      return false

    try {
      return await storageEngine.save(JSON.stringify(content), storageKey)
    }
    catch (error) {
      console.error('保存内容失败:', error)
      return false
    }
  }, [storageEngine, storageKey])

  /** 防抖保存函数 */
  const debouncedSave = useCallback((editor: Editor) => {
    /** 清除之前的定时器 */
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    /** 设置新的定时器 */
    saveTimeoutRef.current = setTimeout(() => {
      saveToStorage(editor)
    }, debounceMs)
  }, [saveToStorage, debounceMs])

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
      console.error('加载内容失败:', error)
      return null
    }
  }, [storageEngine, storageKey])

  /** 检查存储的内容是否存在 */
  const storageExists = useCallback(async (): Promise<boolean> => {
    try {
      return await storageEngine.exists(storageKey)
    }
    catch (error) {
      console.error('检查存储存在性失败:', error)
      return false
    }
  }, [storageEngine, storageKey])

  /** 删除存储的内容 */
  const removeFromStorage = useCallback(async (): Promise<boolean> => {
    try {
      return await storageEngine.remove(storageKey)
    }
    catch (error) {
      console.error('删除存储内容失败:', error)
      return false
    }
  }, [storageEngine, storageKey])

  /** 组件卸载时清理定时器 */
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

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
}
