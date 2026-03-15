'use client'

import * as React from 'react'
import { subDays, subMonths, subYears, startOfDay, endOfDay, format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Props {
  from: Date
  to: Date
  onChange: (from: Date, to: Date) => void
}

const PRESETS = [
  { label: 'Week',         getRange: () => ({ from: subDays(new Date(), 7),     to: new Date() }) },
  { label: 'Month',        getRange: () => ({ from: subMonths(new Date(), 1),   to: new Date() }) },
  { label: 'Last 3 mo.',   getRange: () => ({ from: subMonths(new Date(), 3),   to: new Date() }) },
  { label: 'Last 6 mo.',   getRange: () => ({ from: subMonths(new Date(), 6),   to: new Date() }) },
  { label: 'Year',         getRange: () => ({ from: subYears(new Date(), 1),    to: new Date() }) },
]

export default function DateRangeFilter({ from, to, onChange }: Props) {
  const [open, setOpen] = React.useState(false)
  const [range, setRange] = React.useState<DateRange>({ from, to })
  const [month, setMonth] = React.useState<Date>(from)

  function applyPreset(getRange: () => { from: Date; to: Date }) {
    const { from: f, to: t } = getRange()
    const clamped = {
      from: startOfDay(f),
      to:   endOfDay(t),
    }
    setRange(clamped)
    setMonth(clamped.from)
    onChange(clamped.from, clamped.to)
    setOpen(false)
  }

  function handleSelect(selected: DateRange | undefined) {
    if (!selected) return
    setRange(selected)
    if (selected.from && selected.to) {
      onChange(startOfDay(selected.from), endOfDay(selected.to))
    }
  }

  const label = range.from && range.to
    ? `${format(range.from, 'MMM dd, yyyy')} – ${format(range.to, 'MMM dd, yyyy')}`
    : 'Pick a range'

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">Date Range</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm hover:bg-accent transition-colors cursor-pointer">
          <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="whitespace-nowrap">{label}</span>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-auto" align="start">
          <Card size="sm" className="border-0 shadow-none">
            <CardContent className="p-0">
              <Calendar
                mode="range"
                selected={range}
                onSelect={handleSelect}
                month={month}
                onMonthChange={setMonth}
                numberOfMonths={2}
                fixedWeeks
                className="p-3"
              />
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2 border-t p-3">
              {PRESETS.map(p => (
                <Button
                  key={p.label}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => applyPreset(p.getRange)}
                >
                  {p.label}
                </Button>
              ))}
            </CardFooter>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  )
}
