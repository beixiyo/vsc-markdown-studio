# Speaker 接口迁移指南

# 原版狗屎设计说明

看了你修改后的文档和代码实现，我发现这个设计确实**有点混乱和冗余**。让我直说：

## 实际情况分析

### 1. **`originalLabel` - 唯一真正必需的匹配字段**
```typescript
// 这是唯一用于 Markdown 解析的字段
const speaker = speakers.find(s => s.originalLabel === originalLabel);
```
- ✅ **必需**：用于从 `[speaker:101]` 匹配到对应的 Speaker
- ✅ **有意义**：没有它就无法解析 Markdown

### 2. **`name` - 显示名称**
```typescript
{props.inlineContent.props.name}  // 渲染显示
```
- ✅ **必需**：用户看到的内容
- ✅ **有意义**：显示 "Joey"、"Alice" 等

### 3. **`label` - 存疑字段** ⚠️
```typescript
// 只在点击回调时传递，其他地方不用
const speakerData = {
  label: speaker.label,  // 仅此而已
  // ...
};
```
- ❓ **作用有限**：只在点击时传给 iOS
- ❓ **冗余性高**：99% 的情况下 `label === originalLabel`
- ❓ **设计问题**：为什么需要两个几乎相同的字段？

### 4. **`id` - 可选的业务字段**
```typescript
id: speaker.id || 0,  // 可选，默认 0
```
- ⚠️ **可选**：不影响核心功能
- ✅ **有场景意义**：如果后端需要真实用户 ID

## 设计问题总结

### 当前设计的混乱之处：

```typescript
// 场景 1：大部分情况（冗余）
{ 
  label: 1,          // ← 这个
  originalLabel: 1,  // ← 和这个有什么区别？
  id: 1,             // ← 还有这个
  name: 'Joey' 
}

// 场景 2：少数情况
{ 
  label: 1,          // 显示顺序？
  originalLabel: 101,// Markdown 匹配
  id: 10086,         // 业务 ID
  name: 'Joey' 
}
```

### 我的判断：

| 字段 | 实际价值 | 建议 |
|------|---------|------|
| `originalLabel` | ⭐⭐⭐⭐⭐ 必需 | 保留 - 核心匹配字段 |
| `name` | ⭐⭐⭐⭐⭐ 必需 | 保留 - 用户可见内容 |
| `label` | ⭐⭐ 低价值 | **可删除** - 与 originalLabel 冗余 |
| `id` | ⭐⭐⭐ 有用但可选 | 保留 - 业务需求 |

## 合理的简化设计应该是：

```typescript
interface SpeakerType {
  /**
   * Markdown 匹配标识
   * 用于匹配 [speaker:X] 标签
   */
  originalLabel: number;
  
  /**
   * 显示名称
   */
  name: string;
  
  /**
   * 业务唯一标识（可选）
   * 用于后端用户识别
   */
  id?: number;
}
```

## 为什么会有 `label` 这个字段？

我推测可能的原因：
1. **历史遗留**：早期设计时想要"显示序号"和"匹配ID"分离，但实际使用中发现没必要
2. **过度设计**：想支持"重新排序"但实际上从未使用这个能力
3. **iOS 回调需求**：可能 iOS 端曾经需要这个字段，但现在已经不重要了

## 结论

**`label` 字段基本没有存在的意义**，它只是 `originalLabel` 的影子。如果是新项目，我建议直接删掉它。但由于这是旧版接口的迁移文档，只能保持现状并说明清楚。

要我在文档中加上这个"吐槽"吗？😅

---


## 旧版接口定义

### Speaker 数据字段详细说明

| 字段 | 类型 | 必填 | 用途说明 |
|------|------|------|----------|
| `originalLabel` | `number` | ✅ 是 | **Markdown 匹配标识**<br>用于匹配 Markdown 中的 `[speaker:X]` 标签<br>代码通过正则 `/\[speaker:(\d+)\]/g` 提取数字，然后查找 `originalLabel` 相等的 Speaker |
| `name` | `string` | ✅ 是 | **显示名称**<br>Speaker 在编辑器中实际渲染的文本内容<br>例如：`Joey`、`Alice`<br>渲染为粗体黑色文本，可点击 |
| `label` | `number` | ✅ 是 | **显示序号**<br>Speaker 在列表中的排序序号<br>点击 Speaker 时会通过 iOS 回调传递此字段<br>通常与 `originalLabel` 相同，但可以不同 |
| `id` | `number` | ⚠️ 选填 | **业务唯一标识**<br>Speaker 在业务系统中的真实 ID<br>点击 Speaker 时会通过 iOS 回调传递此字段<br>可用于业务逻辑中的用户识别 |

```ts
interface SpeakerType {
  /**
   * 显示序号
   * Speaker 在列表中的排序序号
   * 点击 Speaker 时会通过 iOS 回调传递此字段
   * 通常与 originalLabel 相同，但可以不同
   */
  label: number;
  /**
   * Markdown 匹配标识
   * 用于匹配 Markdown 中的 [speaker:X] 标签
   * 代码通过正则 /\[speaker:(\d+)\]/g 提取数字，然后查找 originalLabel 相等的 Speaker
   */
  originalLabel: number;
  /**
   * 业务唯一标识
   * Speaker 在业务系统中的真实 ID
   * 点击 Speaker 时会通过 iOS 回调传递此字段
   * 可用于业务逻辑中的用户识别
   */
  id?: number;
  /**
   * 显示名称
   * Speaker 在编辑器中实际渲染的文本内容
   * 例如：Joey、Alice
   * 渲染为粗体黑色文本，可点击
   */
  name: string;
}
```

### 旧版接口

```ts
window.MilkdownBridge?.setSpeakers(speakers: SpeakerType[])
window.MilkdownBridge?.setContentWithSpeakers(data: { content: string; speakers: SpeakerType[] })
window.MilkdownBridge?.setContentWithSpeakersBase64(base64Data: string)
```

---

## 旧版调用方式

### 1. 仅设置 Speaker 列表

```ts
const speakers: SpeakerType[] = [
  { label: 1, originalLabel: 1, id: 1, name: 'Joey' },
  { label: 2, originalLabel: 2, id: 2, name: 'Alice' },
  { label: 3, originalLabel: 3, id: 3, name: 'Bob' },
  { label: 4, originalLabel: 4, id: 4, name: 'Charlie' }
];

window.MilkdownBridge?.setSpeakers(speakers);
```

### 2. 同时设置内容和 Speaker 列表

```ts
const data = {
  content: "# 对话示例\n\n[speaker:1]: 你好，今天天气不错！\n[speaker:2]: 是啊，很适合出去走走。",
  speakers: [
    { label: 1, originalLabel: 1, id: 1, name: 'Joey' },
    { label: 2, originalLabel: 2, id: 2, name: 'Alice' }
  ]
};

window.MilkdownBridge?.setContentWithSpeakers(data);
```

### 3. 使用 Base64 编码设置内容和 Speaker 列表

```ts
// 数据结构
const data = {
  content: "# 对话示例\n\n[speaker:1]: 你好！\n[speaker:2]: 你好啊！",
  speakers: [
    { label: 1, originalLabel: 1, id: 1, name: 'Joey' },
    { label: 2, originalLabel: 2, id: 2, name: 'Alice' }
  ]
};

// 转换为 Base64
const jsonString = JSON.stringify(data);
const base64Data = btoa(unescape(encodeURIComponent(jsonString)));

window.MilkdownBridge?.setContentWithSpeakersBase64(base64Data);
```

---

## 旧版 Markdown 字符串格式

### Speaker 标签格式

旧版使用 `[speaker:{label}]` 格式来标记说话人：

```markdown
# 对话示例

[speaker:1]: 你好，今天天气不错！
[speaker:2]: 是啊，很适合出去走走。
[speaker:1]: 要不要一起去公园？
[speaker:2]: 好啊，几点出发？
```

### 正则提取规则

旧版使用以下正则表达式从字符串中提取 Speaker 标签：

```ts
const speakerTagRegex = /\[speaker:(\d+)\]/g;
```

匹配示例：
- `[speaker:1]` → 提取 originalLabel 为 `1`
- `[speaker:2]` → 提取 originalLabel 为 `2`
- `[speaker:123]` → 提取 originalLabel 为 `123`

#### 字段关系与处理流程

```typescript
// 1. Markdown 解析阶段（card-markdown-editor.tsx: 106-120 行）
const text = "[speaker:101]: 你好！";
const speakerTagRegex = /\[speaker:(\d+)\]/g;
const match = speakerTagRegex.exec(text);
const originalLabel = parseInt(match[1]); // 提取到 101

// 2. 查找匹配的 Speaker（card-markdown-editor.tsx: 118 行）
const speaker = speakers.find(s => s.originalLabel === originalLabel);
// 通过 originalLabel 匹配，找到对应的 Speaker 对象

// 3. 创建 Speaker 组件（card-markdown-editor.tsx: 136-144 行）
{
  type: 'speaker',
  props: {
    id: speaker.id || 0,           // 业务 ID，可选
    name: speaker.name,            // 显示名称，必填
    label: speaker.label,          // 显示序号，必填
    originalLabel: speaker.originalLabel  // 原始标签号，必填
  }
}

// 4. 渲染显示（Speaker.tsx: 45-77 行）
<span onClick={...}>
  {props.inlineContent.props.name}  // 渲染 name 字段
</span>

// 5. 点击回调（Speaker.tsx: 56-73 行）
const speakerData = {
  label: speaker.label,              // 显示序号
  originalLabel: speaker.originalLabel,  // 原始标签号
  id: speaker.id,                    // 业务 ID
  name: speaker.name,                // 显示名称
  speakerName: `@${speaker.name}`    // 格式化名称
};
// 通过 iOS 的 webkit.messageHandlers.speakerTapped 传递给 App
```

#### 典型使用场景

**场景 1：简单场景（label = originalLabel = id）**
```typescript
// 所有 ID 保持一致，最简单直观
{ label: 1, originalLabel: 1, id: 1, name: 'Joey' }
```

**场景 2：服务器 ID 与显示序号分离**
```typescript
// originalLabel 使用服务器返回的真实 ID
// label 用于显示时的排序
{ label: 1, originalLabel: 10086, id: 10086, name: 'Joey' }
// Markdown 中使用: [speaker:10086]
```

**场景 3：临时 Speaker（无业务 ID）**
```typescript
// id 为可选字段，临时用户可以不提供
{ label: 1, originalLabel: 1, name: '匿名用户' }
```

---

## 完整示例

### 示例 1：简单对话

```ts
// Speaker 列表
const speakers: SpeakerType[] = [
  { label: 1, originalLabel: 1, id: 101, name: 'Joey' },
  { label: 2, originalLabel: 2, id: 102, name: 'Alice' }
];

// Markdown 内容
const content = `# 今日对话

[speaker:1]: 早上好！
[speaker:2]: 早上好，Joey！
[speaker:1]: 今天有什么计划吗？
[speaker:2]: 打算去图书馆学习。
`;

// 调用方式
window.MilkdownBridge?.setContentWithSpeakers({ content, speakers });
```

### 示例 2：多人对话

```ts
// Speaker 列表
const speakers: SpeakerType[] = [
  { label: 1, originalLabel: 1, id: 1, name: 'Joey' },
  { label: 2, originalLabel: 2, id: 2, name: 'Alice' },
  { label: 3, originalLabel: 3, id: 3, name: 'Bob' },
  { label: 4, originalLabel: 4, id: 4, name: 'Charlie' }
];

// Markdown 内容
const content = `# 项目讨论会

[speaker:1]: 大家好，今天我们讨论新项目的设计方案。
[speaker:2]: 我已经准备好设计稿了。
[speaker:3]: UI 方面我有一些建议。
[speaker:4]: 技术实现上我们需要考虑性能问题。
[speaker:1]: 很好，我们一个一个来讨论。
`;

// 调用方式
window.MilkdownBridge?.setContentWithSpeakers({ content, speakers });
```

### 示例 3：label 和 originalLabel 不同

```ts
// 场景：originalLabel 是服务器返回的 ID，label 是显示顺序
const speakers: SpeakerType[] = [
  { label: 1, originalLabel: 101, id: 101, name: 'Joey' },
  { label: 2, originalLabel: 205, id: 205, name: 'Alice' },
  { label: 3, originalLabel: 89, id: 89, name: 'Bob' }
];

// Markdown 使用 originalLabel
const content = `# 对话

[speaker:101]: 我是第一个说话的。
[speaker:205]: 我是第二个。
[speaker:89]: 我是第三个。
`;

window.MilkdownBridge?.setContentWithSpeakers({ content, speakers });
```
