'use client'

import { useEffect } from 'react'
import { containsThai, shouldSkipThaiScanTag } from '@/lib/thaiText'

function applyThaiClassFromNode(node: Node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || ''
    if (!containsThai(text)) return

    const parent = node.parentElement
    if (!parent) return
    if (shouldSkipThaiScanTag(parent.tagName)) return

    parent.classList.add('thai-auto')
    return
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return

  const element = node as Element
  if (shouldSkipThaiScanTag(element.tagName)) return

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const textNode = walker.currentNode
    const text = textNode.textContent || ''
    if (!containsThai(text)) continue

    const parent = textNode.parentElement
    if (!parent) continue
    if (shouldSkipThaiScanTag(parent.tagName)) continue

    parent.classList.add('thai-auto')
  }
}

export default function ThaiAutoFont() {
  useEffect(() => {
    applyThaiClassFromNode(document.body)

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData' && mutation.target) {
          applyThaiClassFromNode(mutation.target)
        }

        mutation.addedNodes.forEach((addedNode) => {
          applyThaiClassFromNode(addedNode)
        })
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return null
}
