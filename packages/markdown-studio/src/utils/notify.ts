/**
 * 通知原生侧
 * @param event 事件名
 * @param payload 事件数据
 */
export function notifyNative(event: NativeEvent, payload?: any) {
  if (window.webkit?.messageHandlers?.[event]) {
    window.webkit.messageHandlers[event].postMessage(payload) // iOS
  }
  else if (window.Android?.postMessage) {
    window.Android.postMessage(JSON.stringify({ name: event, payload })) // Android
  }
  else {
    // console.log('[native-mock]', event, payload) // 浏览器调试
  }
}

export type NativeEvent =
  | 'blockTypeChanged'
  | 'contentChanged'
  | 'heightChanged'
  | 'milkdownReady'
  | 'labelClicked'
