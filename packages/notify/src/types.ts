/**
 * 类型定义：对外导出的原生事件名集合
 *
 * - 与原生侧保持一致，便于调用与约束
 */
export type NativeEvent =
  | 'blockTypeChanged'
  | 'contentChanged'
  | 'heightChanged'
  | 'mdBridgeReady'
  | 'labelClicked'
  | 'speakerTapped'
  | 'imagesSet'
  | 'setImagesError'
  | 'imagesWithURLSet'
  | 'headerImagesWithURLSet'
  | 'setImagesWithURLError'
  | 'setHeaderImagesWithURLError'

/** iOS WKWebView 注入对象 */
export interface Webkit {
  messageHandlers?: Record<string, { postMessage: (payload?: any) => void }>
}

/** Android WebView 注入对象 */
export interface Android {
  postMessage?: (message: string) => void
}

declare global {
  interface Window {
    webkit: Webkit
    Android: Android
  }
}
