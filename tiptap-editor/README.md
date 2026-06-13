# tiptap-editor

基于 Tiptap / ProseMirror 的富文本编辑器，monorepo 架构，支持 AI 集成、评论批注、Mermaid 图表等能力。

## 包结构

```
packages/
├── tiptap-utils          ← 基础工具层（零内部依赖）
├── tiptap-api            ← 编辑器操作 API（内容、选区、hover、大纲、i18n）
├── tiptap-hover          ← Hover 探测 & 上下文高亮
├── tiptap-comps          ← UI 组件库（工具栏、浮动菜单、图标）
├── tiptap-nodes          ← 自定义节点（代码块、图片、渐变高亮）
├── tiptap-trigger        ← Slash 命令 & 建议菜单
├── tiptap-comment        ← 评论 / 批注系统
├── tiptap-mermaid        ← Mermaid 图表节点
├── tiptap-ai             ← AI 集成（替换、插入、预览、多轮对话）
└── tiptap-editor-core    ← 编辑器初始化 & 预设扩展
```

## 依赖关系

```
tiptap-utils（基础层，零依赖）
    ↑
tiptap-api（操作 API）
    ↑
┌───┴────────────────────────┐
│                            │
tiptap-hover（hover 探测）    tiptap-trigger（slash 命令）
    ↑
tiptap-comps（UI 组件）
    ↑
┌───┴───────────┬────────────┐
│               │            │
tiptap-comment  tiptap-nodes tiptap-mermaid
（评论系统）    （自定义节点）（图表）

tiptap-ai（AI 集成，独立模块）
tiptap-editor-core（编辑器初始化，引用 tiptap-hover）
```

## 各包职责

| 包 | 职责 | 关键能力 |
|------|------|------|
| **tiptap-utils** | 共享工具 | 节点遍历、平台检测、DOM 工具 |
| **tiptap-api** | 编辑器操作 | 内容读写、选区、hover 内容探测、大纲、滚动、i18n |
| **tiptap-hover** | 鼠标追踪 | 上下文高亮（Decoration）、tooltip、`useHoverDetection` |
| **tiptap-comps** | UI 组件 | SelectToolbar、BlockActionMenu、TableControls、40+ 图标 |
| **tiptap-nodes** | 内容节点 | CodeBlock（语法高亮）、ImageNode、GradientHighlight |
| **tiptap-trigger** | 命令面板 | Slash 命令触发、可搜索建议菜单 |
| **tiptap-comment** | 批注系统 | 评论 CRUD、CommentStore、行内弹窗、侧边栏 |
| **tiptap-mermaid** | 图表 | Mermaid 代码编辑 + SVG 渲染 |
| **tiptap-ai** | AI 集成 | 选区替换、光标插入、结构化输出、多轮对话、预览/接受/拒绝 |
| **tiptap-editor-core** | 初始化 | 预设扩展组合、`useDefaultEditor`、React 入口组件 |

## Playground

`src/playground/` 是演示项目，集成所有包的功能，可直接运行测试：

```bash
pnpm dev
```

## 架构指南

详见 [IMPLEMENT](./docs/IMPLEMENT.md)
