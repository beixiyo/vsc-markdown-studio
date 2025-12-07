# BlockNote Core 学习路线 - 样式系统

## 📚 目录

1. [样式规范（Style Spec）](#1-样式规范style-spec)
2. [默认样式](#2-默认样式)
3. [样式应用](#3-样式应用)
4. [自定义样式](#4-自定义样式)

---

## 1. 样式规范（Style Spec）

### 1.1 样式类型定义

**文件：** [`../../src/schema/styles/types.ts`](../../src/schema/styles/types.ts)

- **StyleConfig**：样式配置（[第 8-11 行](../../src/schema/styles/types.ts#L8)）
- **StyleImplementation**：样式实现（[第 15-32 行](../../src/schema/styles/types.ts#L15)）
- **StyleSpec**：样式规范（[第 36-39 行](../../src/schema/styles/types.ts#L36)）

### 1.2 创建样式规范

**文件：** [`../../src/schema/styles/createSpec.ts`](../../src/schema/styles/createSpec.ts)

- **createStyleSpec**：创建样式规范（[第 72-140 行](../../src/schema/styles/createSpec.ts#L72)）
  - Mark 创建（[第 76 行](../../src/schema/styles/createSpec.ts#L76)）
  - parseHTML 规则（[第 83-85 行](../../src/schema/styles/createSpec.ts#L83)）
  - renderHTML 处理（[第 87-98 行](../../src/schema/styles/createSpec.ts#L87)）
  - addMarkView（[第 100-111 行](../../src/schema/styles/createSpec.ts#L100)）

---

## 2. 默认样式

**文件：** [`../../src/blocks/defaultBlocks.ts`](../../src/blocks/defaultBlocks.ts)

默认样式定义（[第 62-142 行](../../src/blocks/defaultBlocks.ts#L62)）：
- **TextColor**：文本颜色（[第 62-96 行](../../src/blocks/defaultBlocks.ts#L62)）
  - render 方法（[第 68-75 行](../../src/blocks/defaultBlocks.ts#L68)）
  - toExternalHTML（[第 76-87 行](../../src/blocks/defaultBlocks.ts#L76)）
  - parse（[第 88-94 行](../../src/blocks/defaultBlocks.ts#L88)）
- **BackgroundColor**：背景颜色（[第 98-132 行](../../src/blocks/defaultBlocks.ts#L98)）
- **bold/italic/underline/strike/code**：基础样式（[第 135-139 行](../../src/blocks/defaultBlocks.ts#L135)）

---

## 3. 样式应用

### 3.1 StyleManager API

**文件：** [`../../src/editor/managers/StyleManager.ts`](../../src/editor/managers/StyleManager.ts)

- **getActiveStyles**：获取激活样式（[第 55-84 行](../../src/editor/managers/StyleManager.ts#L55)）
  - 从 Prosemirror marks 读取（[第 58 行](../../src/editor/managers/StyleManager.ts#L58)）
  - 转换为 BlockNote 样式对象（[第 60-80 行](../../src/editor/managers/StyleManager.ts#L60)）
- **addStyles**：添加样式（[第 90-106 行](../../src/editor/managers/StyleManager.ts#L90)）
  - 布尔类型样式（[第 96-97 行](../../src/editor/managers/StyleManager.ts#L96)）
  - 字符串类型样式（[第 98-101 行](../../src/editor/managers/StyleManager.ts#L98)）
- **removeStyles**：移除样式（[第 112-116 行](../../src/editor/managers/StyleManager.ts#L112)）
- **toggleStyles**：切换样式（[第 122-138 行](../../src/editor/managers/StyleManager.ts#L122)）

### 3.2 样式到标记转换

**文件：** [`../../src/api/nodeConversions/blockToNode.ts`](../../src/api/nodeConversions/blockToNode.ts)

- **styledTextToNodes**：样式文本转节点（[第 28-79 行](../../src/api/nodeConversions/blockToNode.ts#L28)）
  - 遍历样式对象（[第 36 行](../../src/api/nodeConversions/blockToNode.ts#L36)）
  - 创建 Prosemirror Mark（[第 44-49 行](../../src/api/nodeConversions/blockToNode.ts#L44)）
  - 应用到文本节点（[第 59 行](../../src/api/nodeConversions/blockToNode.ts#L59)）

---

## 4. 自定义样式

要创建自定义样式，需要：

1. **定义样式配置**：使用 `createStyleSpec`
2. **实现 render 方法**：返回 DOM 元素
3. **实现 toExternalHTML**：导出时的 HTML 结构
4. **实现 parse**：从 HTML 解析样式
5. **添加到样式模式**：在创建编辑器时传入

**参考示例：** [`../../src/blocks/defaultBlocks.ts`](../../src/blocks/defaultBlocks.ts#L62)（第 62-142 行）