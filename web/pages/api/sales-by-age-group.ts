import type { NextApiRequest, NextApiResponse } from 'next'
import { loadMetric } from '@/lib/loadMetric'
import type { AgeGroupSale } from '@/types/metrics'

interface RawRecord extends AgeGroupSale { region: string }

function parseList(v: string | string[] | undefined): string[] {
  return Array.isArray(v) ? v : v ? [v] : []
}

export default function handler(req: NextApiRequest, res: NextApiResponse<AgeGroupSale[]>) {
  if (req.method !== 'GET') { res.status(405).end(); return }

  const { category, region } = req.query
  let data = loadMetric<RawRecord[]>('sales_by_age_group.json')

  const cats    = parseList(category as string | string[])
  const regions = parseList(region   as string | string[])

  if (cats.length    > 0) data = data.filter(d => cats.includes(d.category))
  if (regions.length > 0) data = data.filter(d => regions.includes(d.region))

  // Aggregate across regions → one row per (age_group, category)
  const map = new Map<string, AgeGroupSale>()
  for (const row of data) {
    const key  = `${row.age_group}__${row.category}`
    const prev = map.get(key)
    if (prev) {
      prev.total_revenue    = +(prev.total_revenue + row.total_revenue).toFixed(2)
      prev.total_units      += row.total_units
      prev.num_transactions += row.num_transactions
    } else {
      map.set(key, {
        age_group:        row.age_group,
        category:         row.category,
        total_revenue:    row.total_revenue,
        total_units:      row.total_units,
        num_transactions: row.num_transactions,
      })
    }
  }

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
  res.status(200).json(Array.from(map.values()))
}
