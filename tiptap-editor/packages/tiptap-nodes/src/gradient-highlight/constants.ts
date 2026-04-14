/**
 * 渐变样式类型集合
 * 与历史上的 `custom-blocknote-gradient-styles` 保持一致
 */
export type GradientStyleType =
  | 'mysticPurpleBlue'
  | 'skyBlue'
  | 'gorgeousPurpleRed'
  | 'warmSunshine'
  | 'naturalGreen'
  | 'mysticNight'
  | 'colorfulCandy'
  | 'starryNight'
  | 'metallic'
  | 'snowyGlacier'
  | 'tropicalSummer'

/**
 * 单个渐变的展示配置
 */
export interface GradientStyleConfig {
  /** 显示名称（用于菜单等 UI） */
  label: string
  /** `background` 属性取值（完整 CSS gradient 语法） */
  gradient: string
}

/** 渐变 key → 配置 */
export const gradientStylesMap: Record<GradientStyleType, GradientStyleConfig> = {
  mysticPurpleBlue: { label: '神秘紫蓝', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  skyBlue: { label: '天空蓝', gradient: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)' },
  gorgeousPurpleRed: { label: '瑰丽紫红', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  warmSunshine: { label: '温暖阳光', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  naturalGreen: { label: '自然绿意', gradient: 'linear-gradient(135deg, #a8e6cf 0%, #7fcdcd 100%)' },
  mysticNight: { label: '神秘暗夜', gradient: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)' },
  colorfulCandy: { label: '多彩糖果', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)' },
  starryNight: { label: '星空夜幕', gradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' },
  metallic: { label: '金属质感', gradient: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)' },
  snowyGlacier: { label: '雪山冰川', gradient: 'linear-gradient(135deg, #e6ddd4 0%, #f1f2f6 100%)' },
  tropicalSummer: { label: '热带夏日', gradient: 'linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%)' },
}

/** 判断一个字符串是否为有效的渐变 key */
export function isGradientType(value: unknown): value is GradientStyleType {
  return typeof value === 'string' && value in gradientStylesMap
}
