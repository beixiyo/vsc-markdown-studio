# BlockNote Core 学习路线 - WYSIWYG 渲染系统

## 📚 目录

1. [块渲染机制](#1-块渲染机制)
2. [节点转换](#2-节点转换)
3. [默认块实现](#3-默认块实现)
4. [CSS 样式](#4-css-样式)

---

## 1. 块渲染机制

### 1.1 块规范（Block Spec）

**文件：** [`../../src/schema/blocks/types.ts`](../../src/schema/blocks/types.ts)

- **BlockSpec** 类型定义（[第 97-105 行](../../src/schema/blocks/types.ts#L97)）
- **BlockImplementation** 接口（[第 410-489 行](../../src/schema/blocks/types.ts#L410)）
  - **render** 方法：渲染块到 DOM（[第 422-452 行](../../src/schema/blocks/types.ts#L422)）
  - **toExternalHTML**：导出为外部 HTML（[第 458-471 行](../../src/schema/blocks/types.ts#L458)）
  - **parse**：从 HTML 解析块（[第 476 行](../../src/schema/blocks/types.ts#L476)）

### 1.2 创建块规范

**文件：** [`../../src/schema/blocks/createSpec.ts`](../../src/schema/blocks/createSpec.ts)

- **addNodeAndExtensionsToSpec**：将节点和扩展添加到规范（[第 130-262 行](../../src/schema/blocks/createSpec.ts#L130)）
  - NodeView 创建（[第 183-212 行](../../src/schema/blocks/createSpec.ts#L183)）
  - render 方法包装（[第 226-239 行](../../src/schema/blocks/createSpec.ts#L226)）
  - toExternalHTML 处理（[第 242-258 行](../../src/schema/blocks/createSpec.ts#L242)）

### 1.3 块结构包装

**文件：** [`../../src/schema/blocks/internal.ts`](../../src/schema/blocks/internal.ts)

- **wrapInBlockStructure**：包装块结构（[第 129-194 行](../../src/schema/blocks/internal.ts#L129)）
  - 创建 `blockContent` 元素（[第 149 行](../../src/schema/blocks/internal.ts#L149)）
  - 添加 HTML 属性（[第 152-175 行](../../src/schema/blocks/internal.ts#L152)）
  - 设置 `data-content-type` 属性（[第 165 行](../../src/schema/blocks/internal.ts#L165)）

---

## 2. 节点转换

### 2.1 块转节点（Block to Node）

**文件：** [`../../src/api/nodeConversions/blockToNode.ts`](../../src/api/nodeConversions/blockToNode.ts)

- **blockToNode**：将块转换为 Prosemirror 节点（[第 324 行](../../src/api/nodeConversions/blockToNode.ts#L324)）
- **styledTextToNodes**：样式文本转节点（[第 28-79 行](../../src/api/nodeConversions/blockToNode.ts#L28)）
  - 样式标记处理（[第 34-53 行](../../src/api/nodeConversions/blockToNode.ts#L34)）
  - 硬换行处理（[第 55-77 行](../../src/api/nodeConversions/blockToNode.ts#L55)）

### 2.2 节点转块（Node to Block）

**文件：** [`../../src/api/nodeConversions/nodeToBlock.ts`](../../src/api/nodeConversions/nodeToBlock.ts)

- **nodeToBlock**：将 Prosemirror 节点转换为块（[第 391 行](../../src/api/nodeConversions/nodeToBlock.ts#L391)）
- **contentNodeToInlineContent**：内容节点转内联内容（[第 141-341 行](../../src/api/nodeConversions/nodeToBlock.ts#L141)）
- **contentNodeToTableContent**：内容节点转表格内容（[第 33-136 行](../../src/api/nodeConversions/nodeToBlock.ts#L33)）

---

## 3. 默认块实现

**文件：** [`../../src/blocks/defaultBlocks.ts`](../../src/blocks/defaultBlocks.ts)

查看默认块类型的实现，例如：
- **Paragraph**：段落块
- **Heading**：标题块
- **Code**：代码块
- **Image**：图片块

每个块目录包含：
- `block.ts`：块定义和实现
- `node.ts`：Prosemirror 节点定义

**示例：段落块**
- [`../../src/blocks/Paragraph/block.ts`](../../src/blocks/Paragraph/block.ts)

---

## 4. CSS 样式

**文件：** [`../../src/editor/Block.css`](../../src/editor/Block.css)

块的基础样式定义，包括：
- `.bn-block-content`：块内容容器
- `.bn-inline-content`：内联内容容器

**文件：** [`../../src/editor/editor.css`](../../src/editor/editor.css)

编辑器整体样式。