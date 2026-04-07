const THAI_REGEX = /[\u0E00-\u0E7F]/

export function containsThai(value: string): boolean {
  return THAI_REGEX.test(value)
}

export function shouldSkipThaiScanTag(tagName: string): boolean {
  const tag = tagName.toUpperCase()
  return tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA'
}
