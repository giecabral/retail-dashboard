import type { NextApiRequest, NextApiResponse } from 'next'
import { loadMetric } from '@/lib/loadMetric'
import type { AgeGroupSale } from '@/types/metrics'

export default function handler(req: NextApiRequest, res: NextApiResponse<AgeGroupSale[]>) {
  if (req.method !== 'GET') { res.status(405).end(); return }

  const { category } = req.query
  let data = loadMetric<AgeGroupSale[]>('sales_by_age_group.json')

  const cats = Array.isArray(category) ? category : category ? [category] : []
  if (cats.length > 0) data = data.filter(d => cats.includes(d.category))

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
  res.status(200).json(data)
}
