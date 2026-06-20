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
  /** setImage 成功 */
  | 'imageInserted'
  /** setImage 失败 */
  | 'imageInsertError'
  /** 用户点击图片 */
  | 'imageTapped'
  /** 图片加载成功 */
  | 'imageLoaded'
  /** 图片加载失败 */
  | 'imageLoadError'
  /** 图片被删除 */
  | 'imageRemoved'
  /** 图片属性变化（尺寸、对齐等） */
  | 'imageAttrsChanged'
  /** AI 区域编辑状态变化（idle / streaming / preview） */
  | 'aiEditStateChanged'
  /** AI 区域编辑冲突：用户编辑了预览/流式区域，会话已终止 */
  | 'aiEditConflict'
  /** 内容块级增量（BlockSyncPayload）：替代全量 contentChanged 上报，仅传变化块 */
  | 'contentDiff'

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
