# BlockNote Core 学习路线 - 自定义插件开发

## 📚 目录

1. [Extension 系统](#1-extension-系统)
2. [扩展示例](#2-扩展示例)
3. [自定义块类型](#3-自定义块类型)
4. [自定义样式](#4-自定义样式)

---

## 1. Extension 系统

### 1.1 Extension 接口定义

**文件：** [`../../src/editor/BlockNoteExtension.ts`](../../src/editor/BlockNoteExtension.ts)

- **Extension 接口**（[第 16-92 行](../../src/editor/BlockNoteExtension.ts#L16)）
  - **key**：扩展唯一标识（[第 20 行](../../src/editor/BlockNoteExtension.ts#L20)）
  - **mount**：挂载钩子（[第 25-38 行](../../src/editor/BlockNoteExtension.ts#L25)）
  - **store**：状态存储（[第 43 行](../../src/editor/BlockNoteExtension.ts#L43)）
  - **runsBefore**：依赖声明（[第 48 行](../../src/editor/BlockNoteExtension.ts#L48)）
  - **inputRules**：输入规则（[第 54 行](../../src/editor/BlockNoteExtension.ts#L54)）
  - **keyboardShortcuts**：键盘快捷键（[第 78-81 行](../../src/editor/BlockNoteExtension.ts#L78)）
  - **prosemirrorPlugins**：Prosemirror 插件（[第 86 行](../../src/editor/BlockNoteExtension.ts#L86)）
  - **tiptapExtensions**：Tiptap 扩展（[第 91 行](../../src/editor/BlockNoteExtension.ts#L91)）

### 1.2 创建扩展

**文件：** [`../../src/editor/BlockNoteExtension.ts`](../../src/editor/BlockNoteExtension.ts)

- **createExtension**：创建扩展工厂（[第 193-229 行](../../src/editor/BlockNoteExtension.ts#L193)）
- **createStore**：创建状态存储（[第 231-236 行](../../src/editor/BlockNoteExtension.ts#L231)）

---

## 2. 扩展示例

### 2.1 SideMenu 扩展

**文件：** [`../../src/extensions/SideMenu/SideMenu.ts`](../../src/extensions/SideMenu/SideMenu.ts)

侧边菜单扩展，展示如何：
- 定义扩展
- 使用 mount 钩子
- 添加 Prosemirror 插件

### 2.2 FormattingToolbar 扩展

**文件：** [`../../src/extensions/FormattingToolbar/FormattingToolbar.ts`](../../src/extensions/FormattingToolbar/FormattingToolbar.ts)

格式化工具栏扩展。

### 2.3 SuggestionMenu 扩展

**文件：** [`../../src/extensions/SuggestionMenu/SuggestionMenu.ts`](../../src/extensions/SuggestionMenu/SuggestionMenu.ts)

建议菜单（/命令）扩展。

---

## 3. 自定义块类型

### 3.1 创建块规范

**文件：** [`../../src/schema/blocks/createSpec.ts`](../../src/schema/blocks/createSpec.ts)

使用 `createBlockSpec` 或 `createBlockSpecFromTiptapNode` 创建块规范。

### 3.2 块实现示例

参考默认块实现：
- [`../../src/blocks/Paragraph/block.ts`](../../src/blocks/Paragraph/block.ts)
- [`../../src/blocks/Heading/block.ts`](../../src/blocks/Heading/block.ts)
- [`../../src/blocks/Code/block.ts`](../../src/blocks/Code/block.ts)

每个块需要实现：
- **render**：渲染到 DOM
- **toExternalHTML**：导出 HTML（可选）
- **parse**：从 HTML 解析（可选）

---

## 4. 自定义样式

参考：[`../../src/blocks/defaultBlocks.ts`](../../src/blocks/defaultBlocks.ts#L62)（第 62-142 行）

使用 `createStyleSpec` 创建自定义样式。