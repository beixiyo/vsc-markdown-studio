import type { createMarkdownOperate } from 'markdown-operate'

/**
 * 暴露给 webview 的编辑器桥接接口
 * 仅包含 markdown-operate 实现的方法
 */
export type MDBridge = ReturnType<typeof createMarkdownOperate>


