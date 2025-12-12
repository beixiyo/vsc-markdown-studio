import type { SpeakerMapValue } from 'tiptap-speaker-node'

/**
 * 演示与内置测试用的默认 speaker 映射
 * 需要真实数据时，可通过 props 传入自定义映射覆盖
 */
export const defaultSpeakerMap: Record<string, SpeakerMapValue> = {
  '1': {
    name: 'Alice',
    id: 'u1',
  },
}

