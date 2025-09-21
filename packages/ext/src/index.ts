import * as vscode from 'vscode'
import { defineExtension } from 'reactive-vscode'
import { MarkdownEditorProvider } from './MD'

const { activate, deactivate } = defineExtension(async (context) => {
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      MarkdownEditorProvider.viewType,
      new MarkdownEditorProvider(context),
    ),
  )
})

export { activate, deactivate }
