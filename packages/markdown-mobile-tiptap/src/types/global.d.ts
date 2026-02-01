import type { MDBridge } from './MDBridge'
import type { Webkit, Android } from './Webview'

declare global {
  declare const webkit: Webkit
  declare const Android: Android

  /** MDBridge 编辑器桥接接口 */
  declare const MDBridge: MDBridge

  interface Window {
    webkit: Webkit
    Android: Android
    MDBridge: MDBridge
  }
}

export {}
