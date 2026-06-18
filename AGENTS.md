# Tiptap 二次开发概述

本报告主要说明了我基于官方 tiptap 项目新增和修改的地方

**主要变化**：
- 原始代码：扁平结构，所有组件在根目录下
- 自定义编辑器：Monorepo 结构，使用 `packages/` 目录组织代码

---

## 设计 Token 系统

### 设计 Token 配置

项目使用 **TailwindCSS** 作为样式系统，设计 Token 定义在 `tailwind.config.js` 中

### Token 同步机制

设计 Token 的同步流程：

1. **源文件**：`packages/styles/variable.ts`
   - 定义所有设计 Token（颜色、间距等）
   - 包含 `light` 和 `dark` 两种主题配置

2. **自动同步**：通过 Vite 插件 `@jl-org/js-to-style` 实现
   - 自动将 `packages/styles/variable.ts` 中的 Token 同步到 `packages/styles/css/autoVariables.css`
   - 生成 CSS 变量（`--variableName` 格式）

3. **Tailwind 配置**：`tailwind.config.js`
   - 使用 CSS 变量引用设计 Token
   - 格式：`rgb(var(--variableName) / <alpha-value>)`
   - 支持透明度控制（通过 `<alpha-value>` 占位符）

### 使用规范

- ✅ **优先使用 Tailwind Token**：使用 `tailwind.config.js` 中定义的颜色类名
  - 例如：`bg-background2`、`text-systemOrange`、`border-border`
- ✅ **自动适配深色模式**：所有 Token 都支持深色模式自动切换
- ❌ **避免硬编码颜色**：不要直接使用 `#ffffff`、`rgba()` 等硬编码颜色值
- ❌ **不要手动修改 CSS 变量文件**：`packages/styles/css/autoVariables.css` 是自动生成的，不要手动编辑

### 常用 Token 示例

```tsx
// 背景色
<div className="bg-background2" />        // 次要背景
<div className="bg-systemOrange/10" />           // 橙色背景，10% 透明度

// 文字颜色
<span className="text-text" />            // 主要文字
<span className="text-text2" />          // 次要文字（70% 透明度）
<span className="text-systemOrange" />           // 系统橙色

// 边框
<div className="border border-border" />         // 标准边框
<div className="border-systemOrange" />          // 橙色边框
```

---


## 原始官方组件路径

### 1. Icons (图标组件)
- **位置**: `tiptap-editor/packages/tiptap-comps/src/icons/`
- **变化**: 图标数量从 37 个增加到 43 个
- **新增图标**: `check-icon.tsx`, `edit-icon.tsx`, `locate-icon.tsx`, `sparkles-icon.tsx`, `text-format-icon.tsx`, `x-icon.tsx`

### 2. UI Components (UI 组件)
- **位置**: `tiptap-editor/packages/tiptap-comps/src/tiptap-ui/`
- **新增组件**:
  - `outline-button/` - 大纲按钮组件
  - `selection-toolbar-content/` - 选中文本工具栏内容组件，提供常用的文本格式化功能预设（包含撤销/重做、文本格式、文本样式、高亮、代码块、角标、对齐、图片等）
  - `text-format-dropdown-menu/` - 文本格式下拉菜单组件（包含 `text-format-dropdown-menu.tsx`, `use-text-format-dropdown-menu.ts`）
    - 支持 Level 1-6 的标题级别配置（`headingLevels` 类型为 `Level[]`，默认值 `[1, 2, 3]`）
  - `text-align-dropdown-menu/` - 文本对齐下拉菜单组件，统一管理文本对齐选项
  - `toolbar/` - 工具栏组件（包含 `header-toolbar.tsx`, `theme-toggle.tsx`, `toolbar-mobile-content.tsx`）
    - `header-toolbar.tsx` 已重构：统一使用合并的下拉菜单（`TextFormatDropdownMenu` 和 `TextAlignDropdownMenu`）替代分离的组件
- **已删除组件**:
  - `heading-dropdown-menu/` - 已被 `TextFormatDropdownMenu` 替代
  - `list-dropdown-menu/` - 已被 `TextFormatDropdownMenu` 替代

### 3. 基础 UI（Button、Popover、Badge 等）
- **位置**: 已迁移到 workspace 的 **`comps`** 包（`packages/comps`）
- tiptap-comps 内所有 UI 组件从 `comps` 导入使用，不再维护 `tiptap-comps/src/ui/` 目录

### 4. 选中文本工具栏 (Select Toolbar)
- **位置**: `tiptap-editor/packages/tiptap-comps/src/select-toolbar/`
- **内容**: `SelectionToolbar` 组件、`useSelectionToolbar`，与 `comps` 的 `Popover` 配合使用

### 5. Node Extensions (节点扩展)
- **位置**: `tiptap-editor/packages/tiptap-nodes/src/`
- **内容**: 整合了通用自定义节点扩展（如 ImageUpload、Image、CodeBlock、GradientHighlight 等）

### 6. Hooks (钩子函数)
- **位置**: `tiptap-editor/packages/tiptap-api/src/react/hooks/`
- **新增 hooks**:
  - `use-hover-detection.ts`
  - `use-markdown-outline.ts`
  - `use-selection.ts`
  - `storage/use-auto-save.ts`
  - `storage/use-storage-save.ts`

### 7. Lib (工具库)
- **位置**: `tiptap-editor/packages/tiptap-utils/src/utils/`

---

## 新增的内容

#### `tiptap-ai/`
- AI 功能集成包
- 包含：`AIOrchestrator.ts`, `EditorIntegration.ts`, `PreviewController.ts`, `TiptapEditorBridge.ts` 等

#### `tiptap-api/`
- API 和 hooks 包
- 包含：数据操作、存储引擎、React hooks

#### `tiptap-comment/`
- 评论功能包
- 包含：评论存储、同步、导出等功能

#### `tiptap-utils/`
- 配置包
- 包含：常量定义、工具函数
- **重要**: 这是原始 `lib/tiptap-utils.ts` 的重构版本，被拆分为多个模块化文件

#### `tiptap-editor-core/`
- 编辑器核心包
- 包含：扩展定义、编辑器核心逻辑

#### `tiptap-nodes/`
- 自定义节点扩展包
- 包含：ImageUpload、Image、CodeBlock、GradientHighlight 等节点实现

#### `tiptap-trigger/`
- 触发器包
- 包含：建议插件、扩展等

---

## 插件开发踩坑（自定义节点 / NodeView）

> 以下是开发自定义节点时验证过的通用坑点，适用于任何依赖 NodeView、节点 attrs、Markdown token 或 DOM data 属性的扩展

### 1. `extension.options` 更适合做初始化配置，不适合做运行时状态

Tiptap 里 `editor.extensionManager.extensions.find(...).options` 可能是 getter，每次访问未必返回同一个对象。不要依赖运行时改 `ext.options` 来驱动重渲染：

```js
ext.options === ext.options          // 可能是 false
ext.options.runtimeMap = newMap      // 可能写到临时对象
read(ext.options.runtimeMap)         // 下一次读取可能仍是初始化值
```

`configure({...})` 传入的配置应视为初始化常量。需要动态变化、可持久化、可触发 NodeView 更新的数据，应放到节点 `attrs` 或外部受控状态里

### 2. 可变显示数据优先放节点 `attrs`

只有节点 `attrs` 是 ProseMirror 能可靠追踪、并触发 `NodeView.update()` 的来源：

```js
editor.view.dispatch(
  editor.state.tr.setNodeMarkup(pos, undefined, {
    ...node.attrs,
    label: nextLabel,
  })
)
```

这类更新会进入 ProseMirror transaction，NodeView 能收到 `update(newNode)`，序列化和撤销栈也更容易保持一致

### 3. 多来源取值要明确优先级，节点级来源应优先

如果同一个展示值可能来自 `attrs`、`options`、默认文案或外部 map，优先级要固定，并优先使用节点级来源：

```js
function resolveDisplayText(attrs, options) {
  if (attrs.label) return attrs.label
  if (options.initialMap?.[attrs.key]?.label) return options.initialMap[attrs.key].label
  return attrs.key
}
```

原因是 `attrs` 代表文档内最新、可追踪的数据；`options` 更适合作为初始化兜底。测试时要覆盖“初始化来源本来有值，随后 attrs 更新”的真实数据形态，避免假性通过

### 4. `NodeView.update()` 只会执行你写的更新逻辑

`update()` 不会自动同步 DOM。凡是后续点击、解析、复制或测试会从 DOM 读的内容，都要在 `update()` 里同步：

```js
update(newNode) {
  node = newNode
  dom.textContent = resolveDisplayText(newNode.attrs, options)
  dom.setAttribute('data-key', newNode.attrs.key)

  if (newNode.attrs.label) {
    dom.setAttribute('data-label', newNode.attrs.label)
  }
  else {
    dom.removeAttribute('data-label')
  }

  return true
}
```

只改 `textContent` 不够；`data-*`、className、style、aria 属性等也要跟着当前 attrs 一起更新，否则下一次交互可能读到过期 DOM 状态
