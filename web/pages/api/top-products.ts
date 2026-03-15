import type { NextApiRequest, NextApiResponse } from 'next'
import { loadMetric } from '@/lib/loadMetric'
import type { TopProduct } from '@/types/metrics'

export default function handler(req: NextApiRequest, res: NextApiResponse<TopProduct[]>) {
  if (req.method !== 'GET') { res.status(405).end(); return }

  const { category, limit = '10' } = req.query
  let data = loadMetric<TopProduct[]>('top_products.json')

  const cats = Array.isArray(category) ? category : category ? [category] : []
  if (cats.length > 0) data = data.filter(p => cats.includes(p.category))
  data = data.slice(0, parseInt(limit as string, 10))

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
  res.status(200).json(data)
}
