# BlockNote AI 架构文档

## 摘要

本文档旨在清晰地阐述 BlockNote AI 功能的实现原理。该功能主要由两个包构成：

-   `packages/xl-ai`: **AI 核心引擎**。它提供了一个“无头”(Headless)的 AI 逻辑层和一套与之配套的 React 视图组件。
-   `packages/ai-demo`: **官方演示**。它展示了如何将 `xl-ai` 提供的引擎和组件组装成一个功能完备的 AI 编辑器。

---

## 核心架构：三层模型

`xl-ai` 的设计遵循了经典的前端分层思想，可以清晰地划分为三个层次：

#### 1. 视图层 (View Layer)

-   **职责**: 负责所有与用户交互的界面 (UI) 的渲染和输入捕捉。
-   **核心文件**: `packages/xl-ai/src/components/**/*.tsx` (例如 `AIMenu.tsx`, `AIToolbarButton.tsx`)。
-   **工作模式**:
    -   订阅“逻辑层”的状态来展示不同 UI (如输入框、加载动画、审核按钮)。
    -   捕捉用户的操作 (如点击、输入)，并调用“逻辑层”提供的 API。

#### 2. 逻辑层 (Logic Layer)

-   **职责**: 整个 AI 功能的**大脑和中枢**。它不关心 UI，只负责管理状态和编排工作流。
-   **核心文件**: `packages/xl-ai/src/AIExtension.ts`。
-   **工作模式**:
    -   定义一个**状态机** (`aiMenuState`) 来描述 AI 功能的完整生命周期。
    -   向上为“视图层”提供 API (如 `callLLM`, `acceptChanges`) 和可供订阅的状态库 (Store)。
    -   向下调用“服务层”来执行具体的 AI 请求和与编辑器底层交互。

#### 3. 服务层 (Service Layer)

-   **职责**: 负责与外部服务和编辑器底层进行通信。
-   **核心文件**:
    -   `api/LLMRequest.ts`: 负责构建 Prompt、调用 Vercel AI SDK、处理流式响应。
    -   `blocknoteAIClient/client.ts`: 负责连接代理服务器，安全地管理 API Key。
    -   `plugins/*.ts`: ProseMirror 插件，实现 AI 光标、建议(Suggestion)等底层能力。

---

## 完整生命周期：一次 AI 续写之旅

以下流程完整地展示了用户从点击 AI 按钮到最终完成一次续写操作的全部过程：

1.  **集成 (ai-demo)**
    -   在 `ai-demo/src/App.tsx` 中，开发者通过 `createAIExtension` 创建 AI 引擎实例，并将其注入 `BlockNoteEditor`。这是所有功能开始的起点。

2.  **触发 (视图层)**
    -   用户点击工具栏上的 `AIToolbarButton` 组件。
    -   该组件立即调用逻辑层的 API：`aiExtension.openAIMenuAtBlock()`。

3.  **状态变更与 UI 响应 (逻辑层 -> 视图层)**
    -   `AIExtension` 接收到调用，将内部状态机 `aiMenuState` 更新为 `user-input`。
    -   `AIMenu` 组件因订阅了该状态，自动重新渲染，并向用户展示一个文本输入框。

4.  **发起请求 (视图层 -> 逻辑层 -> 服务层)**
    -   用户输入提示词并提交。
    -   `AIMenu` 组件调用逻辑层的核心 API：`aiExtension.callLLM()`。
    -   `AIExtension` 将状态更新为 `thinking`，然后调用服务层的 `doLLMRequest`，后者负责组装 Prompt 并通过 HTTP 发送给 AI 模型。

5.  **流式响应与应用 (服务层 -> 逻辑层 -> 编辑器)**
    -   服务层开始接收 AI 的流式响应。
    -   `AIExtension` 将状态更新为 `ai-writing`。
    -   最关键的一步：AI 返回的文本不是直接插入文档，而是通过 `prosemirror-suggest-changes` 插件，作为一种临时的**“建议”**被应用到编辑器中。这使用户可以预览和审核 AI 的修改。

6.  **用户审核 (逻辑层 -> 视图层)**
    -   AI 响应结束。`AIExtension` 将状态更新为 `user-reviewing`。
    -   `AIMenu` 组件检测到此状态，自动显示“接受”和“拒绝”按钮。

7.  **完成 (视图层 -> 逻辑层)**
    -   用户点击“接受”或“拒绝”。
    -   `AIMenu` 组件调用 `aiExtension.acceptChanges()` 或 `rejectChanges()`。
    -   `AIExtension` 负责将“建议”正式合并到文档或将其丢弃，然后将状态重置为 `closed`。
    -   至此，一个完整的生命周期结束。

---

## 模块与技术栈

#### 核心模块速查

-   `AIExtension.ts`: **核心**，AI 的状态机与工作流协调器。
-   `components/*.tsx`: **视图**，所有用户能看到的 UI 界面。
-   `api/LLMRequest.ts`: **服务**，负责直接与 AI 模型通信。
-   `blocknoteAIClient/client.ts`: **服务**，负责连接代理，管理密钥。
-   `ai-demo/src/App.tsx`: **示例**，展示如何将所有部分组装起来。

#### 关键技术

-   **React**: 用于构建视图层。
-   **Zustand**: 一个轻量级的状态管理库，用于连接视图层和逻辑层。
-   **ProseMirror**: 高度可定制的富文本编辑器框架，是 BlockNote 的基础。
-   **Vercel AI SDK**: 提供了与各种 AI 模型进行流式交互的标准化工具。