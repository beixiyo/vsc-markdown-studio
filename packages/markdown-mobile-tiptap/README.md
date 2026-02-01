# markdown-mobile-tiptap

基于 **Tiptap** + **tiptap-api** 的移动端 Webview Markdown 编辑器，与 [packages/markdown-mobile](packages/markdown-mobile) 的 **MDBridge** 及原生通信契约兼容。不修改现有 markdown-mobile，作为独立包供移动端 Webview 选用。

## 使用

- 在仓库根目录执行 `pnpm install` 后，在本包目录执行 `pnpm dev` 或 `pnpm build`。
- 与原生约定：挂载后 `window.MDBridge` 可用，并触发 `notifyNative('mdBridgeReady')`；事件 `contentChanged`、`blockTypeChanged`、`heightChanged`、`speakerTapped`、`labelClicked` 与 markdown-mobile 一致。

## 缺少的实现

见 [MISSING_IMPLEMENTATIONS.md](./MISSING_IMPLEMENTATIONS.md)：API 差异、待补齐能力（如 setSpeakers/setContentWithSpeakers、command.setGradient/unsetGradient、getMarkdownWithEmptyLines）、风险与优先级，便于按项实现或排期。

## 依赖

- tiptap-api、tiptap-editor-core、tiptap-nodes（workspace）
- notify、hooks、styles、i18n（workspace）
- @tiptap/core、@tiptap/react、@tiptap/markdown、@tiptap/starter-kit 等
