import type { NextApiRequest, NextApiResponse } from 'next'
import { loadMetric } from '@/lib/loadMetric'
import type { RegionSale } from '@/types/metrics'

export default function handler(req: NextApiRequest, res: NextApiResponse<RegionSale[]>) {
  if (req.method !== 'GET') { res.status(405).end(); return }

  const { region } = req.query
  let data = loadMetric<RegionSale[]>('sales_by_region.json')

  const regions = Array.isArray(region) ? region : region ? [region] : []
  if (regions.length > 0) data = data.filter(r => regions.includes(r.region))

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
  res.status(200).json(data)
}
