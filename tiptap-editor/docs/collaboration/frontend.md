# Tiptap 官方协作编辑示例和教程

## ⚠️ 版本需求

在使用协作编辑功能前，请确保版本匹配：

- **后端服务器**: 需要使用 `@hocuspocus/cli@2.15.0` 启动服务器
  ```bash
  npx @hocuspocus/cli@2.15.0 --port 8080

  # or use sqlite save
  npx @hocuspocus/cli@2.15.0 --port 8080 --sqlite ./collaborative.sqlite
  ```

- **前端依赖**: 需要安装 `@hocuspocus/provider@^2.15.0`
  ```json
  "@hocuspocus/provider": "^2.15.0"
  ```

> 📌 **注意**: 前后端版本需要保持一致，以确保协作编辑功能正常工作

---

以下是 Tiptap 官方提供的协作编辑集成示例和教程链接：

## 📚 官方文档链接

### 1. **协作编辑示例（Collaborative Editing Example）**
**链接**: https://tiptap.dev/docs/examples/advanced/collaborative-editing

**说明**: 
- 展示如何使用 Tiptap 实现多用户实时协作编辑
- 连接所有客户端到 WebSocket 服务器
- 使用 Y.js 合并文档更改
- 包含完整的实现示例

### 2. **协作扩展文档（Collaboration Extension）**
**链接**: https://tiptap.dev/docs/editor/extensions/functionality/collaboration

**说明**:
- 快速指南：如何将基本协作功能集成到编辑器
- 安装和配置协作扩展的详细步骤
- API 参考和配置选项

### 3. **协作安装指南（Installation Guide）**
**链接**: https://tiptap.dev/docs/collaboration/getting-started/install

**说明**:
- 从零开始的完整安装指南
- 依赖安装步骤
- 基础配置示例

### 4. **Hocuspocus Provider 示例**
**链接**: https://tiptap.dev/docs/hocuspocus/provider/examples

**说明**:
- 使用 Hocuspocus 作为协作后端的示例代码
- 如何设置 Tiptap 实例
- 如何启动 Hocuspocus 后端
- 如何连接两者

## 💻 官方示例代码片段

### 基础协作编辑配置

```javascript
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

// 创建 Yjs 文档
const ydoc = new Y.Doc()

// 创建 WebSocket Provider
const provider = new WebsocketProvider(
  'ws://localhost:1234',
  'your-document-id',
  ydoc
)

// 配置编辑器
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      // 禁用历史记录，使用协作扩展的历史管理
      history: false,
    }),
    Collaboration.configure({
      document: ydoc,
    }),
  ],
})
```

### 使用 Hocuspocus Provider

```javascript
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import { HocuspocusProvider } from '@hocuspocus/provider'

// 创建 Hocuspocus Provider
const provider = new HocuspocusProvider({
  url: 'ws://localhost:1234',
  name: 'your-document-id',
})

// 配置编辑器
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      history: false,
    }),
    Collaboration.configure({
      document: provider.document,
    }),
  ],
})
```

### React Hook 示例

```javascript
import { useEffect, useState } from 'react'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

function CollaborativeEditor({ documentId }) {
  const [ydoc] = useState(() => new Y.Doc())
  const [provider] = useState(() => 
    new WebsocketProvider('ws://localhost:1234', documentId, ydoc)
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Collaboration.configure({
        document: ydoc,
      }),
    ],
  })

  useEffect(() => {
    return () => {
      provider.destroy()
      ydoc.destroy()
    }
  }, [provider, ydoc])

  return <EditorContent editor={editor} />
}
```

## 🎯 关键要点

1. **禁用历史记录或 StartKit(Undo、Redo)**: 启用协作编辑时，需要禁用 StarterKit 的 `history` 扩展，改用协作扩展的历史管理
  ```ts
  /** @link https://tiptap.dev/docs/collaboration/getting-started/install */
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        undoRedo: false, // Disables default Undo/Redo extension to use Collaboration's history management
      }),
    ],
  })
  ```
2. **文档 ID**: 使用相同的 `documentId` 可以让多个用户编辑同一份文档
3. **Provider 生命周期**: 确保在组件卸载时正确清理 Provider 和 Yjs 文档
4. **服务器要求**: 需要运行支持 Yjs 的 WebSocket 服务器（推荐 Hocuspocus）

## 🔗 相关资源

- **Y.js 文档**: https://docs.yjs.dev/
- **Hocuspocus 文档**: https://tiptap.dev/docs/hocuspocus
- **Tiptap 主文档**: https://tiptap.dev/docs

## 📝 注意事项

- 确保 WebSocket 服务器可访问
- 使用相同的 `documentId` 进行文档同步
- 协作编辑时，初始内容会被 Yjs 文档的内容覆盖
- 建议在生产环境中实现用户认证和权限控制

