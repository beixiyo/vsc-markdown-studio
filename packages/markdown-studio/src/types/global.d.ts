import type { MDBridge } from './MDBridge'
import type { MDTest, MDBridgeState } from './MDBridgeTest'
import type { Webkit, Android } from './Webview'

declare global {

  declare const webkit: Webkit
  declare const Android: Android

  /** MDBridge 编辑器桥接接口 */
  declare const MDBridge: MDBridge

  declare const MDTest: MDTest

  interface Window {
    webkit: Webkit
    Android: Android

    MDBridge: MDBridge
    MDTest: MDTest
    __MDBridgeState: MDBridgeState | null
  }
}

export { }