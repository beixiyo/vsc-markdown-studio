# Changelog

## 2026-05-15

### 新增：`MDBridge.setTypography` — 动态排版调整 API

支持 Native 侧按用户偏好（如老年模式）动态调整 Webview 内的字号、行高、字重等排版属性。

#### 接口签名

```ts
MDBridge.setTypography(config: TypographyConfig): void
```

#### 类型定义

```ts
type TypographyCSSProperties = {
  fontSize?: string
  lineHeight?: string
  fontWeight?: string
  letterSpacing?: string
  fontFamily?: string
}

type TypographyConfig = Partial<Record<
  | 'heading1' | 'heading2' | 'heading3'
  | 'heading4' | 'heading5' | 'heading6'
  | 'paragraph' | 'code' | 'inlineCode'
  | 'blockquote' | 'list',
  TypographyCSSProperties
>>
```

#### 用法示例

```ts
// 大号模式（老年人友好）
MDBridge.setTypography({
  heading1: { fontSize: '22px', fontWeight: '700' },
  heading2: { fontSize: '20px', fontWeight: '700' },
  heading3: { fontSize: '19px' },
  paragraph: { fontSize: '18px', lineHeight: '2' },
  list:      { fontSize: '18px' },
  code:      { fontSize: '14px' },
  inlineCode:{ fontSize: '16px' },
  blockquote:{ fontSize: '18px' },
})

// 小号模式
MDBridge.setTypography({
  heading1:  { fontSize: '16px' },
  heading2:  { fontSize: '15px' },
  heading3:  { fontSize: '14px' },
  paragraph: { fontSize: '13px', lineHeight: '1.6' },
  list:      { fontSize: '13px' },
  code:      { fontSize: '11px' },
})

// 重置为默认排版
MDBridge.setTypography({})
```

#### 说明

- 只传需要覆盖的元素和属性，未传的保持默认值
- 传空对象 `{}` 清除所有自定义排版，恢复默认
- 可在任意时刻调用，立即生效，无需重新加载
- 实现方式：动态注入 `<style>` 标签覆盖对应 CSS 选择器

---

### 样式调整（通用，桌面端 + 移动端同步生效）

| 改动项 | 修改前 | 修改后 |
|--------|--------|--------|
| 代码块 `pre` 字体大小 | 12px | **14px** |
| 引用块 `blockquote` 背景色 | `--background2` | **transparent** |
| 任务列表 checkbox 背景色 | `--background3` | **transparent** |
| 任务列表 checkbox 边框色 | `--border2` | **--border3** |
| 任务列表 checkbox 垂直对齐 | 固定 `padding-top: 0.25rem` | **`calc((1.75em - 18px) / 2)`**，自适应字号 |

### 移动端字号对齐既有规范

移动端 Webview 的默认字号已对齐既有移动端排版规范（覆盖写在移动端本地样式中，不影响桌面端）：

| 元素 | 修改前 | 修改后 |
|------|--------|--------|
| 段落 `p` | 14px | **16.5px** |
| `h1` | 17px | **18px** |
| `h2` | 16px | **18px** |
| `h3` | 16px | **17px** |
