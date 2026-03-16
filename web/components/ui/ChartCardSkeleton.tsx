import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  height?: number
  className?: string
}

export default function ChartCardSkeleton({ height = 400, className }: Props) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton style={{ height }} className="w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}
