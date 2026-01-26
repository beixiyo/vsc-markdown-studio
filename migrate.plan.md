基于对 `tiptap-editor` 源码和你的设计 Token 系统的深入分析，我为你整理了这份迁移映射报告和执行计划。

你的设计系统（基于 `variable.ts`）非常简洁直观，完全可以覆盖并精简 Tiptap 冗余的变量体系。

### 1. 核心映射结论 (Conclusion)

#### 基础布局与颜色
| Tiptap 旧变量 (`--tt-*`) | 你的设计 Token (`--*`) | Tailwind 类名 | 迁移逻辑 |
| :--- | :--- | :--- | :--- |
| `--tt-bg-color` | `--background` | `bg-background` | 主背景 |
| `--tt-sidebar-bg-color` | `--backgroundSecondary` | `bg-backgroundSecondary` | 侧边栏/次要背景 |
| `--tt-card-bg-color` | `--background` | `bg-background` | 卡片背景通常跟随主色 |
| `--tt-border-color` | `--border` | `border-border` | 标准边框 |
| `--tt-border-color-tint`| `--borderSecondary` | `border-borderSecondary`| 浅色边框/分割线 |
| `--tt-brand-color-500` | `--brand` | `text-brand` / `bg-brand` | 品牌主色 |
| `--tt-selection-color` | `--brand` (0.2 alpha) | `bg-brand/20` | 选区颜色 |

#### 文字分级 (Text Hierarchy)
| Tiptap 旧变量 | 你的设计 Token | Tailwind 类名 | 映射说明 |
| :--- | :--- | :--- | :--- |
| `--text-color-primary` | `--textPrimary` | `text-textPrimary` | 正文/标题 |
| `--text-color-secondary`| `--textSecondary` | `text-textSecondary` | 次要文字 (70% alpha) |
| `--tt-color-text-gray` | `--textSecondary` | `text-textSecondary` | Tiptap 的灰色文字 |
| `--text-color-disabled` | `--textDisabled` | `text-textDisabled` | 禁用/占位符 |

#### 样式预设 (Shadow & Radius)
| Tiptap 旧变量 | 你的 Token / Tailwind 内置 | 建议方案 |
| :--- | :--- | :--- |
| `--tt-radius-md` (8px) | `rounded-lg` (8px) | **优先用 Tailwind 内置**，符合直觉 |
| `--tt-radius-xs` (4px) | `rounded` (4px) | Tailwind `rounded` 默认即 4px |
| `--tt-shadow-elevated-md`| `shadow-card` | 使用你 `tailwind.config.js` 定义的 `shadow-card` |

---

### 2. 执行计划 (Execution Plan)

#### 阶段一：建立兼容桥接层 (Compatibility Bridge)
修改 `tiptap-editor/packages/tiptap-styles/src/styles/_variables.scss`，将旧的 `--tt-` 变量直接指向你的新变量。
- **目的**：在不改动成百上千处代码的前提下，立即让编辑器应用你的色系，防止样式崩坏。
- **操作**：移除旧的 hardcoded 颜色（如 `rgba(37, 39, 45, 0.1)`），改为 `var(--border)` 等。

#### 阶段二：组件 Tailwind 化 (Tailwind Refactoring)
系统性替换 `.tsx` 文件中的 `var(--tt-*)` 写法。
- **重点优化**：将 `bg-[var(--tt-bg-color)]` 这种繁杂写法替换为 `bg-background`。
- **处理 Toning 系统**：利用你已有的 `.toning-yellow` 等类名，替换 Tiptap 复杂的 `highlight` 变量逻辑。

#### 阶段三：节点样式收敛 (Node Style Cleanup)
更新 `packages/tiptap-styles/src/tiptap-node/` 下的各节点 SCSS。
- 使用 `@apply` 引用你的设计 Token，确保编辑器内部元素（如代码块、引用块）与外部 UI 视觉统一。

---

### 3. 迁移注意事项 (Notes)

1.  **透明度魔法**：你的 Tailwind 配置支持 `rgb(var(--brand) / <alpha-value>)`。这意味着你可以直接写 `text-textPrimary/50` 来实现 Tiptap 那些繁琐的 `a-100`, `a-200` 等透明度变量。
2.  **避免混合使用**：既然要迁移，就彻底弃用 `var(--tt-*)`。如果发现你的 Token 系统缺少某种状态色（如特定的 Hover 浅灰色），建议在 `variable.ts` 中增加 `backgroundQuaternary` 等语义化 Token，而不是回退到 hardcode。
3.  **内置样式优先**：Tiptap 很多 radius 和 spacing 是手动定义的，迁移时**优先选择 Tailwind 标准类**（如 `rounded-lg`, `p-4`, `gap-2`），这比维护一套 `var(--tt-radius-md)` 更符合现代开发直觉。
4.  **深色模式**：由于你的 Token 系统已经通过 `autoVariables.css` 自动处理了 `.dark` 类，迁移完成后，编辑器将天然获得完美的深色模式支持，无需额外写 `dark:` 前缀。

**下一步建议**：我先为你生成 Phase 1 的变量桥接代码，你可以检查一下映射关系是否符合你的“直觉”？