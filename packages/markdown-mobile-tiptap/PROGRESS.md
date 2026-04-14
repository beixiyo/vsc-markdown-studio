# markdown-mobile-tiptap 进度跟踪

> 本文档是唯一**进度事实源**。每完成一步即更新这里。

## 背景

把 `packages/markdown-mobile`（基于 BlockNote）迁移到原生 Tiptap（ProseMirror），复用仓库内的 `tiptap-editor-core` 与 `tiptap-nodes`。迁移目的：摆脱 BlockNote 约束，回到手写 ProseMirror 扩展，后续可自由定制。

Native WebView 通过 `window.MDBridge` 调 JS；Web 通过 `notify` 包的 `notifyNative` 回调 Native。迁移**不动 `notify`**。

## 当前状态：Phase 4 完成 ✅

- ✅ Phase 0 — 调研老版代码，整理 Native 事件清单与 API 清单
- ✅ Phase 1 — 写入迁移计划（[PLAN.md](PLAN.md)），标明可实现 / 搁置
- ✅ Phase 2 — 包骨架
- ✅ Phase 3 — 核心实现（`operate` / `hooks` / `App`）
- ✅ Phase 4 — 单元测试通过（17 / 17）
- ⏳ Phase 5 — 后续（见下文"待决策"）

## 产出清单

| 文件 | 作用 |
|------|------|
| `PLAN.md` | 迁移方案，枚举可实现 / 可实现需重定义 / 搁置 |
| `PROGRESS.md` | 本文件 |
| `package.json` / `tsconfig.*` / `vite.config.ts` / `vitest.config.ts` / `index.html` | 工程骨架 |
| `src/main.tsx` / `src/App.tsx` | React 入口，挂 Tiptap 编辑器 + Speaker 节点（onClick 发 `speakerTapped`） |
| `src/types/MDBridge.ts` | Native 可见的桥接接口 |
| `src/types/global.d.ts` | `window.MDBridge` 全局声明 |
| `src/operate/create.ts` | `createTiptapOperate(editor)`：HTML/Markdown/选区/链接/历史/命令 |
| `src/operate/image.ts` | 顶部 / 底部 / 光标插入图片，复刻旧版"连续图片块识别与替换"语义 |
| `src/hooks/useSetupMDBridge.ts` | 注入 `window.MDBridge` + 派发 `mdBridgeReady` |
| `src/hooks/useNotify.ts` | `contentChanged` / `blockTypeChanged` / `heightChanged` |
| `src/__tests__/*.test.ts` | 17 个单元测试，全部通过 |

## 已完成的能力

- `getHTML / setHTML / getMarkdown / setMarkdown`（markdown 降级到 HTML，若无 `@tiptap/markdown` storage）
- `getSelectedText / insertText / createLink / getSelectedLinkUrl`
- `focus / isEditable / setEditable / isEmpty / undo / redo`
- `canNestBlock / nestBlock / canUnnestBlock / unnestBlock`（仅 list/task item）
- `getActiveStyles`（bold/italic/underline/strike/code/highlight/sub/sup/link）
- `command.setHeading(1|2|3) / setParagraph / setOrderedList / setUnorderedList / setCheckList`
- `command.setBold/unsetBold/toggleBold` 等 mark 切换
- `resolveBlockTypeString` → 映射到 Native 约定：`h1/h2/h3/paragraph/blockquote/code/unordered_list/ordered_list/check_list`
- 图片顶部 / 底部 / 光标插入，含"连续图片块识别 + 空段落清理"
- Native 事件：`mdBridgeReady / contentChanged / blockTypeChanged / heightChanged / speakerTapped / imagesSet / imagesWithURLSet / headerImagesWithURLSet` + 对应错误事件
- `setSpeakers / setContentWithSpeakers`（基于 `tiptap-nodes/speaker` 的 `speakerMap` 配置）

## 待决策 / 搁置

| 项 | 原因 | 决定人 |
|---|---|---|
| Block id 语义的 `insertBlocks / updateBlock / removeBlocks / replaceBlocks` | Tiptap 无稳定 block id。是否引入 `UniqueID` 扩展？| 产品 / 使用方 |
| 渐变样式（`setGradient / unsetGradient`） | 需新写 Tiptap Mark 扩展 | 产品 |
| `moveBlocksUp / moveBlocksDown` | Tiptap 无内置；需自定义命令 | 产品 |
| 多空行保留的 markdown 序列化 | `@tiptap/markdown` 会合并空行 | 使用方 |
| `setContentWithSpeakers` 的原子性 | 目前按"setMarkdown + setSpeakerMap"分步执行 | 使用方 |
| Native 是否仍需 `getDocument()` 返回 block 结构 | 当前仅返回 ProseMirror JSON | Native 侧 |

## 如何运行

```bash
# 在仓库根执行
pnpm install

# 开发
cd packages/markdown-mobile-tiptap
pnpm dev   # http://localhost:5181

# 测试
pnpm test  # 17 / 17 通过
```

## 变更日志

- 2026-04-14 创建包骨架；实现核心 operate / hooks / App；17 单元测试通过
