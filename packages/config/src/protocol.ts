/**
 * From extension to webview
 */
export type ToWebviewMessage =
  | {
    type: 'init'
    content: string
  }
  | {
    type: 'update'
    content: string
  }

/**
 * From webview to extension
 */
export type ToExtensionMessage =
  | {
    type: 'ready'
  }
  | {
    type: 'change'
    content: string
  }
