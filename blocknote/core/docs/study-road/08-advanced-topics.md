# BlockNote Core 学习路线 - 高级主题

## 📚 目录

1. [事务系统（Transaction）](#1-事务系统transaction)
2. [导入导出](#2-导入导出)
3. [协作系统](#3-协作系统)
4. [评论系统](#4-评论系统)
5. [事件系统](#5-事件系统)
6. [工具函数](#6-工具函数)

---

## 1. 事务系统（Transaction）

**文件：** [`../../src/editor/BlockNoteEditor.ts`](../../src/editor/BlockNoteEditor.ts)

- **transact** 方法（[第 674-684 行](../../src/editor/BlockNoteEditor.ts#L674)）：在事务中执行操作
- 所有块操作都应该在事务中执行，确保状态一致性

---

## 2. 导入导出

### 2.1 HTML 导出

**文件：** [`../../src/api/exporters/html/externalHTMLExporter.ts`](../../src/api/exporters/html/externalHTMLExporter.ts)

导出为外部 HTML 格式。

**文件：** [`../../src/api/exporters/html/internalHTMLSerializer.ts`](../../src/api/exporters/html/internalHTMLSerializer.ts)

导出为内部 HTML 格式（用于保存/加载）。

### 2.2 Markdown 导出

**文件：** [`../../src/api/exporters/markdown/markdownExporter.ts`](../../src/api/exporters/markdown/markdownExporter.ts)

导出为 Markdown 格式。

### 2.3 HTML 解析

**文件：** [`../../src/api/parsers/html/parseHTML.ts`](../../src/api/parsers/html/parseHTML.ts)

从 HTML 解析为块。

### 2.4 Markdown 解析

**文件：** [`../../src/api/parsers/markdown/parseMarkdown.ts`](../../src/api/parsers/markdown/parseMarkdown.ts)

从 Markdown 解析为块。

---

## 3. 协作系统

**目录：** [`../../src/extensions/Collaboration/`](../../src/extensions/Collaboration/)

基于 Yjs 的实时协作功能。

**目录：** [`../../src/yjs/`](../../src/yjs/)

Yjs 集成相关代码。

---

## 4. 评论系统

**目录：** [`../../src/comments/`](../../src/comments/)

- **extension.ts**：评论扩展
- **mark.ts**：评论标记
- **threadstore/**：评论线程存储
- **types.ts**：评论类型定义

---

## 5. 事件系统

**文件：** [`../../src/util/EventEmitter.ts`](../../src/util/EventEmitter.ts)

事件发射器实现，用于编辑器事件通信。

**文件：** [`../../src/editor/managers/EventManager.ts`](../../src/editor/managers/EventManager.ts)

事件管理器。

---

## 6. 工具函数

**目录：** [`../../src/util/`](../../src/util/)

- **browser.ts**：浏览器相关工具
- **string.ts**：字符串处理
- **table.ts**：表格处理
- **typescript.ts**：TypeScript 工具类型