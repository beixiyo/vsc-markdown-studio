# Hocuspocus 后端服务器编写指南

## ⚠️ 版本需求

在使用 Hocuspocus 后端服务器前，请确保版本匹配：

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

Tiptap 官方推荐使用 **Hocuspocus** 作为协作编辑的后端服务器。以下是官方提供的后端编写文档和示例

## 📚 官方后端文档链接

### 1. **Hocuspocus 服务器安装指南**
**链接**: https://tiptap.dev/docs/hocuspocus/server/install

**说明**: 
- 如何安装 Hocuspocus 服务器
- 基础设置步骤

### 2. **Hocuspocus 服务器配置**
**链接**: https://tiptap.dev/docs/hocuspocus/server/configuration

**说明**:
- 服务器配置选项
- 设置说明
- 通过 Hooks 控制大部分功能

### 3. **Hocuspocus 服务器示例**
**链接**: https://tiptap.dev/docs/hocuspocus/server/examples

**说明**:
- 完整的服务器实现示例代码
- 不同场景的配置示例

### 4. **Hocuspocus Hooks 文档**
**链接**: https://tiptap.dev/docs/hocuspocus/server/hooks

**说明**:
- 如何使用 Hooks 扩展服务器功能
- 事件处理示例

### 5. **认证（Authentication）**
**链接**: https://tiptap.dev/docs/hocuspocus/server/authentication

**说明**:
- 如何实现用户认证
- JWT 认证示例

### 6. **持久化（Persistence）**
**链接**: https://tiptap.dev/docs/hocuspocus/server/persistence

**说明**:
- 如何持久化文档数据
- 数据库集成示例

## 🔧 完整配置示例

### 带认证和持久化的服务器

```javascript
import { Server } from '@hocuspocus/server'
import { Database } from '@hocuspocus/extension-database'
import { Logger } from '@hocuspocus/extension-logger'

const server = Server.configure({
  port: 1234,
  
  name: 'hocuspocus-server',
  
  extensions: [
    new Logger(),
    new Database({
      fetch: async ({ documentName }) => {
        // 从数据库获取文档
        // 返回 Uint8Array 或 null
        return await fetchDocumentFromDatabase(documentName)
      },
      store: async ({ documentName, state }) => {
        // 保存文档到数据库
        await saveDocumentToDatabase(documentName, state)
      },
    }),
  ],
  
  async onAuthenticate({ token, documentName }) {
    // 验证用户身份
    const user = await verifyToken(token)
    
    if (!user) {
      throw new Error('Unauthorized')
    }
    
    return {
      user: {
        id: user.id,
        name: user.name,
      },
    }
  },
  
  async onConnect({ documentName, context }) {
    console.log(`Client connected to document: ${documentName}`)
  },
  
  async onDisconnect({ documentName, context }) {
    console.log(`Client disconnected from document: ${documentName}`)
  },
})

server.listen()
```

## 🔐 认证示例

### JWT 认证

```javascript
import { Server } from '@hocuspocus/server'
import jwt from 'jsonwebtoken'

const server = Server.configure({
  port: 1234,
  
  async onAuthenticate({ token, documentName }) {
    try {
      // 验证 JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      
      return {
        user: {
          id: decoded.userId,
          name: decoded.userName,
        },
      }
    } catch (error) {
      throw new Error('Invalid token')
    }
  },
})

server.listen()
```

### 自定义认证

```javascript
import { Server } from '@hocuspocus/server'

const server = Server.configure({
  port: 1234,
  
  async onAuthenticate({ token, documentName }) {
    // 自定义认证逻辑
    const user = await authenticateUser(token, documentName)
    
    if (!user || !user.hasAccess(documentName)) {
      throw new Error('Access denied')
    }
    
    return {
      user: {
        id: user.id,
        name: user.name,
      },
    }
  },
})

server.listen()
```

## 💾 持久化示例

### 使用数据库扩展

```javascript
import { Server } from '@hocuspocus/server'
import { Database } from '@hocuspocus/extension-database'

const server = Server.configure({
  port: 1234,
  
  extensions: [
    new Database({
      fetch: async ({ documentName }) => {
        // 从数据库获取文档
        const doc = await db.getDocument(documentName)
        return doc ? Buffer.from(doc.content) : null
      },
      store: async ({ documentName, state }) => {
        // 保存文档到数据库
        await db.saveDocument(documentName, {
          content: Buffer.from(state),
          updatedAt: new Date(),
        })
      },
    }),
  ],
})

server.listen()
```

### 使用 SQLite

```javascript
import { Server } from '@hocuspocus/server'
import { SQLite } from '@hocuspocus/extension-sqlite'

const server = Server.configure({
  port: 1234,
  
  extensions: [
    new SQLite({
      database: './database.sqlite',
    }),
  ],
})

server.listen()
```

### 使用 Redis

```javascript
import { Server } from '@hocuspocus/server'
import { Redis } from '@hocuspocus/extension-redis'

const server = Server.configure({
  port: 1234,
  
  extensions: [
    new Redis({
      host: 'localhost',
      port: 6379,
    }),
  ],
})

server.listen()
```

## 🎣 Hooks 使用示例

### 监听文档更新

```javascript
import { Server } from '@hocuspocus/server'

const server = Server.configure({
  port: 1234,
})

server.on('storeDocument', ({ documentName, state }) => {
  console.log(`Document ${documentName} updated`)
  // 可以在这里触发其他操作，如通知、备份等
})

server.listen()
```

### 监听连接事件

```javascript
import { Server } from '@hocuspocus/server'

const server = Server.configure({
  port: 1234,
})

server.on('connect', ({ documentName, context }) => {
  console.log(`User ${context.user?.name} connected to ${documentName}`)
})

server.on('disconnect', ({ documentName, context }) => {
  console.log(`User ${context.user?.name} disconnected from ${documentName}`)
})

server.listen()
```

### 文档访问控制

```javascript
import { Server } from '@hocuspocus/server'

const server = Server.configure({
  port: 1234,
  
  async onLoadDocument({ documentName }) {
    // 检查文档是否存在
    const exists = await checkDocumentExists(documentName)
    
    if (!exists) {
      // 创建新文档
      return null
    }
    
    // 返回现有文档
    return await loadDocument(documentName)
  },
  
  async onAuthenticate({ token, documentName }) {
    // 检查用户是否有权限访问该文档
    const hasAccess = await checkDocumentAccess(token, documentName)
    
    if (!hasAccess) {
      throw new Error('Access denied')
    }
    
    return {
      user: await getUserFromToken(token),
    }
  },
})

server.listen()
```

## 📦 安装依赖

```bash
# 基础服务器
npm install @hocuspocus/server

# 扩展（可选）
npm install @hocuspocus/extension-database
npm install @hocuspocus/extension-logger
npm install @hocuspocus/extension-redis
npm install @hocuspocus/extension-sqlite
npm install @hocuspocus/extension-s3
```

## 🔗 相关资源

- **Hocuspocus GitHub**: https://github.com/ueberdosis/hocuspocus
- **Hocuspocus 文档**: https://tiptap.dev/docs/hocuspocus
- **Y.js 文档**: https://docs.yjs.dev/
