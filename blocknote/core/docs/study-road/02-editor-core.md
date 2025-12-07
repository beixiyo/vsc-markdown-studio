# BlockNote Core 学习路线 - 编辑器核心

## 📚 目录

1. [BlockNoteEditor 主类](#1-blocknoteeditor-主类)
2. [管理器系统（Managers）](#2-管理器系统managers)

---

## 1. BlockNoteEditor 主类

### 1.1 BlockNoteEditor 主类

**核心文件：** [`../../src/editor/BlockNoteEditor.ts`](../../src/editor/BlockNoteEditor.ts)

这是整个编辑器的核心类，建议按以下顺序学习：

#### 1.1.1 类定义和构造函数

- **类定义**：[第 337-343 行](../../src/editor/BlockNoteEditor.ts#L337)
- **构造函数**：[第 424-606 行](../../src/editor/BlockNoteEditor.ts#L424)
  - 模式初始化（[第 430-578 行](../../src/editor/BlockNoteEditor.ts#L430)）
  - 管理器初始化（[第 597-604 行](../../src/editor/BlockNoteEditor.ts#L597)）

#### 1.1.2 核心属性

- **pmSchema**：底层 Prosemirror 模式（[第 347 行](../../src/editor/BlockNoteEditor.ts#L347)）
- **schema**：BlockNote 模式（[第 374 行](../../src/editor/BlockNoteEditor.ts#L374)）
- **blockCache**：块缓存系统（[第 364 行](../../src/editor/BlockNoteEditor.ts#L364)）
- **dictionary**：国际化字典（[第 369 行](../../src/editor/BlockNoteEditor.ts#L369)）

#### 1.1.3 核心方法

- **transact**：事务执行（[第 674-684 行](../../src/editor/BlockNoteEditor.ts#L674)）- ⭐ 重要
- **exec/canExec**：命令执行（[第 636-654 行](../../src/editor/BlockNoteEditor.ts#L636)）
- **mount/unmount**：编辑器挂载（[第 712-721 行](../../src/editor/BlockNoteEditor.ts#L712)）
- **focus/blur**：焦点管理（[第 761-776 行](../../src/editor/BlockNoteEditor.ts#L761)）

---

## 2. 管理器系统（Managers）

管理器是编辑器的功能模块，每个管理器负责特定功能：

### 2.1 BlockManager - 块管理

**文件：** [`../../src/editor/managers/BlockManager.ts`](../../src/editor/managers/BlockManager.ts)

核心方法：
- **document**：获取所有顶级块（[第 47-51 行](../../src/editor/managers/BlockManager.ts#L47)）
- **getBlock**：获取单个块（[第 60-64 行](../../src/editor/managers/BlockManager.ts#L60)）
- **insertBlocks**：插入块（[第 149-165 行](../../src/editor/managers/BlockManager.ts#L149)）
- **updateBlock**：更新块（[第 167-175 行](../../src/editor/managers/BlockManager.ts#L167)）
- **replaceBlocks**：替换块（[第 177-185 行](../../src/editor/managers/BlockManager.ts#L177)）
- **removeBlocks**：删除块（[第 187-195 行](../../src/editor/managers/BlockManager.ts#L187)）
- **moveBlocksUp/Down**：移动块（[第 197-210 行](../../src/editor/managers/BlockManager.ts#L197)）
- **nestBlock/unnestBlock**：嵌套/取消嵌套（[第 212-230 行](../../src/editor/managers/BlockManager.ts#L212)）

### 2.2 StyleManager - 样式管理

**文件：** [`../../src/editor/managers/StyleManager.ts`](../../src/editor/managers/StyleManager.ts)

核心方法：
- **getActiveStyles**：获取当前激活的样式（[第 55-84 行](../../src/editor/managers/StyleManager.ts#L55)）
- **addStyles**：添加样式（[第 90-106 行](../../src/editor/managers/StyleManager.ts#L90)）
- **removeStyles**：移除样式（[第 112-116 行](../../src/editor/managers/StyleManager.ts#L112)）
- **toggleStyles**：切换样式（[第 122-138 行](../../src/editor/managers/StyleManager.ts#L122)）
- **insertInlineContent**：插入内联内容（[第 31-50 行](../../src/editor/managers/StyleManager.ts#L31)）
- **createLink**：创建链接（[第 163-181 行](../../src/editor/managers/StyleManager.ts#L163)）

### 2.3 SelectionManager - 选择管理

**文件：** [`../../src/editor/managers/SelectionManager.ts`](../../src/editor/managers/SelectionManager.ts)

管理编辑器的选择状态和光标位置。

### 2.4 ExtensionManager - 扩展管理

**文件：** [`../../src/editor/managers/ExtensionManager/index.ts`](../../src/editor/managers/ExtensionManager/index.ts)

- **registerExtension**：注册扩展（[第 120-172 行](../../src/editor/managers/ExtensionManager/index.ts#L120)）
- **unregisterExtension**：卸载扩展
- **getExtension**：获取扩展
- **addExtension**：内部添加扩展（[第 179-207 行](../../src/editor/managers/ExtensionManager/index.ts#L179)）

**默认扩展配置：** [`../../src/editor/managers/ExtensionManager/extensions.ts`](../../src/editor/managers/ExtensionManager/extensions.ts)
- **getDefaultExtensions**：获取默认扩展（[第 174-214 行](../../src/editor/managers/ExtensionManager/extensions.ts#L174)）
- **getDefaultTiptapExtensions**：获取默认 Tiptap 扩展（[第 62-172 行](../../src/editor/managers/ExtensionManager/extensions.ts#L62)）

### 2.5 StateManager - 状态管理

**文件：** [`../../src/editor/managers/StateManager.ts`](../../src/editor/managers/StateManager.ts)

管理 Prosemirror 状态和事务。

### 2.6 ExportManager - 导出管理

**文件：** [`../../src/editor/managers/ExportManager.ts`](../../src/editor/managers/ExportManager.ts)

处理 HTML、Markdown 等格式的导出。