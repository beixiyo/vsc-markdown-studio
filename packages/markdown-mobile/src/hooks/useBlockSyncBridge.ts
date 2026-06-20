import type { Editor } from '@tiptap/core'
import { notifyNative } from 'notify'
import { useEffect } from 'react'
import { createBlockSync } from 'tiptap-diff'

/**
 * 把块级 id-diff 增量同步接到 WebView 桥
 *
 * - 内容变更（防抖）→ 计算增量 → `notifyNative('contentDiff', payload)` 单向上报；
 *   无回执，乐观提交本地快照
 * - 原生侧把载荷发后端后，用 `window.MDBridge.sync.ack(version)` 推进版本，
 *   或 `requestResync()` 要求整篇重推
 *
 * 与既有 `useNotifyChange` 的全量 `contentChanged` 并存：原生可逐步迁移到 `contentDiff`，
 * 迁移完成后即可停发 `contentChanged`
 *
 * 前置：编辑器需注册 `BlockId` 扩展（否则块无稳定 id，退化为按位置匹配）
 */
export function useBlockSyncBridge(editor: Editor | null, options?: { debounceMs?: number }) {
  useEffect(() => {
    if (!editor)
      return

    const controller = createBlockSync(editor, {
      debounceMs: options?.debounceMs ?? 500,
      /**
       * lossy 块降级用 JSON 而非默认 html：要让 blockId 跨重载稳定、且自定义节点/富属性
       * （图片宽高、渐变高亮等）逐字节无损地存回后端，必须用整块 PM JSON；html 对富节点有损
       */
      lossyFormat: 'json',
      onDiff: payload => notifyNative('contentDiff', payload),
    })

    /**
     * 暴露给原生（window.MDBridge 由 useSetupMDBridge 先行注入；App 里它在本 hook 之前调用）
     * 若缺失则告警而非静默跳过 —— 否则原生调 MDBridge.sync.ack 会拿到 undefined 难以排查
     */
    if (window.MDBridge) {
      window.MDBridge.sync = {
        flush: force => controller.flush(force),
        pushFull: () => controller.pushFull(),
        ack: version => controller.ack(version),
        requestResync: version => controller.requestResync(version),
        getBaseVersion: () => controller.getBaseVersion(),
        getClientId: () => controller.getClientId(),
        pause: () => controller.pause(),
        resume: () => controller.resume(),
      }
    }
    else {
      console.warn('[block-sync] window.MDBridge 未就绪，MDBridge.sync 未注入；contentDiff 仍会上报，但原生无法回执 ack/resync')
    }

    return () => {
      controller.destroy()
      if (window.MDBridge)
        window.MDBridge.sync = undefined
    }
    /** 仅随 editor 重建；debounceMs 在创建时读一次 */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])
}
