/**
 * 通用原生通知工具
 *
 * - 支持 iOS `window.webkit.messageHandlers[<event>].postMessage`
 * - 支持 Android `window.Android.postMessage(JSON.stringify({ name, payload }))`
 * - 在浏览器环境静默忽略
 */

import type { NativeEvent } from './types'

/**
 * 通知原生侧
 * @param event 事件名
 * @param payload 事件数据
 */
export function notifyNative(event: NativeEvent, payload?: any) {
  if (window.webkit?.messageHandlers?.[event]) {
    window.webkit.messageHandlers[event].postMessage(payload)
  }
  else if (window.Android?.postMessage) {
    window.Android.postMessage(JSON.stringify({ name: event, payload }))
  }
  else {
    /** 浏览器环境下静默忽略，必要时可在此加入调试输出 */
  }
}
