import { useEffect } from 'react'

const vscode = typeof acquireVsCodeApi === 'function'
  ? acquireVsCodeApi()
  : {
      postMessage: () => { },
      getState: () => { },
      setState: () => { },
    }

let lastContent = ''

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
            window.MDBridge?.setMarkdown(message.content)
            lastContent = message.content
          }
          break
      }
    }

    window.addEventListener('message', handleMessage)

    window.MDBridge?.onChange(() => {
      const newContent = window.MDBridge?.getMarkdown() || ''
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
