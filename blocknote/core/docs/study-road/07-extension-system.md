# BlockNote Core 学习路线 - 扩展系统

## 📚 目录

1. [ExtensionManager 详解](#1-extensionmanager-详解)
2. [默认扩展](#2-默认扩展)
3. [扩展类型](#3-扩展类型)
4. [Tiptap 扩展集成](#4-tiptap-扩展集成)

---

## 1. ExtensionManager 详解

**文件：** [`../../src/editor/managers/ExtensionManager/index.ts`](../../src/editor/managers/ExtensionManager/index.ts)

- **构造函数**：初始化扩展管理器（[第 52-113 行](../../src/editor/managers/ExtensionManager/index.ts#L52)）
- **registerExtension**：注册扩展（[第 120-172 行](../../src/editor/managers/ExtensionManager/index.ts#L120)）
- **addExtension**：内部添加扩展（[第 179-207 行](../../src/editor/managers/ExtensionManager/index.ts#L179)）
- **resolveExtensions**：解析扩展依赖（[第 209 行](../../src/editor/managers/ExtensionManager/index.ts#L209)）

---

## 2. 默认扩展

**文件：** [`../../src/editor/managers/ExtensionManager/extensions.ts`](../../src/editor/managers/ExtensionManager/extensions.ts)

- **getDefaultExtensions**：获取所有默认扩展（[第 174-214 行](../../src/editor/managers/ExtensionManager/extensions.ts#L174)）
- **getDefaultTiptapExtensions**：获取默认 Tiptap 扩展（[第 62-172 行](../../src/editor/managers/ExtensionManager/extensions.ts#L62)）

---

## 3. 扩展类型

### 3.1 UI 扩展

- **SideMenu**：侧边菜单
- **FormattingToolbar**：格式化工具栏
- **SuggestionMenu**：建议菜单
- **LinkToolbar**：链接工具栏
- **FilePanel**：文件面板

### 3.2 功能扩展

- **Collaboration**：协作扩展（Yjs）
- **History**：历史记录
- **DropCursor**：拖拽光标
- **Placeholder**：占位符
- **TableHandles**：表格手柄
- **TrailingNode**：尾随节点
- **ShowSelection**：显示选择

---

## 4. Tiptap 扩展集成

**目录：** [`../../src/extensions/tiptap-extensions/`](../../src/extensions/tiptap-extensions/)

BlockNote 使用 Tiptap 作为底层编辑器，可以集成 Tiptap 扩展。