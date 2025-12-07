# BlockNote Core 学习路线 - 基础架构理解

## 📚 目录

1. [整体架构概览](#1-整体架构概览)
2. [入口文件](#2-入口文件)
3. [模式系统（Schema System）](#3-模式系统schema-system)

---

## 1. 整体架构概览

### 1.1 整体架构概览

**起点文件：** [`../ARCHITECTURE.md`](../ARCHITECTURE.md)

这是理解整个包架构的最佳起点，包含：
- 核心能力介绍（[第 8-15 行](../ARCHITECTURE.md#L8)）
- 目录结构（[第 19-54 行](../ARCHITECTURE.md#L19)）
- 核心模块详解（[第 57-158 行](../ARCHITECTURE.md#L57)）
- 架构特点（[第 160-186 行](../ARCHITECTURE.md#L160)）

---

## 2. 入口文件

### 2.1 入口文件

**文件：** [`../../src/index.ts`](../../src/index.ts)

查看所有导出的公共 API，了解包的主要功能模块。

---

## 3. 模式系统（Schema System）

### 3.1 模式系统（Schema System）

**核心文件：** [`../../src/schema/index.ts`](../../src/schema/index.ts)

BlockNote 使用三层模式系统：
- **BlockSchema**：块类型定义
- **InlineContentSchema**：内联内容类型定义  
- **StyleSchema**：样式类型定义

**相关文件：**
- 块类型定义：[`../../src/schema/blocks/types.ts`](../../src/schema/blocks/types.ts#L97)（第 97-489 行）
- 样式类型定义：[`../../src/schema/styles/types.ts`](../../src/schema/styles/types.ts)
- 内联内容类型：[`../../src/schema/inlineContent/types.ts`](../../src/schema/inlineContent/types.ts)