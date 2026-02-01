# 缺少的实现（MDBridge / Tiptap 移动端 Webview）

本包基于 Tiptap + tiptap-api 实现与 [packages/markdown-mobile](packages/markdown-mobile) 相同的 MDBridge 与原生通信契约。以下为 API 差异、待补齐能力与风险项，便于按项实现或排期。

每条格式：**项** | **现状/差异** | **建议实现方式** | **优先级**。

---

## 1. 内容与光标/选区

| 项 | 现状/差异 | 建议实现方式 | 优先级 |
|----|-----------|--------------|--------|
| **getDocument** | BlockNote 有（返回块数组），tiptap-api 无 | 若原生依赖：用 `editor.getJSON()` 或自定义结构封装；否则不暴露 | P2 |
| **getMarkdownWithEmptyLines** | markdown-operate 独立导出；tiptap 无“保留空行”API | 在 tiptap 侧用 getEditorMarkdown 并实现保留空行逻辑，或复用 content 层；用于 contentChanged 上报 | P1 |
| **光标/选区** | BlockNote：blockId + start/end；tiptap：数字位置 from/to | MDBridge 对外只暴露取/设内容、选区文本时用 tiptap 的 from/to；若原生依赖 blockId 需做位置↔块标识映射 | P2 |
| **setContent** | BlockNote 接受块数组；tiptap 接受 Content (JSON/HTML/MD) | 对外仍用 Markdown/HTML，内部用 setEditorContent/setMarkdown/setHTML | 已对齐 |

---

## 2. 仅 BlockNote 有的能力

| 项 | 现状/差异 | 建议实现方式 | 优先级 |
|----|-----------|--------------|--------|
| **insertBlocks / updateBlock / removeBlocks / replaceBlocks** | 块级增删改，tiptap 无块 ID API | 若 MDBridge 未暴露给原生可不实现；若暴露：用 insertContent、deleteRange、节点 API 封装 | P3 |
| **addStyles / removeStyles / toggleStyles / getActiveStyles** | 通用样式（含 gradient）；tiptap-api 仅有 command 的 setBold/Italic/Underline 等 | MDBridge command.setGradient/unsetGradient 依赖；需 tiptap 侧渐变 Mark 或扩展 + 桥接层 command | P1 |
| **canNestBlock / nestBlock / canUnnestBlock / unnestBlock** | 嵌套/取消嵌套 | 移动端未用可不实现；若用：tiptap list 或自定义块结构 | P3 |
| **moveBlocksUp / moveBlocksDown** | 块上下移动 | 同上，按需用 tiptap 命令封装 | P3 |

---

## 3. MDBridge 扩展

| 项 | 现状/差异 | 建议实现方式 | 优先级 |
|----|-----------|--------------|--------|
| **setImagesWithURL** | BlockNote 块 + 插入到光标 | tiptap-nodes Image/ImageUpload + `editor.chain().insertContent(图片节点)` 在当前光标插入 | P1 |
| **setFooterImagesWithURL / setHeaderImagesWithURL** | 插入到底部/顶部块 | 文档首/尾位置（如 doc.content.size - 1 与 1）配合 insertContent 插入图片节点 | P1 |
| **setSpeakers / setContentWithSpeakers** | custom-blocknote-speaker | tiptap-nodes SpeakerNode，实现“设置说话人列表”和“内容+说话人一起设置”（解析/生成 [speaker:X] 或等价结构） | P1 |
| **command.setGradient / unsetGradient** | BlockNote addStyles/removeStyles | 在 tiptap 中新增渐变 Mark 或扩展，MDBridge.command 中调用对应 chain 命令 | P1 |

---

## 4. 通知与事件

| 项 | 现状/差异 | 建议实现方式 | 优先级 |
|----|-----------|--------------|--------|
| **contentChanged** | 用 getMarkdownWithEmptyLines 上报 Markdown | 用 tiptap getMarkdown（或带空行版本）在 editor.on('update') 时上报 | P1 |
| **blockTypeChanged** | 当前块类型：h1/h2/h3/paragraph/unordered_list 等 | 根据光标所在节点类型映射为相同字符串（heading→h1/h2/h3，list→ordered_list/unordered_list/check_list） | P1 |
| **heightChanged** | ResizeObserver 容器高度 | 保持 ResizeObserver，不变 | P1 |
| **speakerTapped** | Speaker 点击回调 | SpeakerNode.configure({ onClick }) 调用 notifyNative('speakerTapped', …) | P1 |
| **labelClicked** | 标签点击 | 若存在对应节点/标记，绑定点击并 notifyNative('labelClicked', data) | P2 |

---

## 5. 风险与取舍

| 项 | 说明 | 优先级 |
|----|------|--------|
| **块级 API** | 若原生已依赖 getDocument、blockId 选区、insertBlocks，需在 Tiptap 上做“位置↔块标识”映射或简化契约（只暴露块类型） | 决策 |
| **getMarkdownWithEmptyLines** | Tiptap Markdown 默认可能压缩空行；产品依赖空行时需在 tiptap-api 或本包内实现“保留空行”的 getMarkdown | 决策 |
| **渐变样式** | 必须保留 setGradient/unsetGradient 时，需在 tiptap 中新增渐变 Mark 或扩展并在 MDBridge.command 挂接 | 决策 |

---

## 6. 已完成

（实现完成一项即移入此处或勾选）

- 新包骨架与配置（package.json、vite、tsconfig、index.html、styles）
- MDBridge 类型定义（与 markdown-mobile 接口兼容，SpeakerType/GradientStyleType 在本包内定义）
- useSetupMDBridge 基础实现：内容/command 基于 tiptap-api createMarkdownOperate；setImagesWithURL/setFooterImagesWithURL/setHeaderImagesWithURL 已实现（insertContentAt + Image 节点）；setSpeakers/setContentWithSpeakers 为占位（见上表）；command.setGradient/unsetGradient 为占位
- useNotify 基础实现：contentChanged（getEditorMarkdown）、blockTypeChanged（节点类型映射）、heightChanged（ResizeObserver）；speakerTapped 由 SpeakerNode onClick 调用 notifyNative
