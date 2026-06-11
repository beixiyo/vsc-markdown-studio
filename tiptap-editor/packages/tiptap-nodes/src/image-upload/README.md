# ImageUploadNode 图片上传节点

上传占位 UI 节点（block atom）：点击打开文件选择器，上传成功后**替换为 ImageNode**，自身不是持久内容

## 序列化支持

| 格式 | 支持 | 说明 |
|------|------|------|
| JSON | ✅ | 节点可序列化（但语义上是临时占位） |
| HTML | ✅ | `<div data-type="image-upload">` |
| Markdown | ❌ 无表示 | 导出时整节点被忽略——**文档保存前应确保上传完成**，否则占位丢失 |

## Options

| 选项 | 默认 | 说明 |
|------|------|------|
| `accept` | `'image/*'` | 可接受的文件类型（MIME 或扩展名） |
| `limit` | `1` | 最大文件数 |
| `maxSize` | `0` | 单文件大小上限（字节），0 不限 |
| `upload` | — | `(file, onProgress?, abortSignal?) => Promise<string>` 上传实现，返回图片 URL |
| `onSuccess` | — | `(url) => void` |
| `onError` | — | `(error) => void` |
| `type` | `'image'` | 上传完成后替换成的节点类型 |
| `HTMLAttributes` | `{}` | 透传属性 |

## 用法

```ts
import { handleImageUpload, MAX_FILE_SIZE } from 'tiptap-utils'

ImageUploadNode.configure({
  accept: 'image/*',
  maxSize: MAX_FILE_SIZE,
  limit: 3,
  upload: handleImageUpload,
  onError: error => console.error('Upload failed:', error),
})
```

支持进度回调与 `AbortController` 取消，文件项状态见 `types.ts` 的 `FileItem`
