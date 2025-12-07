# @blocknote/core 包架构文档

## 概述

`@blocknote/core` 是 BlockNote 项目的核心包，提供了一个基于块的富文本编辑器框架。它构建在 Prosemirror 和 Tiptap 之上，采用模块化设计，支持高度可扩展的块式编辑体验。

## 核心能力

1.  **块式编辑**：Notion 风格的块级内容管理
2.  **可扩展架构**：支持自定义块类型、内联内容类型和样式
3.  **实时协作**：基于 Yjs 的实时协作支持
4.  **国际化**：多语言支持
5.  **导入导出**：支持 HTML、Markdown 等格式
6.  **评论系统**：内置评论和批注功能
7.  **UI 组件**：丰富的编辑器 UI 扩展

## 目录结构

```
packages/core/src/
├── api/                    # 公共 API 接口
│   ├── blockManipulation/  # 块操作命令
│   ├── exporters/          # 导出器
│   ├── parsers/            # 解析器
│   └── nodeConversions/    # 节点转换
├── blocks/                 # 块定义
│   ├── Audio/              # 音频块
│   ├── Code/               # 代码块
│   ├── Heading/            # 标题块
│   ├── Image/              # 图片块
│   ├── ListItem/           # 列表项块
│   ├── Paragraph/          # 段落块
│   ├── Table/              # 表格块
│   └── ...                 # 其他块类型
├── comments/               # 评论系统
│   └── threadstore/        # 评论线程存储
├── editor/                 # 编辑器核心
│   ├── managers/           # 管理器类
│   └── BlockNoteEditor.ts  # 主编辑器类
├── extensions/             # 编辑器扩展
│   ├── Collaboration/      # 协作扩展
│   ├── FormattingToolbar/  # 格式化工具栏
│   ├── SideMenu/           # 侧边菜单
│   ├── SuggestionMenu/     # 建议菜单
│   └── ...                 # 其他扩展
├── exporter/               # 导出功能
├── extensions-shared/      # 共享扩展组件
├── fonts/                  # 字体资源
├── i18n/                   # 国际化
├── pm-nodes/               # Prosemirror 节点定义
├── schema/                 # 模式定义
├── util/                   # 工具函数
├── yjs/                    # Yjs 集成
└── index.ts                # 主导出文件
```

## 核心模块详解

### 1. 编辑器核心 (editor/)

**BlockNoteEditor** - 主编辑器类
- 集成所有管理器
- 提供公共 API 接口
- 管理编辑器生命周期

**管理器系统**：
- **BlockManager**：块管理（增删改查、嵌套、移动）
- **SelectionManager**：选择管理
- **StateManager**：状态管理
- **ExtensionManager**：扩展管理
- **ExportManager**：导出管理
- **EventManager**：事件管理
- **StyleManager**：样式管理

### 2. 块系统 (blocks/)

**BlockNoteSchema** - 块模式定义
- 定义块类型、内联内容类型、样式类型
- 支持自定义扩展

**默认块类型**：
- Paragraph（段落）
- Heading（标题）
- Code（代码）
- Image（图片）
- Audio（音频）
- Video（视频）
- Table（表格）
- ListItem（列表项）
- Quote（引用）
- Divider（分隔线）
- PageBreak（分页符）

### 3. 模式系统 (schema/)

**三层模式定义**：
1. **BlockSchema**：块类型定义
2. **InlineContentSchema**：内联内容类型定义
3. **StyleSchema**：样式类型定义

**类型安全**：通过泛型提供完整的 TypeScript 类型支持

### 4. 扩展系统 (extensions/)

**UI 扩展**：
- SideMenu：侧边菜单（块操作）
- FormattingToolbar：格式化工具栏
- SuggestionMenu：建议菜单（/命令）
- LinkToolbar：链接工具栏
- FilePanel：文件面板

**功能扩展**：
- Collaboration：实时协作
- History：历史记录
- DropCursor：拖拽光标
- Placeholder：占位符
- TableHandles：表格手柄

### 5. 评论系统 (comments/)

**完整评论功能**：
- ThreadStore：评论线程存储
- YjsThreadStore：基于 Yjs 的分布式存储
- RESTYjsThreadStore：REST API 集成
- 评论标记和渲染

### 6. API 系统 (api/)

**块操作 API**：
- insertBlocks：插入块
- replaceBlocks：替换块
- updateBlock：更新块
- moveBlocks：移动块
- nestBlock：嵌套块

**转换 API**：
- blockToNode：块转 Prosemirror 节点
- nodeToBlock：节点转块

**导入导出 API**：
- HTML 导入导出
- Markdown 导入导出

### 7. 国际化 (i18n/)

**多语言支持**：
- 字典系统
- 本地化配置
- 默认英语支持

### 8. 工具函数 (util/)

**通用工具**：
- EventEmitter：事件发射器
- 浏览器相关工具
- 字符串处理
- 表格处理
- TypeScript 工具类型

## 架构特点

### 1. 分层架构
- **底层**：Prosemirror + Tiptap
- **核心层**：块系统 + 模式系统
- **服务层**：管理器系统
- **UI 层**：扩展系统

### 2. 插件化设计
- 所有功能通过扩展实现
- 支持动态加载/卸载扩展
- 扩展间松耦合

### 3. 类型安全
- 完整的 TypeScript 类型定义
- 泛型支持自定义类型
- 编译时类型检查

### 4. 状态管理
- 基于 Prosemirror 的状态管理
- 响应式状态更新
- 事务系统保证一致性

### 5. 协作支持
- 基于 Yjs 的 CRDT
- 实时同步
- 冲突解决

## 使用示例

```typescript
import { BlockNoteEditor } from "@blocknote/core";

// 创建编辑器
const editor = new BlockNoteEditor({
  initialContent: [
    {
      type: "paragraph",
      content: "Hello World",
    },
  ],
});

// 操作块
editor.insertBlocks(
  [
    {
      type: "heading",
      props: { level: 1 },
      content: "New Heading",
    },
  ],
  editor.getTextCursorPosition().block,
  "after"
);

// 导出内容
const html = editor.exportToHTML();
```

## 扩展开发

### 自定义块类型
```typescript
const CustomBlock = createBlockSpec({
  type: "custom",
  propSchema: {
    // 属性定义
  },
  content: "inline",
});
```

### 自定义扩展
```typescript
const CustomExtension = createTiptapExtension({
  name: "custom",
  addProseMirrorPlugins() {
    return [/* 插件 */];
  },
});
```

## 依赖关系

### 核心依赖
- **@tiptap/core**：编辑器框架
- **prosemirror-***：底层编辑器引擎
- **yjs**：实时协作
- **@tanstack/store**：状态管理

### 可选依赖
- **@hocuspocus/provider**：协作服务器

## 构建输出

包提供多种导出格式：
- **ES Modules**：`dist/blocknote.js`
- **CommonJS**：`dist/blocknote.cjs`
- **类型定义**：`types/`
- **样式文件**：`dist/style.css`

## 总结

`@blocknote/core` 是一个高度模块化、可扩展的块式编辑器框架。它通过清晰的架构分层、完善的类型系统和丰富的扩展机制，为构建现代化的富文本编辑器提供了坚实的基础。无论是简单的文本编辑还是复杂的协作应用，都能通过其灵活的架构满足需求。