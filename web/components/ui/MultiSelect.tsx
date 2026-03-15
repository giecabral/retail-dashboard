'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Option {
  label: string
  value: string
}

interface Props {
  label: string
  options: Option[]
  selected: string[]
  onChange: (values: string[]) => void
  width?: string
}

export default function MultiSelect({
  label,
  options,
  selected,
  onChange,
  width = 'w-52',
}: Props) {
  const [open, setOpen] = useState(false)

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter(v => v !== value)
        : [...selected, value]
    )
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange([])
  }

  const triggerLabel =
    selected.length === 0
      ? `All ${label}s`
      : selected.length === 1
        ? selected[0]
        : `${selected.concat()}`

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            'flex items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm hover:bg-accent transition-colors cursor-pointer',
            width
          )}
        >
          <span className={cn('truncate', selected.length === 0 && 'text-muted-foreground')}>
            {triggerLabel}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {selected.length > 0 && (
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" onClick={clear} />
            )}
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start" style={{ width: '200px' }}>
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}…`} />
            <CommandList>
              <CommandEmpty>No results.</CommandEmpty>
              <CommandGroup>
                {options.map(opt => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    className='cursor-pointer'
                    onSelect={() => toggle(opt.value)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selected.includes(opt.value) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
