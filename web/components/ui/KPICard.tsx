'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ReactNode } from 'react'

interface KPICardProps {
  title: string
  value: string
  subtitle?: string
  icon: ReactNode
}

export default function KPICard({ title, value, subtitle, icon }: KPICardProps) {
  return (
    <Card className="border-t-4 border-t-blue-500 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="py-1 px-4">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <span className="flex items-center justify-center rounded-lg bg-blue-50 p-2 text-blue-600">
            {icon}
          </span>
        </div>
        <p className="text-2xl font-bold tracking-tight text-gray-900">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

export function KPICardSkeleton() {
  return (
    <Card className="border-t-4 border-t-blue-200 shadow-sm">
      <CardContent className="py-1 px-4">
        <div className="flex items-start justify-between">
          <Skeleton className="h-4 w-24 mt-1" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-32 mt-2" />
        <Skeleton className="h-3 w-20 mt-2" />
      </CardContent>
    </Card>
  )
}
