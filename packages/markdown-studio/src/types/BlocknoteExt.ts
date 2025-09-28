import type { Block } from '@blocknote/core'
import type { AnyBlock } from './MDBridge'

/**
 * 说话人类型定义
 */
export interface SpeakerType {
  /** 说话人唯一标识 */
  blockId?: string
  /** 说话人显示名称 */
  name: string
  /** 内容字符串 */
  content: string
}

/**
 * 上级标题信息类型定义
 */
export interface ParentHeadingInfo {
  /** 标题块对象 */
  block: Block
  /** 标题级别 (1-6) */
  level: number
  /** 标题文本内容 */
  text: string
  /** 标题在文档中的索引位置 */
  index: number
}

/**
 * 文档区域的结构定义
 */
export interface DocSection {
  /**
   * 该区域的标题块，如果文档开头不是标题，则为 null
   */
  heading: AnyBlock | null
  /**
   * 属于该区域的所有内容块
   */
  blocks: AnyBlock[]
  /**
   * 该区域的起始块
   */
  startBlock: AnyBlock | null
  /**
   * 该区域的结束块
   */
  endBlock: AnyBlock | null
}
