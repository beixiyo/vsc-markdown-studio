# 扩展实现指南

## 扩展来源分类

### 1. Tiptap Core 自带扩展（来自 `@tiptap/core`）

这些是 Tiptap 核心包提供的**内置扩展**，通过 `extensions` 对象导出：

```typescript
import { extensions } from "@tiptap/core";

// 这些扩展来自 @tiptap/core 的 extensions 对象
extensions.ClipboardTextSerializer  // Tiptap 核心：剪贴板文本序列化
extensions.Commands                  // Tiptap 核心：命令系统
extensions.Editable                  // Tiptap 核心：使编辑器可编辑 ⚠️ 最关键
extensions.FocusEvents              // Tiptap 核心：处理焦点事件
extensions.Tabindex                 // Tiptap 核心：Tab 键导航
```

**来源**：`@tiptap/core` 包的内置扩展，是 Tiptap 框架的基础功能。

**是否需要安装**：✅ 不需要额外安装，`@tiptap/core` 已包含。

---

### 2. Tiptap 官方扩展包（来自 `@tiptap/extension-*`）

这些是 Tiptap 官方提供的**独立扩展包**，需要单独安装：

```typescript
import { Gapcursor } from "@tiptap/extension-gapcursor";  // 需要安装 @tiptap/extension-gapcursor
import { Link } from "@tiptap/extension-link";            // 需要安装 @tiptap/extension-link
import { Text } from "@tiptap/extension-text";            // 需要安装 @tiptap/extension-text
```

**来源**：Tiptap 官方维护的扩展包，发布在 npm 上。

**是否需要安装**：⚠️ **需要安装对应的包**：
- `@tiptap/extension-gapcursor`
- `@tiptap/extension-link`
- `@tiptap/extension-text`

---

### 3. BlockNote 自己实现的扩展

这些是 BlockNote 团队**自己实现**的扩展，通常是对 Tiptap 扩展的定制或完全自研：

#### 3.1 Tiptap 扩展的定制版本（在 `tiptap-extensions/` 目录）

```typescript
// BlockNote 自己实现的 Tiptap 扩展
import { UniqueID } from "../../../extensions/tiptap-extensions/UniqueID/UniqueID";
import { HardBreak } from "../../../extensions/tiptap-extensions/HardBreak/HardBreak";
import { KeyboardShortcutsExtension } from "../../../extensions/tiptap-extensions/KeyboardShortcuts/KeyboardShortcutsExtension";
import { TextColorExtension } from "../../../extensions/tiptap-extensions/TextColor/TextColorExtension";
import { BackgroundColorExtension } from "../../../extensions/tiptap-extensions/BackgroundColor/BackgroundColorExtension";
import { TextAlignmentExtension } from "../../../extensions/tiptap-extensions/TextAlignment/TextAlignmentExtension";
import { SuggestionAddMark, SuggestionDeleteMark, SuggestionModificationMark } from "../../../extensions/tiptap-extensions/Suggestions/SuggestionMarks";
```

**特点**：
- `UniqueID`: 基于 Tiptap Pro 的 UniqueID 扩展改编（注释说明）
- `HardBreak`: Tiptap HardBreak 扩展的简化版本（移除了键盘快捷键等）
- `KeyboardShortcutsExtension`: BlockNote 自己实现的键盘快捷键系统
- `TextColorExtension`, `BackgroundColorExtension`, `TextAlignmentExtension`: BlockNote 自己实现的样式扩展
- `SuggestionMarks`: BlockNote 自己实现的建议标记（用于协作编辑）

**来源**：BlockNote 代码库中 `packages/core/src/extensions/tiptap-extensions/` 目录。

#### 3.2 BlockNote 扩展（在 `extensions/` 目录）

```typescript
// BlockNote 自己实现的扩展（不是 Tiptap 扩展，是 BlockNote Extension）
import { HistoryExtension } from "../../../extensions/History/History";
import { PlaceholderExtension } from "../../../extensions/Placeholder/Placeholder";
import { ShowSelectionExtension } from "../../../extensions/ShowSelection/ShowSelection";
import { TrailingNodeExtension } from "../../../extensions/TrailingNode/TrailingNode";
import { BlockChangeExtension } from "../../../extensions/BlockChange/BlockChange";
import { SuggestionMenu } from "../../../extensions/SuggestionMenu/SuggestionMenu";
import { SideMenuExtension } from "../../../extensions/SideMenu/SideMenu";
import { FormattingToolbarExtension } from "../../../extensions/FormattingToolbar/FormattingToolbar";
// ... 等等
```

**特点**：
- 这些是 BlockNote 的扩展系统（不是 Tiptap 扩展）
- 使用 `createExtension()` 创建
- 可以包含 ProseMirror 插件、命令等
- 例如 `HistoryExtension` 使用 ProseMirror 的 `history()` 插件

**来源**：BlockNote 代码库中 `packages/core/src/extensions/` 目录。

#### 3.3 剪贴板扩展（BlockNote 自己实现）

```typescript
import { createCopyToClipboardExtension } from "../../../api/clipboard/toClipboard/copyExtension";
import { createPasteFromClipboardExtension } from "../../../api/clipboard/fromClipboard/pasteExtension";
import { createDropFileExtension } from "../../../api/clipboard/fromClipboard/fileDropExtension";
```

**来源**：BlockNote 代码库中 `packages/core/src/api/clipboard/` 目录。

---

### 4. ProseMirror 插件（底层）

某些扩展内部使用 ProseMirror 插件：

```typescript
// HistoryExtension 使用 ProseMirror 的 history 插件
import { history, redo, undo } from "@tiptap/pm/history";

// PlaceholderExtension 使用 ProseMirror 的 Plugin
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
```

**来源**：ProseMirror 核心库（通过 `@tiptap/pm/*` 或 `prosemirror-*` 包提供）。

---

## 完整分类表

| 扩展名称 | 来源 | 是否需要安装 | 位置 |
|---------|------|------------|------|
| `extensions.Editable` | Tiptap Core | ❌ 已包含 | `@tiptap/core` |
| `extensions.FocusEvents` | Tiptap Core | ❌ 已包含 | `@tiptap/core` |
| `extensions.Tabindex` | Tiptap Core | ❌ 已包含 | `@tiptap/core` |
| `extensions.Commands` | Tiptap Core | ❌ 已包含 | `@tiptap/core` |
| `extensions.ClipboardTextSerializer` | Tiptap Core | ❌ 已包含 | `@tiptap/core` |
| `Gapcursor` | Tiptap 官方包 | ✅ 需要 | `@tiptap/extension-gapcursor` |
| `Link` | Tiptap 官方包 | ✅ 需要 | `@tiptap/extension-link` |
| `Text` | Tiptap 官方包 | ✅ 需要 | `@tiptap/extension-text` |
| `UniqueID` | BlockNote 实现 | ❌ 已包含 | `packages/core/src/extensions/tiptap-extensions/UniqueID/` |
| `HardBreak` | BlockNote 实现 | ❌ 已包含 | `packages/core/src/extensions/tiptap-extensions/HardBreak/` |
| `KeyboardShortcutsExtension` | BlockNote 实现 | ❌ 已包含 | `packages/core/src/extensions/tiptap-extensions/KeyboardShortcuts/` |
| `HistoryExtension` | BlockNote 实现 | ❌ 已包含 | `packages/core/src/extensions/History/` |
| `PlaceholderExtension` | BlockNote 实现 | ❌ 已包含 | `packages/core/src/extensions/Placeholder/` |
| `TrailingNodeExtension` | BlockNote 实现 | ❌ 已包含 | `packages/core/src/extensions/TrailingNode/` |
| `ShowSelectionExtension` | BlockNote 实现 | ❌ 已包含 | `packages/core/src/extensions/ShowSelection/` |
| `createCopyToClipboardExtension` | BlockNote 实现 | ❌ 已包含 | `packages/core/src/api/clipboard/toClipboard/` |
| `createPasteFromClipboardExtension` | BlockNote 实现 | ❌ 已包含 | `packages/core/src/api/clipboard/fromClipboard/` |
| `createDropFileExtension` | BlockNote 实现 | ❌ 已包含 | `packages/core/src/api/clipboard/fromClipboard/` |
