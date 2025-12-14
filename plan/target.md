# Tiptap 包结构重构计划

## 目标

将现有的 `tiptap-styles` 和 `tiptap-comps` 按职责拆分为三个清晰的包：

- `tiptap-ui`: 基础 UI 组件库（Button, Badge, Card, Input 等）
- `tiptap-components`: Tiptap 业务组件（HeadingButton, MarkButton, SelectionToolbar 等）
- `tiptap-styles`: 纯样式和主题（主题变量、节点样式、全局样式）

## 新包结构

### 1. tiptap-ui (基础组件库)

```
packages/tiptap-ui/
├── src/
│   ├── components/          # 基础组件
│   │   ├── badge/
│   │   ├── button/
│   │   ├── card/
│   │   ├── dropdown-menu/
│   │   ├── input/
│   │   ├── popover/
│   │   ├── separator/
│   │   ├── spacer/
│   │   ├── toolbar/
│   │   └── tooltip/
│   ├── icons/              # 图标组件
│   ├── hooks/              # 通用 hooks
│   │   ├── use-composed-ref.ts
│   │   ├── use-menu-navigation.ts
│   ├── utils/              # 工具函数
│   └── styles/             # 基础样式
│       └── index.scss
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### 2. tiptap-components (业务组件)

```
packages/tiptap-components/
├── src/
│   ├── buttons/            # Tiptap 业务按钮
│   │   ├── blockquote-button/
│   │   ├── code-block-button/
│   │   ├── color-highlight-button/
│   │   ├── heading-button/
│   │   ├── image-upload-button/
│   │   ├── list-button/
│   │   ├── mark-button/
│   │   ├── text-align-button/
│   │   └── undo-redo-button/
│   ├── popovers/           # 业务弹窗
│   │   ├── color-highlight-popover/
│   │   └── link-popover/
│   ├── dropdown-menus/     # 业务下拉菜单
│   │   ├── heading-dropdown-menu/
│   │   └── list-dropdown-menu/
│   ├── toolbars/           # 工具栏组件
│   │   ├── header-toolbar/
│   │   ├── theme-toggle/
│   │   └── toolbar-mobile-content/
│   ├── selection-toolbar/  # 选中工具栏（从 tiptap-comps 迁移）
│   └── outline-button/     # 大纲按钮
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### 3. tiptap-styles (纯样式)

```
packages/tiptap-styles/
├── src/
│   ├── themes/             # 主题变量
│   │   ├── _variables.scss
│   │   └── index.scss
│   ├── tiptap-node/        # Tiptap 节点样式
│   │   ├── blockquote-node/
│   │   ├── code-block-node/
│   │   ├── heading-node/
│   │   ├── horizontal-rule-node/
│   │   ├── image-node/
│   │   ├── image-upload-node/
│   │   ├── link-node/
│   │   ├── list-node/
│   │   └── paragraph-node/
│   ├── editor.scss         # 编辑器全局样式
│   └── keyframe-animations.scss
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 文件迁移映射

### tiptap-ui 迁移内容

- `tiptap-styles/src/ui/badge/` → `tiptap-ui/src/components/badge/`
- `tiptap-styles/src/ui/button/` → `tiptap-ui/src/components/button/`
- `tiptap-styles/src/ui/card/` → `tiptap-ui/src/components/card/`
- `tiptap-styles/src/ui/dropdown-menu/` → `tiptap-ui/src/components/dropdown-menu/`
- `tiptap-styles/src/ui/input/` → `tiptap-ui/src/components/input/`
- `tiptap-styles/src/ui/popover/` → `tiptap-ui/src/components/popover/`
- `tiptap-styles/src/ui/separator/` → `tiptap-ui/src/components/separator/`
- `tiptap-styles/src/ui/spacer/` → `tiptap-ui/src/components/spacer/`
- `tiptap-styles/src/ui/toolbar/` → `tiptap-ui/src/components/toolbar/`
- `tiptap-styles/src/ui/tooltip/` → `tiptap-ui/src/components/tooltip/`
- `tiptap-styles/src/icons/` → `tiptap-ui/src/icons/`
- `tiptap-styles/src/hooks/` → `tiptap-ui/src/hooks/`
- `tiptap-styles/src/utils/` → `tiptap-ui/src/utils/`
- `tiptap-styles/src/styles/` → `tiptap-ui/src/styles/`

### tiptap-components 迁移内容

- `tiptap-styles/src/ui/tiptap-ui/blockquote-button/` → `tiptap-components/src/buttons/blockquote-button/`
- `tiptap-styles/src/ui/tiptap-ui/code-block-button/` → `tiptap-components/src/buttons/code-block-button/`
- `tiptap-styles/src/ui/tiptap-ui/color-highlight-button/` → `tiptap-components/src/buttons/color-highlight-button/`
- `tiptap-styles/src/ui/tiptap-ui/heading-button/` → `tiptap-components/src/buttons/heading-button/`
- `tiptap-styles/src/ui/tiptap-ui/image-upload-button/` → `tiptap-components/src/buttons/image-upload-button/`
- `tiptap-styles/src/ui/tiptap-ui/list-button/` → `tiptap-components/src/buttons/list-button/`
- `tiptap-styles/src/ui/tiptap-ui/mark-button/` → `tiptap-components/src/buttons/mark-button/`
- `tiptap-styles/src/ui/tiptap-ui/text-align-button/` → `tiptap-components/src/buttons/text-align-button/`
- `tiptap-styles/src/ui/tiptap-ui/undo-redo-button/` → `tiptap-components/src/buttons/undo-redo-button/`
- `tiptap-styles/src/ui/tiptap-ui/color-highlight-popover/` → `tiptap-components/src/popovers/color-highlight-popover/`
- `tiptap-styles/src/ui/tiptap-ui/link-popover/` → `tiptap-components/src/popovers/link-popover/`
- `tiptap-styles/src/ui/tiptap-ui/heading-dropdown-menu/` → `tiptap-components/src/dropdown-menus/heading-dropdown-menu/`
- `tiptap-styles/src/ui/tiptap-ui/list-dropdown-menu/` → `tiptap-components/src/dropdown-menus/list-dropdown-menu/`
- `tiptap-styles/src/ui/tiptap-ui/toolbar/` → `tiptap-components/src/toolbars/`
- `tiptap-styles/src/ui/tiptap-ui/outline-button/` → `tiptap-components/src/outline-button/`
- `tiptap-comps/src/select-toolbar/` → `tiptap-components/src/selection-toolbar/`

### tiptap-styles 保留内容

- `tiptap-styles/src/styles/_variables.scss` → `tiptap-styles/src/themes/_variables.scss`
- `tiptap-styles/src/styles/_editor.scss` → `tiptap-styles/src/editor.scss`
- `tiptap-styles/src/styles/_keyframe-animations.scss` → `tiptap-styles/src/keyframe-animations.scss`
- `tiptap-styles/src/tiptap-node/` → `tiptap-styles/src/tiptap-node/` (保持不变)

## 导入路径更新映射

### 旧路径 → 新路径

- `tiptap-styles/ui` → `tiptap-ui/components` (基础组件)
- `tiptap-styles/icons` → `tiptap-ui/icons`
- `tiptap-styles/utils` → `tiptap-ui/utils`
- `tiptap-styles/ui` (tiptap-ui 子目录) → `tiptap-components` (业务组件)
- `tiptap-styles/tiptap-node` → `tiptap-styles/tiptap-node` (保持不变)
- `tiptap-comps` → `tiptap-components` (SelectionToolbar)

## 实施步骤

### 阶段 1: 创建新包结构

1. 创建 `packages/tiptap-ui/` 目录结构
2. 创建 `packages/tiptap-components/` 目录结构
3. 创建新包的 `package.json`、`vite.config.ts`、`tsconfig.json`

### 阶段 2: 迁移文件

1. 迁移基础组件到 `tiptap-ui`
2. 迁移业务组件到 `tiptap-components`
3. 迁移样式文件到新的 `tiptap-styles`
4. 更新所有文件内的相对导入路径

### 阶段 3: 更新包配置

1. 更新 `tiptap-ui/package.json` 的依赖和导出
2. 更新 `tiptap-components/package.json` 的依赖和导出
3. 更新 `tiptap-styles/package.json` 的依赖和导出
4. 更新所有包的 `vite.config.ts` 构建配置

### 阶段 4: 更新依赖关系

1. 更新根 `package.json` 的依赖
2. 更新 `tiptap-ai/package.json` 的依赖
3. 更新 `tiptap-comment/package.json` 的依赖
4. 更新 `tiptap-trigger/package.json` 的依赖
5. 更新 `tiptap-comps/package.json` (将被删除，但需要先更新依赖)

### 阶段 5: 更新导入路径

1. 更新 `tsconfig.app.json` 的路径映射
2. 更新所有源文件中的导入语句（26 个文件）
3. 更新组件内部的相对导入路径

### 阶段 6: 清理和验证

1. 删除旧的 `tiptap-comps` 包（迁移完成后）
2. 删除旧的 `tiptap-styles` 包（迁移完成后）
3. 运行构建测试
4. 运行类型检查
5. 验证所有导入路径正确

## 关键文件清单

### 需要更新的导入文件（26 个）

- `src/playground/editor-ui.tsx`
- `src/components/my-ui/selection-test-button.tsx`
- `src/components/my-ui/scroll-test-button.tsx`
- `src/components/my-ui/operate-test-dropdown-menu.tsx`
- `src/playground/utils/click-handlers.ts`
- `src/playground/extensions.ts`
- `packages/tiptap-ai/src/react/ai-button.tsx`
- `packages/tiptap-ai/src/react/ai-input-popover.tsx`
- `packages/tiptap-ai/src/react/ai-action-panel.tsx`
- `packages/tiptap-comment/src/react/comment-button.tsx`
- `packages/tiptap-comment/src/react/comment-sidebar.tsx`
- `packages/tiptap-comment/src/react/comment-main.tsx`
- `packages/tiptap-comment/src/react/components/comment-edit-dialog.tsx`
- `packages/tiptap-comment/src/react/components/reply-dialog.tsx`
- `packages/tiptap-comment/src/react/components/comment-item.tsx`
- `packages/tiptap-comment/src/react/comment-button.types.ts`
- `packages/tiptap-trigger/src/sources/slash-source.ts`
- `packages/tiptap-comps/src/select-toolbar/index.tsx` (迁移时更新)

### 需要创建的配置文件

- `packages/tiptap-ui/package.json`
- `packages/tiptap-ui/vite.config.ts`
- `packages/tiptap-ui/tsconfig.json`
- `packages/tiptap-components/package.json`
- `packages/tiptap-components/vite.config.ts`
- `packages/tiptap-components/tsconfig.json`
- 更新 `packages/tiptap-styles/package.json`
- 更新 `packages/tiptap-styles/vite.config.ts`

## 依赖关系图

```
tiptap-ui (基础组件)
  ├── 无内部依赖（仅 peerDependencies）
  └── 被以下包依赖：
      ├── tiptap-components
      ├── tiptap-ai
      ├── tiptap-comment
      ├── tiptap-trigger
      └── tiptap-editor (根包)

tiptap-components (业务组件)
  ├── 依赖: tiptap-ui, tiptap-api, tiptap-config
  └── 被以下包依赖：
      └── tiptap-editor (根包)

tiptap-styles (样式)
  ├── 无依赖（纯样式）
  └── 被以下包依赖：
      ├── tiptap-ui (导入样式)
      ├── tiptap-components (导入样式)
      └── tiptap-editor (根包)
```

## 注意事项

1. **保持向后兼容性**: 在迁移过程中，可以考虑暂时保留旧包并添加废弃警告，但本计划采用直接迁移方式
2. **样式导入**: 确保所有样式文件正确导入，特别是 SCSS 文件的相对路径
3. **类型导出**: 确保所有 TypeScript 类型正确导出
4. **构建顺序**: 需要按照依赖顺序构建（tiptap-ui → tiptap-components → 其他）
5. **测试验证**: 每个阶段完成后进行构建和类型检查验证