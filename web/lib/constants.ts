// Shared color palettes — used across all chart and insight components
export const CATEGORY_COLORS: Record<string, string> = {
  Electronics:       '#6366f1',
  Clothing:          '#f59e0b',
  'Food & Beverage': '#10b981',
  'Home & Garden':   '#ec4899',
  Sports:            '#f97316',
  Books:             '#8b5cf6',
  Toys:              '#06b6d4',
  Other:             '#94a3b8',
}

export const REGION_COLORS: Record<string, string> = {
  North:   '#6366f1',
  South:   '#f59e0b',
  East:    '#10b981',
  West:    '#f43f5e',
  Central: '#f97316',
}

// Filter option lists — single source of truth for filters and data generation
export const CATEGORIES = [
  'Electronics', 'Clothing', 'Food & Beverage',
  'Home & Garden', 'Sports', 'Books', 'Toys',
] as const

export const REGIONS = ['North', 'South', 'East', 'West', 'Central'] as const

// Default date window — spans the full synthetic dataset
export const DEFAULT_DATE_FROM = new Date(2025, 0, 1)
export const DEFAULT_DATE_TO   = new Date(2026, 2, 15)

// Shared Recharts tooltip style — applied uniformly across all charts
export const TOOLTIP_STYLE = {
  contentStyle: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 },
  labelStyle:   { color: '#111827', fontWeight: 600 },
  itemStyle:    { color: '#374151' },
}
