# BlockNote Core 学习路线

本文档为学习 `@blocknote/core` 核心包制定的系统化学习路线，重点关注 WYSIWYG、样式修改、自定义插件和核心操作 API。

## 📚 学习路线

1. [基础架构理解](./01-basic-architecture.md)
2. [编辑器核心](./02-editor-core.md)
3. [WYSIWYG 渲染系统](./03-wysiwyg-rendering.md)
4. [样式系统](./04-style-system.md)
5. [块操作 API](./05-block-operations-api.md)
6. [自定义插件开发](./06-custom-plugin-development.md)
7. [扩展系统](./07-extension-system.md)
8. [高级主题](./08-advanced-topics.md)

---

## 🎯 学习建议

### 学习顺序

1. **第一阶段：基础理解**
   - 阅读 ARCHITECTURE.md
   - 理解 BlockNoteEditor 类结构
   - 了解管理器系统

2. **第二阶段：WYSIWYG 渲染**
   - 学习块渲染机制
   - 理解节点转换
   - 查看默认块实现

3. **第三阶段：样式系统**
   - 学习样式规范
   - 理解样式应用机制
   - 尝试创建自定义样式

4. **第四阶段：API 操作**
   - 学习块操作 API
   - 理解事务系统
   - 实践各种块操作

5. **第五阶段：扩展开发**
   - 学习 Extension 系统
   - 查看扩展示例
   - 开发自定义扩展

6. **第六阶段：高级主题**
   - 导入导出
   - 协作系统
   - 评论系统

### 实践建议

1. **边学边做**：每学习一个模块，就在你的 demo 中实践
2. **阅读测试**：查看 `*.test.ts` 文件，了解 API 的使用方式
3. **查看示例**：参考 `examples/` 目录下的示例代码
4. **调试技巧**：在关键位置添加断点，观察数据流

### 关键文件速查

| 功能 | 文件路径 | 关键行号 |
|------|---------|---------|
| 编辑器主类 | `../../src/editor/BlockNoteEditor.ts` | 337-1330 |
| 块管理 | `../../src/editor/managers/BlockManager.ts` | 36-252 |
| 样式管理 | `../../src/editor/managers/StyleManager.ts` | 19-182 |
| 扩展管理 | `../../src/editor/managers/ExtensionManager/index.ts` | 24-514 |
| 块渲染 | `../../src/schema/blocks/types.ts` | 410-489 |
| 样式定义 | `../../src/schema/styles/createSpec.ts` | 72-140 |
| 插入块 | `../../src/api/blockManipulation/commands/insertBlocks/insertBlocks.ts` | 16-54 |
| 扩展接口 | `../../src/editor/BlockNoteExtension.ts` | 16-236 |

---

## 📝 总结

BlockNote Core 是一个设计精良的块式编辑器框架，通过清晰的架构分层和模块化设计，提供了强大的扩展能力。按照本学习路线，你可以系统地掌握：

- ✅ WYSIWYG 渲染机制
- ✅ 样式系统的设计和应用
- ✅ 各种核心操作 API
- ✅ 自定义插件开发

建议在学习过程中，结合你的 demo 项目（`examples/vanilla-js/only-core`）进行实践，这样可以更好地理解各个概念的实际应用。

祝你学习愉快！🚀