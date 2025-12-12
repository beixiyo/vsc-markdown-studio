## Tiptap Suggestion / Trigger 插件架构设计

- 目标是在 `tiptap-editor/packages/tiptap-trigger` 包实现类似 BlockNote 的 `/` / `@` / `:` 等触发字符 Suggestion 菜单能力，可在 `tiptap-editor/tiptap-editor` 中复用。
- 工程化打包配置参照 `tiptap-editor/packages/tiptap-comment`
- 如果需要事件管理，参照 `tiptap-editor/packages/tiptap-ai/src/Eventbus.ts`

---

## 1. 设计目标与边界

- **目标**
  - 支持多个触发字符（`/`、`@`、`:` 等）打开 Suggestion 菜单。
  - 支持本地数据源（如 Slash 菜单）与远程数据源（搜索、AI、业务接口）。
  - 菜单项可以对文档执行任意操作（插入块、修改块类型等）。
  - 支持键盘导航（上下方向键、回车选择、ESC 关闭）。

- **边界**
  - **插件层（“后端”/核心逻辑）**：基于 Tiptap / ProseMirror 的扩展或插件，负责：
    - 拦截字符输入（识别触发字符）。
    - 维护 Suggestion 状态机。
    - 提供操作文档的能力（通常交由 `SuggestionItem.onSelect` 完成）。
  - **控制器层**：基于 React（与现有 `selection-toolbar` 类似），负责：
    - 订阅插件状态。
    - 调用数据源拉取 SuggestionItem 列表。
    - 把状态与交互（选中、点击）传递给 UI。
  - **UI 层**：纯展示组件，使用 `@floating-ui/react` 定位，不关心编辑器实现细节。

---

## 2. 核心概念与类型抽象（插件层）

### 2.1 SuggestionTrigger

描述一个“触发入口”，类似 BlockNote 的 `/` / `:`：

- **字段示例**
  - `id: string`  
    - 例如 `"slash"`, `"mention"`, `"emoji"`。
  - `character: string`  
    - 例如 `"/"`, `"@"`, `":"`，或者支持多字符触发（如 `"::"`）。
  - `minQueryLength?: number`  
    - 触发后 query 至少多少字符才开始请求数据源，例如 emoji 需要 2 个字符。
  - `deleteTriggerCharacterOnSelect?: boolean`  
    - 选中某项后是否删除触发字符及 query。
  - `allowProgrammaticOpen?: boolean`  
    - 是否允许通过 API 手动打开（不通过键盘输入）。

> 说明：**一个插件实例可以注册多个 trigger**，共用同一个 Suggestion 状态机。

### 2.2 SuggestionState

插件层维护的“当前菜单状态”，对控制器层只读：

- `active: boolean` — 当前是否有激活的 Suggestion 菜单。
- `triggerId: string | null` — 当前触发来源（如 `"slash"`）。
- `triggerCharacter: string | null` — 实际识别到的触发字符（如 `"/"`）。
- `query: string` — 触发字符之后到光标当前位置之间的文本。
- `queryStartPos: number | null` — 文档中 query 起始位置（通常是触发字符后的光标位置）。
- `referenceRect: DOMRect | null` — 菜单浮层锚点（由 decoration / DOM 计算）。
- `ignoreQueryLength: boolean` — 某些情况下允许空 query 也显示菜单（如 emoji picker）。
- 其他内部字段（可根据实现补充）：
  - `decorationId: string` — 标记装饰节点 ID。
  - `deleteTriggerCharacter: boolean` — 内部标记是否要删除触发字符。

### 2.3 SuggestionItem（逻辑层菜单项）

描述“用户可以选择的动作”，与 UI 层解耦：

- **字段示例**
  - `id: string` — 唯一标识，用于调试或 UI key。
  - `title: string` — 主标题，如 `"Heading 1"`。
  - `subtitle?: string` — 副标题，如 `"大标题"`。
  - `aliases?: string[]` — 搜索别名。
  - `group?: string` — 分组名（如 `"Text"`, `"Media"`）。
  - `meta?: Record<string, any>` — 额外信息（如 block 类型、图标 key）。
  - `onSelect(editor, context): void | Promise<void>`  
    - 真正执行文档操作的回调，例如：
      - 把当前段落变为 H1。
      - 在当前块下面插入图片块，并打开文件选择。

> 约定：**文档修改只能通过 `onSelect` 完成，插件层和控制器层不直接写死业务逻辑。**

### 2.4 SuggestionSource（数据源接口）

用于获取菜单项的抽象，可对应本地/远程等不同实现：

- **接口设计思路**
  - 输入：
    - `triggerId: string`
    - `query: string`
    - `editorContext: { selection, blockInfo, schema, ... }`
  - 输出：
    - `Promise<SuggestionItem[]>`  

- **典型实现**
  - `SlashMenuSource`：根据 schema 和国际化字典生成本地 Slash 菜单（类似 BlockNote `getDefaultSlashMenuItems`）。
  - `EmojiSource`：本地 emoji 数据 + 模糊匹配。
  - `RemoteSearchSource`：调用后端搜索接口，根据 query 返回匹配文档。
  - `AISource`：调用 AI 接口返回补全/改写之类的建议项。

---

## 3. 插件层职责与对外 API

### 3.1 插件职责

基于 Tiptap / ProseMirror 实现一个独立的 `Suggestion` 扩展/插件，职责：

- 监听文本输入事件（尤其是字符输入）。
- 根据已注册 `SuggestionTrigger` 判断是否需要激活菜单。
- 维护 `SuggestionState`，负责：
  - 何时创建/更新/关闭状态。
  - 何时同步 DOMRect / decoration 信息。
- 提供给上层使用的 API：
  - 获取当前状态。
  - 编程式打开/关闭菜单。
  - 清理 query（删除触发字符及后续文本）。

### 3.2 对外 API（示意接口）

> 这些 API 会通过 Tiptap 的 `editor.extensionManager` 或自定义 hooks 暴露给 React 层。

- **触发配置**
  - `addTrigger(trigger: SuggestionTrigger): void`
  - `removeTrigger(triggerId: string): void`

- **菜单控制**
  - `open(triggerId: string, options?: { ignoreQueryLength?: boolean; deleteTriggerCharacter?: boolean }): void`
    - 编程式打开菜单，如点击某个按钮打开 AI 菜单。
  - `close(): void`
  - `clearQuery(): void`
    - 删除触发字符 + query 文本（类似 BlockNote 的 `clearQuery`）。

- **状态访问**
  - `getState(): SuggestionState`
  - `subscribe(listener: (state: SuggestionState) => void): () => void`
    - 或者采用已有的全局状态管理/hook 体系。

### 3.3 核心内部逻辑流程

1. **拦截输入**
   - 在 Tiptap / ProseMirror 的 `handleTextInput` 或等价钩子中：
     - 拿到 `from`, `to`, `text`。
     - 如果是纯插入（`from === to`），则：
       - 组合最近一段文本片段，判断是否等于任一 `trigger.character`。
       - 匹配成功时：
         - 将该字符插入文档。
         - 设置 transaction meta 或内部状态，启动 Suggestion 菜单：
           - `active = true`
           - `triggerId` / `triggerCharacter`
           - `query = ""`
           - `queryStartPos = 当前 selection.from`
           - 记录 decoration 位置。

2. **更新 query**
   - 在插件的 `apply(tr, prevState)` 中：
     - 若 `active` 且 selection 仍在同一 block：
       - 通过 `doc.textBetween(queryStartPos, selection.from)` 计算新的 `query`。
     - 若 selection 发生不符合条件的变化，则关闭菜单。

3. **关闭条件**
   - 选区不再是光标（`from !== to`）。
   - 光标移动到 `queryStartPos` 之前。
   - 光标换到其他 block。
   - 发生 blur / 鼠标点击 / ESC 等事件。
   - 外部调用 `close()`。

4. **referenceRect / decoration**
   - 在插件 `decorations` 中对触发字符或整个 block 加一个自定义 Decoration：
     - 携带 `data-decoration-id`。
   - 在 view 更新时，通过 `querySelector([data-decoration-id=...])` 获取 DOM 节点的 `getBoundingClientRect()`，同步到 `SuggestionState.referenceRect`。

---

## 4. 控制器层设计（React / UI glue）

控制器负责把“插件状态 + 数据源 + UI 交互”连接起来，类似 BlockNote 的 `SuggestionMenuController`。

### 4.1 输入与配置

- 从编辑器或插件获取：
  - `SuggestionState`（订阅或 hook）。
  - 插件 API（`addTrigger`, `close`, `clearQuery`, `open`, ...）。

- 从配置注入：
  - `config: Record<string, { sources: SuggestionSource[]; minQueryLength?: number; uiType?: "list" | "grid"; ... }>`
    - 例如：
      - `config["slash"] = { sources: [localSlashSource], minQueryLength: 0, uiType: "list" }`
      - `config["emoji"] = { sources: [emojiSource], minQueryLength: 2, uiType: "grid" }`

### 4.2 控制器内部逻辑

1. **注册 Trigger**
   - 控制器挂载时，对插件调用 `addTrigger`，例如：
     - `addTrigger({ id: "slash", character: "/", minQueryLength: 0 })`
     - `addTrigger({ id: "emoji", character: ":", minQueryLength: 2 })`

2. **根据状态决定是否拉取数据**
   - 当 `state.active` 且 `state.triggerId` 存在对应配置：
     - 判断 `query.length >= minQueryLength`（或 `state.ignoreQueryLength === true`）：
       - 如果不足，则不请求数据源，菜单可隐藏或显示“输入更多字符”。
       - 如果足够：
         - 并发调用 `sources` 列表，合并结果为 `SuggestionItem[]`。
         - 按需进行排序 / 分组。
     - 维护 `loading` / `error` 状态。

3. **处理交互**
   - 键盘：
     - 上/下方向键切换当前 active index。
     - 回车选择当前 active item：
       - 调用该 `SuggestionItem.onSelect(editor, context)`。
       - 调用插件的 `clearQuery()` 或 `close()`。
     - ESC：
       - 调用 `close()`。
   - 鼠标：
     - 点击某一项 → 同样调用 `onSelect` + `close/clearQuery`。

4. **向 UI 提供 props**

控制器输出给 UI 组件的一组 props（例）：

- `open: boolean`
- `items: SuggestionItemUI[]`  
  - 从逻辑层 `SuggestionItem` 映射而来，添加 icon、样式信息等。
- `activeIndex: number`
- `referenceRect: DOMRect | null`
- `query: string`
- `loading: boolean`
- `error: Error | null`
- 回调：
  - `onItemClick(index: number)`
  - `onClose()`

---

## 5. UI 层设计（纯展示组件）

### 5.1 职责

- 接收控制器提供的 props，使用 `@floating-ui/react` 进行定位。
- 显示列表型 / 网格式 Suggestion 菜单。
- 在 UI 层内部不直接访问 editor / plugin，只通过 props 完成交互。

### 5.2 输入 props（建议）

- `open: boolean`
- `items: { id: string; title: string; subtitle?: string; icon?: ReactNode; group?: string; ... }[]`
- `activeIndex: number`
- `referenceRect: DOMRect | null` 或 `referenceElement: HTMLElement | null`
- `query: string`
- `loading: boolean`
- `error: Error | null`
- `onItemClick: (index: number) => void`
- `onClose: () => void`

### 5.3 实现注意点

- 使用与 `selection-toolbar` 一致的 Floating UI 封装，保持交互风格统一。
- 处理滚动时位置更新（使用 Floating UI 的 autoUpdate 机制或插件层的 scroll 监听）。
- 注意 z-index 与其他浮层（tooltip、selection-toolbar、context-menu）协调。

---

## 6. 数据源层（本地 & 远程）

### 6.1 统一接口

- `fetchItems(triggerId, query, editorContext): Promise<SuggestionItem[]>`

### 6.2 常见数据源实现示例（设计层级）

- `SlashMenuSource`
  - 根据 block schema / 当前 block 类型 / 配置生成一组本地 `SuggestionItem`。
  - 类似 BlockNote `getDefaultSlashMenuItems`：
    - 空/只有 `/` 时，更新当前块类型；
    - 否则，在当前块下插入新的块。

- `EmojiSource`
  - 本地 emoji 列表（短码 + unicode）。
  - 根据 `query`（如 `sm`) 进行前缀 / 模糊匹配。

- `RemoteSearchSource`
  - 调用后端搜索 API，返回可插入链接 / 引用文档的 SuggestionItem。

- `AISource`
  - 调用 AI 接口返回“改写本文”、“生成摘要”等操作型 SuggestionItem。

### 6.3 控制器对数据源的兼容性处理

- 对远程 Source 做：
  - debounce（例如 200–300ms）。
  - 超时控制与取消（query 变更时中断旧请求）。
  - 异常捕获，将错误转成 UI 友好的 message。

---

## 7. 实施阶段建议

### 阶段 1：单一 Trigger + 本地 Slash 菜单（无后端）

- 只实现：
  - 插件层：识别 `/`，维护基本 `SuggestionState`。
  - 控制器层：绑定 `/` → 单一 `SlashMenuSource`。
  - UI 层：最简单的列表菜单（无分组、无图标也可以）。
- 目标：在空行输入 `/`，出现菜单，选择后能修改/插入块。

### 阶段 2：抽象控制器 & UI 组件

- 把 Suggestion UI 抽成复用组件（与 `selection-toolbar` 分离，但共用 Floating UI）。
- 控制器支持多个 Trigger 配置（但最初仍可只用 `/`）。

### 阶段 3：接入远程数据源

- 为某个 Trigger（例如 `/search` 或 `@mention`）增加远程 Source。
- 实现 debounce / cancel / error UI。

### 阶段 4：多 Trigger 与多 UI 模式

- 为 `@`、`:` 等增加 Trigger 和不同 UI 类型（列表 / 网格）。
- 支持程序化打开（如按钮点击打开 emoji picker 或 AI 菜单）。

---

## 8. 与现有 `selection-toolbar` 的关系

- 可复用的部分：
  - Floating UI 封装（定位、滚动处理、Portal）。
  - 键盘导航与焦点管理逻辑。
  - 样式体系（主题、色彩、阴影等）。

- 不同点：
  - `selection-toolbar`：由“选区是否存在”驱动；
  - `SuggestionMenu`：由“触发字符 + query 状态机”驱动。

**建议**：将共用的浮层定位/样式抽象成一个“小的 UI 基础层”，`selection-toolbar` 和 `SuggestionMenu` 都基于它构建。
