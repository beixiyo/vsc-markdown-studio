import { useEffect } from 'react'

const vscode = typeof acquireVsCodeApi === 'function'
  ? acquireVsCodeApi()
  : {
      postMessage: () => { },
      getState: () => { },
      setState: () => { },
    }

let lastContent = ''
let isUpdatingFromExtension = false

/**
 * 用于处理 webview 和 VS Code 扩展之间通信的自定义 React Hook
 */
export function useVSCode() {
  useEffect(() => {
    const handleMessage = (event: MessageEvent<ToWebviewMessage>) => {
      const message = event.data
      switch (message.type) {
        case 'init':
        case 'update':
          if (message.content !== lastContent) {
            isUpdatingFromExtension = true
            MDBridge?.setMarkdown(message.content)
            lastContent = message.content
            /** 延迟重置标志，确保 onChange 回调不会触发 */
            setTimeout(() => {
              isUpdatingFromExtension = false
            }, 100)
          }
          break
      }
    }

    window.addEventListener('message', handleMessage)

    MDBridge?.onChange(() => {
      /** 如果正在从扩展更新内容，则跳过发送 change 消息 */
      if (isUpdatingFromExtension) {
        return
      }

      const newContent = MDBridge?.getMarkdown() || ''
      if (newContent !== lastContent) {
        lastContent = newContent
        vscode.postMessage({ type: 'change', content: newContent })
      }
    })

    /** 通知扩展，webview 已准备就绪 */
    vscode.postMessage({ type: 'ready' })

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])
}

/**
 * 暴露给 webview 的 VS Code API 对象。
 */
interface VsCodeApi {
  postMessage: (message: ToExtensionMessage) => void
  getState: () => any
  setState: (newState: any) => void
}

/**
 * VS Code 在 webview 环境中提供的一个全局函数，
 * 用于获取 VS Code API 的句柄。
 */
declare function acquireVsCodeApi(): VsCodeApi

// From extension to webview
export type ToWebviewMessage =
  | {
    type: 'init'
    content: string
  }
  | {
    type: 'update'
    content: string
  }

// From webview to extension
export type ToExtensionMessage =
  | {
    type: 'ready'
  }
  | {
    type: 'change'
    content: string
  }
