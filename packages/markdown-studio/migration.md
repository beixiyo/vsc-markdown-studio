# MDBridge 迁移指南

> 从 `MilkdownBridge` 迁移到 `MDBridge`，基于 *BlockNote* 实现，提供更清晰的语义和更丰富的 *API*。

```ts
/**
 * @deprecated 旧版接口，使用 MDBridge 代替
 */
interface MilkdownBridge {
  setContent: (content: string) => void
  setSpeakers: (speakers: SpeakerType[]) => void
  setContentWithSpeakers: (data: { content: string, speakers: SpeakerType[] }) => void
  setContentWithSpeakersBase64: (base64Data: string) => void
  setImages: (images: string[]) => void
  setImagesWithURL: (imageUrls: string[]) => void
  setHeaderImagesWithURL: (imageUrls: string[]) => void
  /** 旧版简单的渐变开关，只有一种固定渐变效果 */
  setFlowing: (flowing: boolean) => void
  command: {
    setHeading: (level: 1 | 2 | 3) => void
    setParagraph: () => void
    setOrderedList: () => void
    setUnorderedList: () => void
    setBold: () => void
    setCheckList: () => void
  }
}
```

## 为什么要替换？

- **避免混淆**：历史上全局对象命名为 `MilkdownBridge`，但实际实现是 *BlockNote*，命名与实现不一致，易误导使用者。
- **语义更清晰**：内容设置从单一的 `setContent` 拆分为 `setContent`（块数组）、`setHTML`（*HTML* 字符串）、`setMarkdown`（*Markdown* 字符串）。
- **能力更完整**：新增块增删改、文本与样式、链接、光标与选区、历史、嵌套与移动等大量接口，覆盖更多编辑场景。
- **渐变样式增强**：从简单的开关式渐变升级到 11 种精美渐变（通过 `command.setGradient`），支持更多视觉效果和主题表达。

## 迁移范围总览

- **全局对象重命名**：`MilkdownBridge` → `MDBridge`
- **内容设置接口语义化**：`setContent` → 按内容类型选择 `setContent` / `setHTML` / `setMarkdown`
- **图片接口重命名与职责明确**：
  - 旧：`setImages`、`setImagesWithURL`、`setHeaderImagesWithURL`
  - 新：`setImagesWithURL`、`setFooterImagesWithURL`、`setHeaderImagesWithURL`
- **新增更多 *API***：内容、块、文本、样式、链接、光标与选区、编辑状态、历史、嵌套与移动、命令等。
- **渐变样式升级**：从简单的开关式渐变升级到 11 种精美渐变（通过 `command.setGradient`），提供更丰富的视觉效果。

---

## 快速迁移

### 1. 全局对象重命名
```ts
// 旧
MilkdownBridge?.setContent('# Hello')
// 新  
MDBridge?.setMarkdown('# Hello')
```

### 2. 内容设置按类型拆分
```ts
// Markdown 内容
MDBridge?.setMarkdown('# Hello World')

// HTML 内容  
MDBridge?.setHTML('<h1>Hello World</h1>')

// 块数组
MDBridge?.setContent([{ id: '1', type: 'paragraph', content: 'Hi' }])
```

### 3. 图片接口重命名
```ts
// 旧
MilkdownBridge?.setImages(['url1', 'url2'])
// 新
MDBridge?.setImagesWithURL(['url1', 'url2'])
MDBridge?.setHeaderImagesWithURL(['header.png'])
MDBridge?.setFooterImagesWithURL(['footer.png']) // 新增
```

### 4. 说话人接口简化
```ts
// 旧版 - 批量设置
MilkdownBridge?.setSpeakers([
  { name: '张三', content: '你好' },
  { name: '李四', content: '世界' }
])

// 新版 - 单个设置，支持修改，返回 ID
const blockId = MDBridge?.setSpeaker({ name: '张三', content: '你好' })
MDBridge?.setSpeaker({ name: '李四', content: '世界' })

// 修改现有说话人
MDBridge?.setSpeaker({ 
  blockId, 
  name: '张三', 
  content: '修改后的内容' 
})
```

### 5. 渐变样式升级
```ts
// 旧版 - 简单开关
MilkdownBridge?.setFlowing(true)

// 新版 - 11 种精美渐变
MDBridge?.command.setGradient('mysticPurpleBlue')
MDBridge?.command.setGradient('starryNight')

// 移除渐变
MDBridge?.command.unsetGradient()
```

#### 渐变样式参考

```ts
type GradientStyleType =
  | 'mysticPurpleBlue' // 神秘紫蓝 - 神秘而优雅
  | 'skyBlue' // 天空蓝 - 清新自然
  | 'gorgeousPurpleRed' // 瑰丽紫红 - 温柔浪漫
  | 'warmSunshine' // 温暖阳光 - 活力四射
  | 'naturalGreen' // 自然绿意 - 生机勃勃
  | 'mysticNight' // 神秘暗夜 - 深沉神秘
  | 'colorfulCandy' // 多彩糖果 - 活泼可爱
  | 'starryNight' // 星空夜幕 - 深邃梦幻
  | 'metallic' // 金属质感 - 现代感强
  | 'snowyGlacier' // 雪山冰川 - 纯净清冷
  | 'tropicalSummer' // 热带夏日 - 热情奔放
```

## 接口对照表

| 旧接口 | 新接口 | 说明 |
|--------|--------|------|
| `MilkdownBridge` | `MDBridge` | 全局对象重命名 |
| `setContent(markdown)` | `setMarkdown(markdown)` | Markdown 内容设置 |
| `setContent(html)` | `setHTML(html)` | HTML 内容设置 |
| `setImages(urls)` | `setImagesWithURL(urls)` | 当前位置图片 |
| `setSpeakers(speakers[])` | `setSpeaker(speaker)` | 单个说话人设置 |
| `setFlowing(boolean)` | `command.setGradient(type)` | 渐变样式控制 |

## 迁移优势

- **语义清晰**：内容设置按类型拆分，接口含义更明确
- **功能增强**：支持说话人修改、11 种渐变样式（通过 `command.setGradient`）、更多编辑操作
- **接口简化**：说话人从 3 个接口简化为 1 个，降低使用复杂度
- **职责分离**：内容和说话人设置完全解耦，符合单一职责原则