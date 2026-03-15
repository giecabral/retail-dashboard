import fs from 'fs'
import path from 'path'

export function loadMetric<T>(filename: string): T {
  const filePath = path.join(process.cwd(), '..', 'data', 'metrics', filename)
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as T
}
