# BlockNote Core 学习路线 - 块操作 API

## 📚 目录

1. [块操作命令](#1-块操作命令)
2. [块查询 API](#2-块查询-api)
3. [选择 API](#3-选择-api)
4. [内容插入](#4-内容插入)

---

## 1. 块操作命令

所有块操作命令位于：`../../src/api/blockManipulation/commands/`

### 1.1 插入块（insertBlocks）

**文件：** [`../../src/api/blockManipulation/commands/insertBlocks/insertBlocks.ts`](../../src/api/blockManipulation/commands/insertBlocks/insertBlocks.ts)

- **函数签名**（[第 16-25 行](../../src/api/blockManipulation/commands/insertBlocks/insertBlocks.ts#L16)）
- **实现逻辑**（[第 26-54 行](../../src/api/blockManipulation/commands/insertBlocks/insertBlocks.ts#L26)）
  - 查找参考块位置（[第 33-36 行](../../src/api/blockManipulation/commands/insertBlocks/insertBlocks.ts#L33)）
  - 计算插入位置（[第 38-41 行](../../src/api/blockManipulation/commands/insertBlocks/insertBlocks.ts#L38)）
  - 执行插入步骤（[第 43-45 行](../../src/api/blockManipulation/commands/insertBlocks/insertBlocks.ts#L43)）
  - 返回插入的块（[第 49-51 行](../../src/api/blockManipulation/commands/insertBlocks/insertBlocks.ts#L49)）

**使用示例：**
```typescript
editor.insertBlocks(
  [{ type: "paragraph", content: "Hello" }],
  referenceBlock,
  "after"
);
```

### 1.2 更新块（updateBlock）

**文件：** [`../../src/api/blockManipulation/commands/updateBlock/updateBlock.ts`](../../src/api/blockManipulation/commands/updateBlock/updateBlock.ts)

更新现有块的属性和内容。

### 1.3 替换块（replaceBlocks）

**文件：** [`../../src/api/blockManipulation/commands/replaceBlocks/replaceBlocks.ts`](../../src/api/blockManipulation/commands/replaceBlocks/replaceBlocks.ts)

替换一个或多个块。

### 1.4 移动块（moveBlocks）

**文件：** [`../../src/api/blockManipulation/commands/moveBlocks/moveBlocks.ts`](../../src/api/blockManipulation/commands/moveBlocks/moveBlocks.ts)

- **moveBlocksUp**：向上移动块
- **moveBlocksDown**：向下移动块

### 1.5 嵌套块（nestBlock）

**文件：** [`../../src/api/blockManipulation/commands/nestBlock/nestBlock.ts`](../../src/api/blockManipulation/commands/nestBlock/nestBlock.ts)

- **nestBlock**：嵌套块
- **unnestBlock**：取消嵌套
- **canNestBlock/canUnnestBlock**：检查是否可以嵌套/取消嵌套

### 1.6 分割块（splitBlock）

**文件：** [`../../src/api/blockManipulation/commands/splitBlock/splitBlock.ts`](../../src/api/blockManipulation/commands/splitBlock/splitBlock.ts)

在光标位置分割块。

### 1.7 合并块（mergeBlocks）

**文件：** [`../../src/api/blockManipulation/commands/mergeBlocks/mergeBlocks.ts`](../../src/api/blockManipulation/commands/mergeBlocks/mergeBlocks.ts)

合并相邻的块。

---

## 2. 块查询 API

**文件：** [`../../src/api/blockManipulation/getBlock/getBlock.ts`](../../src/api/blockManipulation/getBlock/getBlock.ts)

- **getBlock**：根据 ID 获取块
- **getPrevBlock**：获取前一个兄弟块
- **getNextBlock**：获取下一个兄弟块
- **getParentBlock**：获取父块

---

## 3. 选择 API

**文件：** [`../../src/api/blockManipulation/selections/textCursorPosition.ts`](../../src/api/blockManipulation/selections/textCursorPosition.ts)

- **getTextCursorPosition**：获取文本光标位置

**文件：** [`../../src/api/blockManipulation/selections/selection.ts`](../../src/api/blockManipulation/selections/selection.ts)

选择相关的工具函数。

---

## 4. 内容插入

**文件：** [`../../src/api/blockManipulation/insertContentAt.ts`](../../src/api/blockManipulation/insertContentAt.ts)

在指定位置插入内容。