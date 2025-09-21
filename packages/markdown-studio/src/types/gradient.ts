/**
 * 渐变样式类型定义
 * 统一管理所有渐变样式的类型，避免重复定义
 */

/** 渐变样式类型 */
export type GradientStyleType =
  | 'mysticPurpleBlue' // 神秘紫蓝
  | 'skyBlue' // 天空蓝
  | 'gorgeousPurpleRed' // 瑰丽紫红
  | 'warmSunshine' // 温暖阳光
  | 'naturalGreen' // 自然绿意
  | 'mysticNight' // 神秘暗夜
  | 'colorfulCandy' // 多彩糖果
  | 'starryNight' // 星空夜幕
  | 'metallic' // 金属质感
  | 'snowyGlacier' // 雪山冰川
  | 'tropicalSummer' // 热带夏日

/** 渐变样式配置 */
export interface GradientStyleConfig {
  /** 样式类型 */
  type: GradientStyleType
  /** 显示名称 */
  label: string
  /** CSS 类名 */
  className: string
  /** 按钮 CSS 类名 */
  buttonClassName: string
  /** 渐变 CSS 值 */
  gradient: string
}

/** 所有渐变样式的配置映射 */
export const GRADIENT_STYLES: Record<GradientStyleType, GradientStyleConfig> = {
  mysticPurpleBlue: {
    type: 'mysticPurpleBlue',
    label: '神秘紫蓝',
    className: 'gradient-mystic-purple-blue',
    buttonClassName: 'gradient-mystic-purple-blue-btn',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  skyBlue: {
    type: 'skyBlue',
    label: '天空蓝',
    className: 'gradient-sky-blue',
    buttonClassName: 'gradient-sky-blue-btn',
    gradient: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
  },
  gorgeousPurpleRed: {
    type: 'gorgeousPurpleRed',
    label: '瑰丽紫红',
    className: 'gradient-gorgeous-purple-red',
    buttonClassName: 'gradient-gorgeous-purple-red-btn',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  },
  warmSunshine: {
    type: 'warmSunshine',
    label: '温暖阳光',
    className: 'gradient-warm-sunshine',
    buttonClassName: 'gradient-warm-sunshine-btn',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  },
  naturalGreen: {
    type: 'naturalGreen',
    label: '自然绿意',
    className: 'gradient-natural-green',
    buttonClassName: 'gradient-natural-green-btn',
    gradient: 'linear-gradient(135deg, #a8e6cf 0%, #7fcdcd 100%)',
  },
  mysticNight: {
    type: 'mysticNight',
    label: '神秘暗夜',
    className: 'gradient-mystic-night',
    buttonClassName: 'gradient-mystic-night-btn',
    gradient: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
  },
  colorfulCandy: {
    type: 'colorfulCandy',
    label: '多彩糖果',
    className: 'gradient-colorful-candy',
    buttonClassName: 'gradient-colorful-candy-btn',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
  },
  starryNight: {
    type: 'starryNight',
    label: '星空夜幕',
    className: 'gradient-starry-night',
    buttonClassName: 'gradient-starry-night-btn',
    gradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
  },
  metallic: {
    type: 'metallic',
    label: '金属质感',
    className: 'gradient-metallic',
    buttonClassName: 'gradient-metallic-btn',
    gradient: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)',
  },
  snowyGlacier: {
    type: 'snowyGlacier',
    label: '雪山冰川',
    className: 'gradient-snowy-glacier',
    buttonClassName: 'gradient-snowy-glacier-btn',
    gradient: 'linear-gradient(135deg, #e6ddd4 0%, #f1f2f6 100%)',
  },
  tropicalSummer: {
    type: 'tropicalSummer',
    label: '热带夏日',
    className: 'gradient-tropical-summer',
    buttonClassName: 'gradient-tropical-summer-btn',
    gradient: 'linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%)',
  },
}

/** 获取所有渐变样式类型 */
export function getAllGradientTypes(): GradientStyleType[] {
  return Object.keys(GRADIENT_STYLES) as GradientStyleType[]
}

/** 根据类型获取渐变样式配置 */
export function getGradientConfig(type: GradientStyleType): GradientStyleConfig {
  return GRADIENT_STYLES[type]
}
