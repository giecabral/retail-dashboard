import type { NextApiRequest, NextApiResponse } from 'next'
import { loadMetric } from '@/lib/loadMetric'
import type { TopProduct } from '@/types/metrics'

interface RawRecord extends TopProduct { region: string }

function parseList(v: string | string[] | undefined): string[] {
  return Array.isArray(v) ? v : v ? [v] : []
}

export default function handler(req: NextApiRequest, res: NextApiResponse<TopProduct[] | { error: string }>) {
  if (req.method !== 'GET') { res.status(405).end(); return }

  try {
    const { category, region, limit = '10' } = req.query
    let data = loadMetric<RawRecord[]>('top_products.json')

    const cats    = parseList(category as string | string[])
    const regions = parseList(region   as string | string[])

    if (cats.length    > 0) data = data.filter(p => cats.includes(p.category))
    if (regions.length > 0) data = data.filter(p => regions.includes(p.region))

    // Aggregate across regions → one row per product
    const map = new Map<string, TopProduct>()
    for (const row of data) {
      const prev = map.get(row.product_id)
      if (prev) {
        prev.total_revenue    = +(prev.total_revenue + row.total_revenue).toFixed(2)
        prev.total_units      += row.total_units
        prev.num_transactions += row.num_transactions
      } else {
        map.set(row.product_id, {
          product_id:       row.product_id,
          name:             row.name,
          category:         row.category,
          total_revenue:    row.total_revenue,
          total_units:      row.total_units,
          num_transactions: row.num_transactions,
        })
      }
    }

    const result = Array.from(map.values())
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, parseInt(limit as string, 10))

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
    res.status(200).json(result)
  } catch (err) {
    console.error('[top-products]', err)
    res.status(500).json({ error: 'Failed to load top products' })
  }
}
