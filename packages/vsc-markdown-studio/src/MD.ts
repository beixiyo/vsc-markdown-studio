import type { ToExtensionMessage, ToWebviewMessage } from 'config'
import * as vscode from 'vscode'

export class MarkdownEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = 'markdown-studio.editor'

  constructor(
    private readonly context: vscode.ExtensionContext,
  ) { }

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken,
  ): Promise<void> {
    await this.loadWebview(webviewPanel)

    const postMessage = (message: ToWebviewMessage) => {
      webviewPanel.webview.postMessage(message)
    }

    const disposables: vscode.Disposable[] = []

    // Handle messages from the webview
    webviewPanel.webview.onDidReceiveMessage((message: ToExtensionMessage) => {
      switch (message.type) {
        case 'ready':
          postMessage({ type: 'init', content: document.getText() })
          return
        case 'change':
          this.handleDocumentChange(document, message.content)
          return
      }
    }, null, disposables)

    // Handle file changes on disk
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        postMessage({ type: 'update', content: e.document.getText() })
      }
    })

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose()
      disposables.forEach(d => d.dispose())
    })
  }

  private handleDocumentChange(document: vscode.TextDocument, newContent: string) {
    const edit = new vscode.WorkspaceEdit()
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      newContent,
    )
    vscode.workspace.applyEdit(edit)
  }

  private async loadWebview(webviewPanel: vscode.WebviewPanel) {
    const webviewRootUri = vscode.Uri.joinPath(this.context.extensionUri, 'webview')
    const indexPath = vscode.Uri.joinPath(webviewRootUri, 'index.html')

    const { webview } = webviewPanel
    const baseUri = webview.asWebviewUri(webviewRootUri)

    const contentBytes = await vscode.workspace.fs.readFile(indexPath)
    let html = Buffer.from(contentBytes).toString('utf8')

    // Inject a <base> tag to handle relative paths
    html = html.replace(
      '<head>',
      `<head>
    <base href="${baseUri}/">`,
    )

    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [webviewRootUri],
    }
    webviewPanel.webview.html = html
  }
}
