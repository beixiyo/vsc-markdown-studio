# useSetupMDBridge 重构说明

## 重构目标

移除 `useSetupMDBridge` 文件夹中直接访问全局 `window` 方法的代码，通过依赖注入的方式避免依赖混乱。

## 重构内容

### 1. 移除的直接全局访问

- `window.MDBridge` - 直接设置和清理全局 MDBridge 实例
- `window.__MDBridgeState` - 完全移除，使用内部状态管理

### 2. 新增的依赖注入机制

#### StateManager 接口
```typescript
export interface StateManager {
  getImageUrls: () => string[]
  setImageUrls: (urls: string[]) => void
  getHeaderImageUrls: () => string[]
  setHeaderImageUrls: (urls: string[]) => void
}
```

#### 全局管理器
- **GlobalBridgeManager** - 管理 `window.MDBridge` 的访问
- **GlobalStateManager** - 使用内部状态管理，不再依赖全局变量
- **TestStateHelpers** - 提供测试辅助工具，避免测试代码直接访问全局状态

### 3. 文件结构

```
useSetupMDBridge/
├── index.ts                 # 主入口，不再直接访问全局变量
├── bridgeFactory.ts         # 桥接工厂，通过 StateManager 管理状态
├── stateManager.ts          # 状态管理器实现
├── globalBridge.ts          # 全局桥接管理器
├── globalStateManager.ts    # 内部状态管理器
├── testHelpers.ts           # 测试辅助工具
├── blockOperations.ts       # 块操作（无变化）
├── blockSections.ts         # 块分组（无变化）
├── commands.ts              # 命令（无变化）
├── eventHandlers.ts         # 事件处理器（无变化）
├── imageUtils.ts            # 图片工具（无变化）
└── types.ts                 # 类型定义（无变化）
```

## 重构优势

1. **依赖清晰** - 核心逻辑不再直接依赖全局变量
2. **可测试性** - 通过依赖注入，便于单元测试
3. **解耦合** - 全局变量访问被封装在专门的管理器中
4. **维护性** - 全局变量的管理逻辑集中化

## 使用方式

- **外部代码**：仍然可以通过 `window.MDBridge` 访问编辑器接口
- **内部实现**：完全通过依赖注入和内部状态管理，不再依赖全局变量
- **测试代码**：使用 `TestStateHelpers` 工具类访问状态，避免直接访问全局变量

## 重构优势

1. **完全解耦** - 核心逻辑不再依赖任何全局变量
2. **可测试性** - 通过依赖注入和测试辅助工具，便于单元测试
3. **维护性** - 状态管理逻辑集中化，易于维护和调试
4. **类型安全** - 移除了全局状态依赖，提高了类型安全性
