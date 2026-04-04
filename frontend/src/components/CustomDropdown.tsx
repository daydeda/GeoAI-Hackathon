'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

type DropdownOption = {
  value: string
  label: string
}

type CustomDropdownProps = {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  buttonClassName?: string
  menuClassName?: string
}

export default function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select',
  className = '',
  buttonClassName = '',
  menuClassName = '',
}: CustomDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target as Node)) setOpen(false)
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onDocumentClick)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onDocumentClick)
      document.removeEventListener('keydown', onEscape)
    }
  }, [])

  const selected = options.find((option) => option.value === value)

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2 rounded border border-(--border-subtle) bg-(--bg-base) px-3 py-2 text-left text-xs text-white ${buttonClassName}`}
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown size={14} className={`shrink-0 text-(--text-muted) transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded border border-(--border-subtle) bg-(--bg-surface) shadow-lg ${menuClassName}`}>
          {options.map((option) => {
            const active = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={`block w-full px-3 py-2 text-left text-xs transition-colors ${active ? 'bg-[rgba(0,229,255,0.12)] text-(--accent-cyan)' : 'text-(--text-secondary) hover:bg-[rgba(255,255,255,0.04)] hover:text-white'}`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
