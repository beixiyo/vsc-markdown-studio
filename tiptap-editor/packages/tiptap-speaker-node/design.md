好的，按计划开始逐步推进。先完成 2.1（扩展设计）与 2.2（渲染/交互策略），给出可执行草案，确认后再编码。

## 2.1 扩展设计（Node + Markdown tokenizer/render）
- Node 类型：inline、atom: false；group: `inline`；可在段落内。
- attrs：`originalLabel: string`（必填，用于还原数字），`name?: string`（map 显示名），`id?: string`，`label?: string`。
- options：`speakerMap?: Record<string, { name: string; id?: string; label?: string }>`；`className?: string`（可选样式）；`renderTag?: string`（默认为 `strong`）。
- parseMarkdown：自定义 tokenizer 匹配 `[speaker:X]`；若前后无空格，在生成 token 时补空格；token.attrs.originalLabel = X（数字）；其余 attrs 留空，后续根据 map 补。
- renderMarkdown：始终输出 `[speaker:${originalLabel}]`（前后保持已有空格，不额外添加），确保 round-trip 保真。
- parseHTML：识别 `<strong data-speaker-original-label="X" ...>` 或 `<span data-speaker-original-label>`，提取 data-speaker-* 到 attrs；若无 data，回退 text 中的数字（可选）。
- renderHTML：tag = options.renderTag；content = map 命中则用 map.name，否则用 originalLabel；附带 data-speaker-original-label/name/id/label；可追加 className。
- JSON：通过 attrs 自然保留，无需额外处理。
- Commands：可选 `setSpeaker({ originalLabel, name?, id?, label? }[])` 便于程序化插入；input rule 会直接用 command。

## 2.2 渲染与交互策略
- 显示文本：优先 `speakerMap[originalLabel]?.name`，否则展示原数字。
- 空格修正：在 tokenizer 阶段处理；input rule/paste rule 也做同样修正，保证编辑体验。
- input rule：正则 `/(^|\\s)\\[speaker:(\\d+)\\]($|\\s)/`，匹配后插入节点并补空格。
- paste rule：同上，防止粘贴无空格格式。
- 样式：默认 `font-semibold`，可通过 options.className 传入。
- NodeView：暂不需要；如未来要 Hover 卡片或选择器再加。

## 2.3 导出策略（确认）
- Markdown：renderMarkdown 输出原样 `[speaker:X]`，保持输入数字。
- HTML：renderHTML 输出 data-speaker-*。
- JSON：attrs 原样保留（可序列化/再导入）。

## 3.x 集成与目录
- 代码位置：`packages/tiptap-speaker-node/src/index.ts`（核心扩展），`.../react/index.ts`（如需 React 绑定）。
- 构建：沿用包内 `vite build`。
- 编辑器注册：在 `tiptap-editor/src/components/tiptap-templates/extensions.ts` 的 defaultExtensions 中追加该扩展，传入 `speakerMap` 与 className。

## 4.x 测试要点
- Markdown → JSON → Markdown round-trip 保持 `[speaker:X]`。
- HTML 导出包含 data-speaker-original-label/name/id/label。
- JSON snapshot 含 attrs。
- 输入/粘贴无空格时自动补空格、生成节点。

请确认上述设计，如 OK，我将按计划进入编码与集成（从包内实现开始）。