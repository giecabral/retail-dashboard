import type { NextApiRequest, NextApiResponse } from 'next'
import { loadMetric } from '@/lib/loadMetric'
import type { InventoryItem } from '@/types/metrics'

function parseList(v: string | string[] | undefined): string[] {
  return Array.isArray(v) ? v : v ? [v] : []
}

export default function handler(req: NextApiRequest, res: NextApiResponse<InventoryItem[]>) {
  if (req.method !== 'GET') { res.status(405).end(); return }

  const { category, limit = '15' } = req.query
  let data = loadMetric<InventoryItem[]>('inventory.json')

  const cats = parseList(category as string | string[])
  if (cats.length > 0) data = data.filter(d => cats.includes(d.category))

  // Already sorted ascending by turnover_rate (slowest first) from ETL
  data = data.slice(0, parseInt(limit as string, 10))

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
  res.status(200).json(data)
}
