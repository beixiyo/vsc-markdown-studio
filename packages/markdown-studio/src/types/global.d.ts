import type { MDBridge } from './MDBridge'
import type { MDTest, MDBridgeState } from './MDBridgeTest'
import type { Webkit, Android } from './Webview'

declare global {

  declare const webkit: Webkit
  declare const Android: Android

  /** MDBridge 编辑器桥接接口 */
  declare const MDBridge: MDBridge | null

  declare const MDTest: MDTest | null

  interface Window {
    webkit: Webkit
    Android: Android

    MDBridge: MDBridge | null
    MDTest: MDTest | null
    __MDBridgeState: MDBridgeState | null
  }
}

export { }