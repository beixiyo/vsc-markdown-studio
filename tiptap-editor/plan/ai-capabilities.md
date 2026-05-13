# AI 编辑器能力补全

## 背景
当前 tiptap-ai 只支持「选区替换」模式。需要补全三个能力：光标插入、上下文传递、结构化输出。

## Todo

- [x] **Step 1 — 类型扩展**：`SelectionPayload` 支持无选区 payload + `ContentContext` 上下文 + `NormalizedResponse.format`
- [x] **Step 2 — AIOrchestrator 适配**：normalize/mergePreview 透传 format 字段
- [x] **Step 3 — TiptapEditorBridge 改造**：insert 模式渲染 + 结构化输出解析 + `getTiptapCursorPayload`
- [x] **Step 4 — EditorIntegration**：无需改动，状态订阅层与操作模式无关
- [x] **Step 5 — React 层**：`useAI` 支持 `allowInsert` + `getContext`，自动降级到 cursor payload
- [x] **Step 6 — Mock 适配器**：新增 `createMockInsertAdapter` + `createMockMarkdownAdapter`
- [x] **Step 7 — Playground 集成测试**：AI Insert / AI HTML 按钮，上下文 console.log
- [x] **Step 8 — README**：tiptap-ai 目录添加功能说明

## 进度
- 计划创建：2026-05-13
- 全部完成：2026-05-13
