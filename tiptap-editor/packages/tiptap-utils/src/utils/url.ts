/**
 * URL 处理相关工具函数
 */

type ProtocolOptions = {
  /**
   * 要注册的协议方案
   * @default '''
   * @example 'ftp'
   * @example 'git'
   */
  scheme: string

  /**
   * 如果启用，允许协议后有可选的斜杠
   * @default false
   * @example true
   */
  optionalSlashes?: boolean
}

type ProtocolConfig = Array<ProtocolOptions | string>

const ATTR_WHITESPACE
  // eslint-disable-next-line no-control-regex
  = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g

export function isAllowedUri(
  uri: string | undefined,
  protocols?: ProtocolConfig,
) {
  const allowedProtocols: string[] = [
    'http',
    'https',
    'ftp',
    'ftps',
    'mailto',
    'tel',
    'callto',
    'sms',
    'cid',
    'xmpp',
  ]

  if (protocols) {
    protocols.forEach((protocol) => {
      const nextProtocol
        = typeof protocol === 'string'
          ? protocol
          : protocol.scheme

      if (nextProtocol) {
        allowedProtocols.push(nextProtocol)
      }
    })
  }

  return (
    !uri
    || uri.replace(ATTR_WHITESPACE, '').match(
      new RegExp(

        `^(?:(?:${allowedProtocols.join('|')}):|[^a-z]|[a-z0-9+.\-]+(?:[^a-z+.\-:]|$))`,
        'i',
      ),
    )
  )
}

/**
 * 无协议时按「域名」处理，自动补齐 https://，避免被解析成相对当前页的地址导致跳错。
 * 用于设置链接时规范化 href、以及打开链接前规范化 URL。
 */
export function normalizeLinkUrl(inputUrl: string): string {
  const trimmed = inputUrl.trim()
  if (!trimmed)
    return ''
  // 已有协议（如 http://、mailto:）
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed))
    return trimmed
  // mailto:、tel: 等无 // 的协议
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed))
    return trimmed
  // 相对路径，保持原样
  if (/^\/|^\.\/|^\.\.\//.test(trimmed))
    return trimmed
  // 视为域名，自动补 https
  return `https://${trimmed}`
}

export function sanitizeUrl(
  inputUrl: string,
  baseUrl: string,
  protocols?: ProtocolConfig,
): string {
  try {
    const toParse = normalizeLinkUrl(inputUrl)
    if (!toParse)
      return '#'

    const url = new URL(toParse, baseUrl)

    if (isAllowedUri(url.href, protocols)) {
      return url.href
    }
  }
  catch {
    // If URL creation fails, it's considered invalid
  }
  return '#'
}
