import { CalendarX, SearchX } from 'lucide-react'

interface Props {
  variant?: 'filter' | 'date'
  message?: string
  hint?: string
}

const VARIANTS = {
  filter: { Icon: SearchX,   message: 'No data matches the selected filters',  hint: 'Try adjusting the category or region filter' },
  date:   { Icon: CalendarX, message: 'No sales data for this period',          hint: 'Try adjusting the date range filter' },
}

export default function ChartEmptyState({ variant = 'filter', message, hint }: Props) {
  const { Icon, message: defaultMessage, hint: defaultHint } = VARIANTS[variant]
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
      <Icon className="h-8 w-8 opacity-40" />
      <p className="text-sm font-medium">{message ?? defaultMessage}</p>
      <p className="text-xs opacity-70">{hint ?? defaultHint}</p>
    </div>
  )
}
