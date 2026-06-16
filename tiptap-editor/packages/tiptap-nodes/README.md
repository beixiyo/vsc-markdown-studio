# tiptap-nodes

自定义内容节点：代码块（语法高亮）、图片、渐变高亮、说话人、上下文引用

## 导出

| 子路径 | 导出 | 文档 |
|------|------|------|
| `./code-block` | `CodeBlock` 带语法高亮的代码块（lowlight） | [README](./src/code-block/README.md) |
| `./image` | `ImageNode` 自定义图片节点 | [README](./src/image/README.md) |
| `./image-upload` | `ImageUploadNode` 上传占位节点 | [README](./src/image-upload/README.md) |
| `./gradient-highlight` | `GradientHighlight` 多色渐变高亮 mark | [README](./src/gradient-highlight/README.md) |
| `./speaker` | `SpeakerNode` 说话人标注节点 | [README](./src/speaker/README.md) |
| `./ctx-ref` | `CtxRefNode` 上下文引用标记 | [README](./src/ctx-ref/README.md) |

## 序列化支持矩阵

| 扩展 | JSON | HTML | Markdown | Markdown 协议 |
|------|------|------|----------|---------------|
| CodeBlock | ✅ | ✅ | ✅ | ` ```lang ` 围栏 |
| ImageNode | ✅ | ✅ | ✅ | `![alt](src)`，富属性降级 `<img ... />` |
| ImageUploadNode | ✅ | ✅ | ❌ | 临时占位，导出忽略 |
| GradientHighlight | ✅ | ✅ | ✅ | `==text==`，带色降级 `<mark data-color>` |
| SpeakerNode | ✅ | ✅ | ✅ | `[speaker:label]` |
| CtxRefNode | ✅ | ✅ | ✅ | `<!--ctx-ref:type:id-->` 注释 |

image / gradient-highlight / speaker / ctx-ref 的 markdown 通道有多轮往返幂等测试（各扩展 `__tests__/markdown-roundtrip.test.ts`）

共享工具：`src/markdown-utils.ts` 的 `escapeHtmlAttr`（富属性降级 HTML 时的属性转义）

## 依赖

`tiptap-comps` `tiptap-utils` `highlight.js` `lowlight`
