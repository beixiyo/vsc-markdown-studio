import type { Editor } from '@tiptap/react'
import type { BlockSyncController, BlockSyncOptions } from 'tiptap-diff'
import { useLatestCallback, useLatestRef } from 'hooks'
import { useEffect, useRef } from 'react'
import { createBlockSync } from 'tiptap-diff'
import { useTiptapEditor } from '../use-tiptap-editor'

/**
 * 块级 id-diff 同步 Hook：把编辑器变更以增量上报出去
 *
 * 与外部系统（编辑器 + 同步控制器生命周期）同步 —— 走 useEffect + cleanup
 * 控制器仅随 editor 重建；`onDiff` / `onError` 用 useLatestCallback 稳定引用，
 * 改它们不会重建控制器，也不会闭包陈旧
 *
 * @example
 * ```tsx
 * const { ack, requestResync } = useBlockSync({
 *   editor,
 *   hasRemote: false,                 // 后端无该文档 → 首次整篇 pushFull
 *   onDiff: async (payload) => {
 *     const res = await fetch('/api/doc/sync', { method: 'POST', body: JSON.stringify(payload) })
 *     return res.json()               // 返回 BlockSyncResult 按回执处理
 *   },
 * })
 * ```
 */
export function useBlockSync(options: UseBlockSyncOptions): UseBlockSyncResult {
  const { editor } = useTiptapEditor(options.editor)

  const controllerRef = useRef<BlockSyncController | null>(null)

  /** 稳定引用，避免成为 effect 依赖 */
  const onDiff = useLatestCallback(options.onDiff)
  const onError = useLatestCallback((error: unknown) => options.onError?.(error))
  const configRef = useLatestRef(options)

  useEffect(() => {
    if (!editor)
      return

    const config = configRef.current
    const controller = createBlockSync(editor, {
      onDiff,
      onError,
      attributeName: config.attributeName,
      lossyFormat: config.lossyFormat,
      protocolVersion: config.protocolVersion,
      debounceMs: config.debounceMs,
      clientId: config.clientId,
      baseVersion: config.baseVersion,
      autoFlush: config.autoFlush,
    })
    controllerRef.current = controller

    /** 后端已持有该文档 → 当前状态设为基线；否则整篇推上去 */
    if (config.hasRemote) {
      controller.snapshotBaseline(config.baseVersion)
    }
    else {
      controller.pushFull()
    }

    return () => {
      controller.destroy()
      controllerRef.current = null
    }
    /** 仅随 editor 重建；其余配置从 configRef 读最新 */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  const flush = useLatestCallback((force?: boolean) => controllerRef.current?.flush(force))
  const pushFull = useLatestCallback(() => controllerRef.current?.pushFull())
  const ack = useLatestCallback((version: number) => controllerRef.current?.ack(version))
  const requestResync = useLatestCallback((version?: number) => controllerRef.current?.requestResync(version))
  const getBaseVersion = useLatestCallback(() => controllerRef.current?.getBaseVersion() ?? 0)
  const getClientId = useLatestCallback(() => controllerRef.current?.getClientId() ?? '')
  const pause = useLatestCallback(() => controllerRef.current?.pause())
  const resume = useLatestCallback(() => controllerRef.current?.resume())

  return { flush, pushFull, ack, requestResync, getBaseVersion, getClientId, pause, resume }
}

export interface UseBlockSyncOptions extends Omit<BlockSyncOptions, 'onDiff' | 'onError'> {
  /** 编辑器实例；不传则从 Tiptap 上下文取 */
  editor?: Editor | null
  /**
   * 后端是否已持有该文档
   * - `true`：把当前状态设为已同步基线，不重发
   * - `false`（默认）：挂载时整篇 `pushFull` 推上去
   * @default false
   */
  hasRemote?: boolean
  /** 传输回调（见 BlockSyncOptions.onDiff） */
  onDiff: BlockSyncOptions['onDiff']
  /** 传输出错回调 */
  onError?: (error: unknown) => void
}

export interface UseBlockSyncResult {
  /** 立即计算并发送增量 */
  flush: (force?: boolean) => void
  /** 整篇全量重推 */
  pushFull: () => void
  /** 后端异步回执：推进版本（配合无回执传输，如 WebView notify 桥） */
  ack: (version: number) => void
  /** 要求整篇重推 */
  requestResync: (version?: number) => void
  getBaseVersion: () => number
  getClientId: () => string
  /** 暂停同步（外部预览态期间，如 region-edit preview/streaming） */
  pause: () => void
  /** 恢复同步并补发已提交状态 */
  resume: () => void
}
