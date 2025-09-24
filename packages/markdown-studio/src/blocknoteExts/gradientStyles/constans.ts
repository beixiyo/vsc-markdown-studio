/**
 * 渐变样式配置映射表
 * 包含所有可用的渐变样式及其配置信息
 *
 * @example
 * ```ts
 * // 获取特定渐变样式配置
 * const config = gradientStylesMap.mysticPurpleBlue
 * console.log(config.label) // '神秘紫蓝'
 * console.log(config.gradient) // 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
 * ```
 */
export const gradientStylesMap: Record<GradientStyleType, GradientStyleConfig> = {
  mysticPurpleBlue: {
    label: '神秘紫蓝',
    className: 'gradient-mystic-purple-blue',
    buttonClassName: 'gradient-mystic-purple-blue-btn',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  skyBlue: {
    label: '天空蓝',
    className: 'gradient-sky-blue',
    buttonClassName: 'gradient-sky-blue-btn',
    gradient: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
  },
  gorgeousPurpleRed: {
    label: '瑰丽紫红',
    className: 'gradient-gorgeous-purple-red',
    buttonClassName: 'gradient-gorgeous-purple-red-btn',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  },
  warmSunshine: {
    label: '温暖阳光',
    className: 'gradient-warm-sunshine',
    buttonClassName: 'gradient-warm-sunshine-btn',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  },
  naturalGreen: {
    label: '自然绿意',
    className: 'gradient-natural-green',
    buttonClassName: 'gradient-natural-green-btn',
    gradient: 'linear-gradient(135deg, #a8e6cf 0%, #7fcdcd 100%)',
  },
  mysticNight: {
    label: '神秘暗夜',
    className: 'gradient-mystic-night',
    buttonClassName: 'gradient-mystic-night-btn',
    gradient: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
  },
  colorfulCandy: {
    label: '多彩糖果',
    className: 'gradient-colorful-candy',
    buttonClassName: 'gradient-colorful-candy-btn',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
  },
  starryNight: {
    label: '星空夜幕',
    className: 'gradient-starry-night',
    buttonClassName: 'gradient-starry-night-btn',
    gradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
  },
  metallic: {
    label: '金属质感',
    className: 'gradient-metallic',
    buttonClassName: 'gradient-metallic-btn',
    gradient: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)',
  },
  snowyGlacier: {
    label: '雪山冰川',
    className: 'gradient-snowy-glacier',
    buttonClassName: 'gradient-snowy-glacier-btn',
    gradient: 'linear-gradient(135deg, #e6ddd4 0%, #f1f2f6 100%)',
  },
  tropicalSummer: {
    label: '热带夏日',
    className: 'gradient-tropical-summer',
    buttonClassName: 'gradient-tropical-summer-btn',
    gradient: 'linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%)',
  },
}

/**
 * 渐变样式类型定义
 * 定义了所有可用的渐变样式标识符
 *
 * @example
 * ```ts
 * // 使用渐变样式类型
 * const style: GradientStyleType = 'mysticPurpleBlue'
 *
 * // 在函数参数中使用
 * function applyGradient(style: GradientStyleType) {
 *   return gradientStylesMap[style]
 * }
 * ```
 */
export type GradientStyleType =
  | 'mysticPurpleBlue' // 神秘紫蓝 - 紫色到蓝色的渐变
  | 'skyBlue' // 天空蓝 - 浅蓝到深蓝的渐变
  | 'gorgeousPurpleRed' // 瑰丽紫红 - 紫色到粉色的渐变
  | 'warmSunshine' // 温暖阳光 - 暖黄色渐变
  | 'naturalGreen' // 自然绿意 - 绿色系渐变
  | 'mysticNight' // 神秘暗夜 - 深色系渐变
  | 'colorfulCandy' // 多彩糖果 - 多彩渐变
  | 'starryNight' // 星空夜幕 - 深蓝渐变
  | 'metallic' // 金属质感 - 金属色渐变
  | 'snowyGlacier' // 雪山冰川 - 白色系渐变
  | 'tropicalSummer' // 热带夏日 - 橙红色渐变

/**
 * 渐变样式配置接口
 * 定义了每个渐变样式的完整配置信息
 *
 * @example
 * ```ts
 * const config: GradientStyleConfig = {
 *   label: '神秘紫蓝',
 *   className: 'gradient-mystic-purple-blue',
 *   buttonClassName: 'gradient-mystic-purple-blue-btn',
 *   gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
 * }
 * ```
 */
export interface GradientStyleConfig {
  /** 显示名称，用于 UI 展示 */
  label: string
  /** CSS 类名，用于应用到文本元素 */
  className: string
  /** 按钮 CSS 类名，用于菜单按钮样式 */
  buttonClassName: string
  /** 渐变 CSS 值，完整的 CSS gradient 属性值 */
  gradient: string
}
