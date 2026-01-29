# `tiptap-trigger` 代码审查报告 DONE

本报告对 `tiptap-editor/packages/tiptap-trigger/` 进行了全面的代码审查，涵盖了 React 最佳实践、数据流设计、职责划分及代码质量等维度。

---

## 1. 重复代码与冗余逻辑 (Code Duplication & Redundancy)

### 🔴 状态同步冗余
- **位置**: `src/createSuggestionPlugin.ts` 与 `src/react/useSuggestion.ts`
- **描述**: 状态在三个地方维护：ProseMirror 插件内部状态、插件外部的 `currentState` 变量、以及 React 的 `state`。这种多重同步增加了复杂性，且容易导致 UI 与编辑器状态不一致。
- **推荐修复**: 统一状态源。可以考虑直接从 ProseMirror Plugin State 中读取，或者使用一个统一的状态管理（如 `zustand` 或简单的 `Observable`），让 React 通过该单源进行订阅。

### 🟡 逻辑重复：重置状态
- **位置**: `src/createSuggestionPlugin.ts`
- **描述**: 在 `apply` 方法中，处理 `close`、`clearQuery` 以及选区变化时的重置逻辑几乎完全相同。
- **推荐修复**: 提取一个 `getInitialState()` 函数或 `resetState()` 辅助函数。

---

## 2. 逻辑冲突与安全性 (Logical Conflicts)

### 🔴 ProseMirror `apply` 中的副作用
- **位置**: `src/createSuggestionPlugin.ts`
- **描述**: 在 `plugin.state.apply` 中直接调用 `notify(next)`。ProseMirror 的 `apply` 必须是**纯函数**。在此处触发外部回调（通知 React 更新）是副作用，可能导致在 ProseMirror 内部尝试更新状态时产生竞态条件。
- **严重度**: 🔴 严重
- **推荐修复**: 将通知逻辑移至插件的 `view.update` 钩子中，根据状态变化触发 `notify`。

### 🟡 挂载顺序依赖（Retry Logic）
- **位置**: `src/react/useSuggestion.ts`
- **描述**: `useEffect` 中存在一个多达 50 次、间隔 16ms 的重试逻辑来获取 `API`。这反映了扩展挂载顺序的不稳定性。
- **推荐修复**: 改进 `getSuggestionPluginAPI` 的实现，或通过上下文（Context）传递 API，而不是依赖于不确定的 DOM/扩展查询。

---

## 3. SRP 单一职责原则违反 (SRP Violations)

### 🟡 `useSuggestion` 职责过重
- **位置**: `src/react/useSuggestion.ts`
- **描述**: 该 Hook 同时处理了：
    1. 编辑器 API 发现与订阅。
    2. 触发器配置管理。
    3. 异步数据获取（Fetch）。
    4. 键盘事件拦截（ArrowDown/Up/Enter/Esc）。
- **推荐修复**: 拆分为多个专门的 Hook：
    - `useSuggestionState`: 仅处理与编辑器的通信。
    - `useSuggestionData`: 处理 `sources` 的数据请求。
    - `useSuggestionKeyboard`: 处理键盘交互逻辑。

### 🟢 `createSuggestionPlugin` 逻辑耦合
- **位置**: `src/createSuggestionPlugin.ts`
- **描述**: 该函数既负责 ProseMirror 插件的底层逻辑（Decoration, handleTextInput），又负责管理 Trigger 列表。
- **推荐修复**: 将 Trigger 管理逻辑（`Map<string, SuggestionTriggerOptions>`）移出，作为一个独立的模块或存储。

---

## 4. 模块耦合与硬编码 (Module Coupling & Hardcoding)

### 🟡 硬编码选择器与 ID
- **位置**: `src/createSuggestionPlugin.ts`
- **描述**: 使用了 `Math.random().toString(36).slice(2)` 生成随机 ID，并使用 `data-suggestion-decoration-id` 选择器直接操作 DOM。
- **推荐修复**: 使用更可靠的 ID 生成方案（如 `nanoid`），并尽量通过 ProseMirror 提供的 API 获取 DOM 节点。

### 🟡 样式 Token 不一致
- **位置**: `src/react/ui/suggestion-menu-item.tsx`
- **描述**: 使用了 `var(--bg-color-hover)` 等 CSS 变量，而不是项目 `AGENTS.md` 中推荐的 Tailwind Token（如 `bg-backgroundSecondary`）。
- **推荐修复**: 按照项目规范，将硬编码的 CSS 变量替换为 Tailwind 类名。

---

## 5. React 最佳实践与 Hook 规则

### 🟡 键盘事件监听
- **位置**: `src/react/useSuggestion.ts`
- **描述**: 使用 `currentViewDom.addEventListener('keydown', handleKeydown, true)` 在捕获阶段拦截事件。虽然有效，但这种方式绕过了 React 的合成事件系统。
- **推荐修复**: 如果必须拦截，建议在 `SuggestionMenu` 组件外层包裹一个处理容器，或在 Tiptap 的 `editorProps.handleKeyDown` 中统一处理。

### 🟢 `useLatestRef` 命名建议
- **位置**: `src/react/useLatestRef.ts`
- **描述**: 该 Hook 的功能是保持一个 Ref 始终指向最新的状态值。
- **推荐修复**: 建议重命名为更通用的 `useLatest` 或 `useLatestRef`，以符合社区习惯。

---

## 6. 其他问题 (Miscellaneous)

### 🟢 文件名拼写错误
- **位置**: `src/constans.ts`
- **描述**: 应为 `constants.ts`。

---

## 总结

`tiptap-trigger` 包实现了功能强大的触发器机制，逻辑清晰，但在**状态同步纯净度**和 **Hook 职责划分**上还有提升空间。最紧迫的问题是 `ProseMirror apply` 中的副作用，这可能在高频输入下导致难以排查的 Bug。

建议在后续迭代中重点关注其**多触发器支持**和**数据源抽象（SuggestionSource）**的设计优点，同时逐步重构上述提到的高风险点。
