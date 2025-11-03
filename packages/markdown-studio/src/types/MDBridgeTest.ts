/** 示例内部调试状态（仅验收脚本使用，不建议业务侧依赖） */
export interface MDBridgeState {
  headerImageUrls?: string[]
  imageUrls?: string[]
  flowing?: boolean
}

/** 统一测试工具（在 Console 使用） */
export interface MDTest {
  createResults: () => { total: number, passed: number, failed: number, errors: string[] }
  deepEqual: (a: any, b: any) => boolean
  logTitle: (title: string) => void
  delay: (ms: number) => Promise<void>
  waitForBridge: (predicate: (w: Window & typeof globalThis) => boolean, timeoutMs?: number) => Promise<boolean>
  testCase: (results: { total: number, passed: number, failed: number, errors: string[] }, name: string, fn: () => any, expected?: any) => void
  asyncTestCase: (results: { total: number, passed: number, failed: number, errors: string[] }, name: string, fn: () => Promise<any>, expected?: any) => Promise<void>
  finalizeTest: (results: { total: number, passed: number, failed: number, errors: string[] }) => void
  clearContent: () => void
  std: {
    waitForMDBridge: (timeoutMs?: number) => Promise<boolean>
    waitForBlockNoteBridge: (timeoutMs?: number) => Promise<boolean>
  }
}
