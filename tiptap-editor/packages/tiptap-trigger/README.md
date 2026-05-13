# tiptap-trigger

Slash 命令和建议菜单框架：监听触发字符，弹出可搜索的命令面板。

## 导出

| 导出 | 说明 |
|------|------|
| `SuggestionTrigger` | Tiptap 扩展，监听 `/` 等触发字符 |
| `SlashMenuSource` | 内置 slash 命令源（标题、段落、列表、引用、mermaid 等） |
| `createBasicSlashItems` | 基础命令项工厂 |
| `getSuggestionPluginAPI` | 获取 plugin 实例的 API |

## React

```ts
import { SuggestionMenu, useSuggestion } from 'tiptap-trigger/react'
```

| 导出 | 说明 |
|------|------|
| `SuggestionMenu` | 建议菜单 UI 组件 |
| `useSuggestion` | 建议状态管理 hook |
| `useSuggestionKeyboard` | 键盘导航 hook |

## 依赖

`tiptap-api` `tiptap-utils`
