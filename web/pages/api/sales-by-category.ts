import type { NextApiRequest, NextApiResponse } from 'next'
import { loadMetric } from '@/lib/loadMetric'
import type { CategorySaleResponse } from '@/types/metrics'

export default function handler(req: NextApiRequest, res: NextApiResponse<CategorySaleResponse>) {
  if (req.method !== 'GET') { res.status(405).end(); return }

  const { category, from, to } = req.query
  let data = loadMetric<CategorySaleResponse>('sales_by_category.json')

  const cats = Array.isArray(category) ? category : category ? [category] : []
  if (cats.length > 0) {
    data = {
      summary: data.summary.filter(s => cats.includes(s.category)),
      monthly: data.monthly.filter(m => cats.includes(m.category)),
    }
  }
  if (from && typeof from === 'string') {
    data = { ...data, monthly: data.monthly.filter(m => m.year_month >= from) }
  }
  if (to && typeof to === 'string') {
    data = { ...data, monthly: data.monthly.filter(m => m.year_month <= to) }
  }

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
  res.status(200).json(data)
}
