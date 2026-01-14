## Tiptap 二次开发概述

本报告主要说明了我基于官方 tiptap 项目新增和修改的地方

**主要变化**：
- 原始代码：扁平结构，所有组件在根目录下
- 自定义编辑器：Monorepo 结构，使用 `packages/` 目录组织代码

---

### 原始官方组件路径

#### 1. Icons (图标组件)
- **位置**: `tiptap-editor/packages/tiptap-comps/src/icons/`
- **变化**: 图标数量从 37 个增加到 43 个
- **新增图标**: `check-icon.tsx`, `edit-icon.tsx`, `locate-icon.tsx`, `sparkles-icon.tsx`, `text-format-icon.tsx`, `x-icon.tsx`

#### 2. UI Components (UI组件)
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

#### 3. UI Primitives (基础UI组件)
- **位置**: `tiptap-editor/packages/tiptap-comps/src/ui/`
- **结构**: 保持不变

#### 4. Node Styles (节点样式)
- **位置**: `tiptap-editor/packages/tiptap-styles/src/tiptap-node/`

#### 5. Styles (样式文件)
- **位置**: `tiptap-editor/packages/tiptap-styles/src/styles/`
- **文件**: `_keyframe-animations.scss`, `_variables.scss`
- **新增**: `_editor.scss`, `index.scss`

#### 6. Hooks (钩子函数)
- **位置**: `tiptap-editor/packages/tiptap-api/src/react/hooks/`
- **新增 hooks**:
  - `use-hover-detection.ts`
  - `use-markdown-outline.ts`
  - `use-selection.ts`
  - `storage/use-auto-save.ts`
  - `storage/use-storage-save.ts`

#### 7. Lib (工具库)
- **位置**: `tiptap-editor/packages/tiptap-config/src/utils/`

---

### 新增的内容

##### `tiptap-ai/`
- AI 功能集成包
- 包含：`AIOrchestrator.ts`, `EditorIntegration.ts`, `PreviewController.ts`, `TiptapEditorBridge.ts` 等

##### `tiptap-api/`
- API 和 hooks 包
- 包含：数据操作、存储引擎、React hooks

##### `tiptap-comment/`
- 评论功能包
- 包含：评论存储、同步、导出等功能

##### `tiptap-config/`
- 配置包
- 包含：常量定义、工具函数
- **重要**: 这是原始 `lib/tiptap-utils.ts` 的重构版本，被拆分为多个模块化文件

##### `tiptap-editor-core/`
- 编辑器核心包
- 包含：扩展定义、编辑器核心逻辑

##### `tiptap-speaker-node/`
- 说话者节点扩展
- 用于标记对话中的说话者

##### `tiptap-styles/`
- 样式包
- 整合了所有样式文件和节点样式

##### `tiptap-trigger/`
- 触发器包
- 包含：建议插件、扩展等
