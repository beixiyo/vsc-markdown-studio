# 本地实现 BlockNote AI 流程 - 学习与开发计划

> 本文档旨在指导你一步步地在本地构建一个 BlockNote AI 功能的原型。我们将使用 `valtio` 进行状态管理，并用模拟数据替代真实的网络请求，以实现一个功能完备、逻辑闭环的最小化系统。

---

#### **阶段一：搭建基础 - “无头”的 AI 核心**

这个阶段的目标是构建一个纯逻辑、无 UI 的 AI 扩展核心。

**步骤 1: 创建自定义 AI 扩展 (`MyAIExtension.ts`)**
-   **目标**: 搭建扩展的基础框架。
-   **任务**:
    1.  在 `src/blocknoteExts` 目录下创建新文件 `MyAIExtension.ts`。
    2.  在文件中定义一个 `MyAIExtension` 类，让它继承自 `BlockNoteExtension`。
    3.  实现 `createMyAIExtension` 工厂函数，用于创建扩展实例。

**步骤 2: 实现状态机 (使用 Valtio)**
-   **目标**: 为 AI 流程定义和管理所有状态。
-   **任务**:
    1.  在 `MyAIExtension` 内部，从 `valtio` 导入 `proxy`。
    2.  创建一个公开的 `state` 属性，并用 `proxy` 包裹一个状态对象：`this.state = proxy({ aiMenuState: 'closed', ... })`。这个 `state` 对象就是我们的响应式数据源。
    3.  `aiMenuState` 至少应包含 `"closed"`, `"user-input"`, `"thinking"`, `"ai-writing"`, `"user-reviewing"`, `"error"` 这几种状态。

**步骤 3: 创建模拟 AI 服务 (`mockLLMService.ts`)**
-   **目标**: 模拟一个会进行流式响应的 AI 服务，彻底摆脱网络依赖。
-   **任务**:
    1.  在 `src/blocknoteExts` 目录下创建新文件 `mockLLMService.ts`。
    2.  在文件中创建一个 `async` 函数，例如 `getMockAIStream()`。
    3.  **`@TODO: 此处为模拟数据，未来需替换为真实网络请求`**。
    4.  让这个函数返回一个 `ReadableStream`，它会以单词或句子的形式，每隔一小段时间（如 100ms）就推送一小段预设好的文本（例如 "这是一个模拟的 AI 流式响应。"）。

---

#### **阶段二：核心交互 - 应用与管理“建议”**

这个阶段我们将让 AI（的模拟）真正开始“修改”文档。

**步骤 4: 实现“建议变更” (`suggestChanges`)**
-   **目标**: 将模拟 AI 服务返回的文本，以“建议”的形式应用到编辑器中。
-   **任务**:
    1.  在 `MyAIExtension` 的构造函数 (`constructor`) 中，添加 `suggestChanges()` 插件。这是实现非破坏性编辑的关键。
    2.  创建 `callLLM` 方法，这是编排所有流程的核心。
    3.  在 `callLLM` 中：
        a.  直接修改状态：`this.state.aiMenuState = 'thinking'`。
        b.  调用上一步创建的 `getMockAIStream()`。
        c.  当流开始时，更新状态为 `ai-writing`。
        d.  监听流数据，每收到一小段文本，就调用 `suggestChanges` 的 API 将其应用到文档中。
        e.  当流结束时，将状态更新为 `user-reviewing`。

**步骤 5: 实现“接受建议” (`acceptChanges`)**
-   **目标**: 让用户可以确认 AI 的修改，使其成为文档的正式内容。
-   **任务**:
    1.  在 `MyAIExtension` 中创建 `acceptChanges` 方法。
    2.  在该方法内部，调用从 `@blocknote/prosemirror-suggest-changes` 导入的 `applySuggestions` 函数，它会将所有待定的“建议”合并到文档中。
    3.  最后，调用 `closeAIMenu` 方法（你也需要创建它）来将状态重置为 `closed`。

**步骤 6: 实现“拒绝/回退建议” (`rejectChanges`)**
-   **目标**: 让用户可以撤销 AI 的所有修改。
-   **任务**:
    1.  在 `MyAIExtension` 中创建 `rejectChanges` 方法。
    2.  在该方法内部，调用 `revertSuggestions` 函数，它会丢弃所有“建议”，让文档恢复到 AI 修改之前的状态。
    3.  最后，同样调用 `closeAIMenu` 方法重置状态。

---

#### **阶段三：连接视图 - 构建最小化 UI**

现在，我们为“无头”的 AI 核心穿上“外衣”。

**步骤 7: 创建触发按钮 (`MyAIToolbarButton.tsx`)**
-   **目标**: 提供一个入口来启动整个 AI 流程。
-   **任务**:
    1.  创建一个简单的 React 组件。
    2.  在组件中，通过 `getAIExtension(editor)` 获取 `MyAIExtension` 的实例。
    3.  渲染一个按钮，其 `onClick` 事件处理器调用 `aiExtension.openAIMenuAtBlock()`。

**步骤 8: 创建 AI 交互菜单 (`MyAIMenu.tsx`)**
-   **目标**: 根据 AI 的不同状态，向用户展示不同的交互界面。
-   **任务**:
    1.  创建一个 React 组件。
    2.  从 `valtio` 导入 `useSnapshot`。
    3.  在组件内部，获取 `aiExtension.state` 并用 `useSnapshot` 创建一个快照：`const snap = useSnapshot(aiExtension.state)`。
    4.  根据 `snap.aiMenuState` 的值，使用条件渲染：
        -   如果状态是 `closed`，不渲染任何东西。
        -   如果状态是 `user-input`，显示一个输入框和“生成”按钮。
        -   如果状态是 `thinking` 或 `ai-writing`，显示加载动画或提示文本。
        -   如果状态是 `user-reviewing`，显示“接受”和“拒绝”按钮。
    5.  将这些按钮的 `onClick` 事件分别绑定到 `aiExtension.acceptChanges()` 和 `aiExtension.rejectChanges()`。

---

#### **阶段四：整合与测试**

**步骤 9: 组装你的 AI 编辑器**
-   **目标**: 将所有部分组合在一起，形成一个可以工作的最小化 AI 编辑器。
-   **任务**:
    1.  在你的主应用文件（如 `App.tsx`）中：
        a.  创建 BlockNote 编辑器实例。
        b.  将你创建的 `createMyAIExtension` 注入编辑器的 `extensions` 数组。
        c.  在编辑器旁边，渲染你的 `MyAIToolbarButton` 和 `MyAIMenu` 组件。
    2.  运行应用，完整地测试一遍从点击按钮、AI（模拟）输出、到接受/拒绝的全过程，确保逻辑闭环且功能正常。