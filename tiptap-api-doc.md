# `tiptap-api` 包代码审查报告 DONE

## 1. 执行摘要
`tiptap-api` 包作为 Tiptap 低级 API 与应用程序 UI/业务逻辑之间的核心桥梁。它展示了一个成熟的架构，强调**模块化**、**解耦**和**开发者体验（DX）**。通过为编辑器操作提供外观模式和强大的存储抽象，它允许在不同的编辑器实现中实现高复用性。

---

## 2. 主要优势
- **操作中的外观模式**：`createMarkdownOperate` 函数（位于 `src/operate/create-markdown-operate.ts`）是外观模式的优秀示例。它为复杂的 Tiptap 命令系统提供了简化的、更高级别的接口。
- **性能优化的 Hooks**：`useTiptapEditor` 利用 `@tiptap/react` 的 `useEditorState` 和选择器模式。这确保了组件仅在请求的特定状态变化时才重新渲染，避免了监视整个编辑器实例的性能陷阱。
- **可扩展的存储架构**：`StorageEngine` 接口确保可以在不触及业务逻辑的情况下交换持久化层（例如，从 `localStorage` 到 `IndexedDB` 或基于云的 API）。
- **事件生命周期管理**：`useSelection` 和 `useMarkdownOutline` 等 hooks 正确处理编辑器事件监听器，确保组件卸载时不会发生内存泄漏。
- **严格的类型安全**：TypeScript 的使用是一致的，为选项、结果和数据结构提供了清晰的接口（例如，`StorageItem`、`OutlineItem`）。

---

## 3. 改进领域与代码示例

### 3.1 Hooks 中的手动防抖逻辑
**问题**：`useStorageSave` 使用 `useRef` 和 `setTimeout` 实现了自己的防抖逻辑。这比使用专用工具更容易出错且更难维护。

**位置**：`src/react/hooks/storage/use-storage-save.ts`

**当前代码**：
```typescript
const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

const debouncedSave = useCallback((editor: Editor) => {
  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
  saveTimeoutRef.current = setTimeout(() => {
    saveToStorage(editor)
  }, debounceMs)
}, [saveToStorage, debounceMs])
```

**建议更改**：
使用代码库中已有的可复用 `useThrottledCallback` 或 `useDebounce` hook 来简化逻辑。

### 3.2 内容操作冗余
**问题**：`setEditorHTML` 和 `setEditorMarkdown` 共享几乎相同的调用 `editor.commands.setContent` 的逻辑。

**位置**：`src/operate/content.ts`

**建议**：
创建一个私有内部辅助函数 `applyContentUpdate` 来一致地处理 try-catch 和命令执行逻辑。

### 3.3 硬编码的存储键
**问题**：`DEFAULT_STORAGE_KEY = '@@STORAGE_KEY'` 定义在 hook 文件内部。

**位置**：`src/react/hooks/storage/use-storage-save.ts`

**建议**：
将所有系统级常量移动到 `packages/tiptap-utils` 或 `tiptap-api` 内的专用 `constants.ts` 文件中，以避免"魔术字符串"。

### 3.4 Hook 选项的一致性
**问题**：某些 hooks 接受多个参数，而其他 hooks 使用单个 `options` 对象。
- `useSelection(config: UseSelectionConfig)`
- `useAutoSave(options: UseStorageSaveOptions & { editor?: Editor })`
- `useMarkdownOutline(editor: Editor | null)`

**建议**：
对于接受多个参数的所有 hooks，统一使用单个 `options` 对象。

---

## 4. 重构建议

1.  **集中化命令安全性**：
    重构 `src/operate` 以包含一个实用程序，在执行前检查编辑器实例是否有效以及命令是否存在，从而减少重复的 null 检查和 try-catch 块。

2.  **改进存储中的错误处理**：
    代替 `console.error`，允许 `StorageEngine` 接受可选的 `onError` 回调或返回 Result 类型（成功/失败），以允许 UI 向用户显示适当的错误状态。

3.  **增强 `useAutoSave`**：
    `useAutoSave` hook 目前处理"加载初始状态"和"保存更新"。这些职责可以拆分或更清楚地划分以提高可读性。

4.  **单元测试策略**：
    由于 `tiptap-api` 包含大部分业务逻辑（存储、内容解析、大纲构建），它应该是单元测试的主要目标。建议为 `operate` 和 `storage` 模块添加 Vitest 测试。

---

## 5. 结论
`tiptap-api` 包结构良好，遵循现代 React 和 TypeScript 最佳实践。识别的问题主要与轻微的代码重复和一致性有关，而不是架构缺陷。解决上述建议将进一步提高编辑器生态系统的可维护性和健壮性。
