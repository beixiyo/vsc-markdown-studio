# tiptap-nodes

自定义内容节点：代码块（语法高亮）、图片、渐变高亮、说话人。

## 导出

| 子路径 | 导出 | 说明 |
|------|------|------|
| `./code-block` | `CodeBlock` | 带语法高亮的代码块扩展（基于 lowlight） |
| `./image` | `ImageNode` | 自定义图片节点 |
| `./image-upload` | 图片上传处理 | 上传逻辑和进度 |
| `./gradient-highlight` | `GradientHighlight` | 多色渐变高亮 mark |
| `./speaker` | Speaker 扩展 | 说话人标注节点 |

## 依赖

`tiptap-comps` `tiptap-utils` `highlight.js` `lowlight`
