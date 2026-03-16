import type { NextApiRequest, NextApiResponse } from 'next'
import { loadMetric } from '@/lib/loadMetric'
import type { CategoryRegionSale } from '@/types/metrics'

export default function handler(req: NextApiRequest, res: NextApiResponse<CategoryRegionSale[] | { error: string }>) {
  if (req.method !== 'GET') { res.status(405).end(); return }

  try {
    const { region, category } = req.query
    let data = loadMetric<CategoryRegionSale[]>('sales_by_category_region.json')

    const regions = Array.isArray(region) ? region : region ? [region] : []
    if (regions.length > 0) data = data.filter(d => regions.includes(d.region))

    const cats = Array.isArray(category) ? category : category ? [category] : []
    if (cats.length > 0) data = data.filter(d => cats.includes(d.category))

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
    res.status(200).json(data)
  } catch (err) {
    console.error('[category-by-region]', err)
    res.status(500).json({ error: 'Failed to load category by region' })
  }
}
