import type { NextApiRequest, NextApiResponse } from 'next'
import { loadMetric } from '@/lib/loadMetric'
import type { RegionSale } from '@/types/metrics'

interface RawRecord extends RegionSale { category: string }

function parseList(v: string | string[] | undefined): string[] {
  return Array.isArray(v) ? v : v ? [v] : []
}

export default function handler(req: NextApiRequest, res: NextApiResponse<RegionSale[]>) {
  if (req.method !== 'GET') { res.status(405).end(); return }

  const { region, category } = req.query
  let data = loadMetric<RawRecord[]>('sales_by_region.json')

  const regions = parseList(region   as string | string[])
  const cats    = parseList(category as string | string[])

  if (regions.length > 0) data = data.filter(r => regions.includes(r.region))
  if (cats.length    > 0) data = data.filter(r => cats.includes(r.category))

  // Aggregate across categories → one row per region
  const map = new Map<string, RegionSale>()
  for (const row of data) {
    const prev = map.get(row.region)
    if (prev) {
      prev.total_revenue    = +(prev.total_revenue + row.total_revenue).toFixed(2)
      prev.total_units      += row.total_units
      prev.num_transactions += row.num_transactions
      prev.unique_customers += row.unique_customers
    } else {
      map.set(row.region, {
        region:           row.region,
        total_revenue:    row.total_revenue,
        total_units:      row.total_units,
        num_transactions: row.num_transactions,
        unique_customers: row.unique_customers,
      })
    }
  }

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
  res.status(200).json(Array.from(map.values()))
}
