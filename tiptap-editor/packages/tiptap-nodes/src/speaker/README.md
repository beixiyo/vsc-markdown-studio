# SpeakerNode 说话人节点

音频转录场景的说话人标注，inline atom 节点，点击可编辑说话人信息

## 序列化支持

| 格式 | 支持 | 说明 |
|------|------|------|
| JSON | ✅ 无损 | attrs 完整序列化 |
| HTML | ✅ 无损 | `data-speaker-*` 属性承载 |
| Markdown | ✅ 无损 | `[speaker:label]` 协议，见下 |

### Markdown 协议

**输入**支持两种形态：

```markdown
[speaker:0] 今天我们讨论一下方案
<speaker>0</speaker> 今天我们讨论一下方案
```

**输出**统一为 `[speaker:0]`（两侧不补空格——曾因补空格导致往返不幂等，每轮 +1 空格累积成缩进代码块，见 `__tests__/markdown-roundtrip.test.ts` 的 6 轮幂等回归）

`<speaker>` 标签建议先经 `preprocessSpeakerTags(markdown)` 归一化为方括号形态再 `setContent`，确保走 tokenizer 而非 parseHTML

## Attrs

| 属性 | 说明 |
|------|------|
| `originalLabel` | 原始标签文本（如 `"0"`），markdown 往返的载体 |
| `name` | 映射后的显示名称，**优先级高于 speakerMap**（节点级数据可被 `setNodeMarkup` 实时更新） |
| `id` | 说话人唯一标识 |
| `label` | 自定义标签 |

## Options

| 选项 | 默认 | 说明 |
|------|------|------|
| `speakerMap` | `{}` | 标签 → `{ name, id?, label? }` 映射，仅作初始加载兜底（运行时改 options 无效，动态更新走 attrs） |
| `className` | — | 自定义类名 |
| `renderTag` | `'strong'` | 渲染标签 |
| `onClick` | — | `(attrs, event) => void` 点击回调 |
| `formatLabel` | — | 展示文本格式化（如索引 +1） |

## 用法

```ts
SpeakerNode.configure({
  speakerMap: { 0: { name: '主持人' } },
  onClick: attrs => openSpeakerEditor(attrs),
})
```
