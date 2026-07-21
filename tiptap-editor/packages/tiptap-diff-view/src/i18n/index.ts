import { getI18n, LANGUAGES } from 'i18n'

let isRegistered = false

/** 注册 Markdown Diff 内置资源，重复调用不会再次写入 */
export function registerTiptapDiffViewResources() {
  if (isRegistered)
    return

  getI18n().mergeResources(tiptapDiffViewResources, true)
  isRegistered = true
}

/** Markdown Diff 视图内置翻译资源 */
export const tiptapDiffViewResources = {
  [LANGUAGES.ZH_CN]: {
    tiptapDiffView: {
      before: '修改前',
      after: '修改后',
      result: '比较结果',
      changedLines: '{{count}} 个变更行',
      splitView: '双栏',
      unifiedView: '单栏',
      overview: 'Diff 快速导航',
      jumpByPosition: '按文档位置跳转',
      dragOverview: '拖拽浏览 Diff',
      jumpToAddedLine: '跳到第 {{line}} 行新增',
      jumpToDeletedLine: '跳到第 {{line}} 行删除',
    },
  },
  [LANGUAGES.ZH_TW]: {
    tiptapDiffView: {
      before: '修改前',
      after: '修改後',
      result: '比較結果',
      changedLines: '{{count}} 個變更行',
      splitView: '雙欄',
      unifiedView: '單欄',
      overview: 'Diff 快速導覽',
      jumpByPosition: '按文件位置跳轉',
      dragOverview: '拖曳瀏覽 Diff',
      jumpToAddedLine: '跳到第 {{line}} 行新增',
      jumpToDeletedLine: '跳到第 {{line}} 行刪除',
    },
  },
  [LANGUAGES.EN_US]: {
    tiptapDiffView: {
      before: 'Before',
      after: 'After',
      result: 'Comparison',
      changedLines: {
        one: '{{count}} changed line',
        other: '{{count}} changed lines',
      },
      splitView: 'Split',
      unifiedView: 'Unified',
      overview: 'Diff overview',
      jumpByPosition: 'Jump by document position',
      dragOverview: 'Drag to browse the diff',
      jumpToAddedLine: 'Jump to added line {{line}}',
      jumpToDeletedLine: 'Jump to deleted line {{line}}',
    },
  },
  [LANGUAGES.JA_JP]: {
    tiptapDiffView: {
      before: '変更前',
      after: '変更後',
      result: '比較結果',
      changedLines: '変更行 {{count}} 件',
      splitView: '左右表示',
      unifiedView: '一列表示',
      overview: 'Diff クイックナビゲーション',
      jumpByPosition: '文書内の位置へ移動',
      dragOverview: 'ドラッグして Diff を表示',
      jumpToAddedLine: '追加された {{line}} 行目へ移動',
      jumpToDeletedLine: '削除された {{line}} 行目へ移動',
    },
  },
}
