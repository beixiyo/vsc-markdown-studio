/** IOS 通信对象，用于与原生侧通信 */
export interface Webkit {
  messageHandlers: {
    [key: string]: {
      postMessage: (content: any) => void
    }
  }
}

/** Android 通信对象，用于与原生侧通信 */
export interface Android {
  postMessage: (content: any) => void
}
