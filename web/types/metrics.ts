export interface TopProduct {
  product_id: string
  name: string
  category: string
  total_revenue: number
  total_units: number
  num_transactions: number
}

export interface RegionSale {
  region: string
  total_revenue: number
  total_units: number
  num_transactions: number
  unique_customers: number
}

export interface CategorySummary {
  category: string
  total_revenue: number
  total_units: number
  num_transactions: number
  avg_order_value: number
}

export interface MonthlyCategorySale {
  category: string
  year_month: string
  monthly_revenue: number
}

export interface CategorySaleResponse {
  summary: CategorySummary[]
  monthly: MonthlyCategorySale[]
}

export interface AgeGroupSale {
  age_group: string
  category: string
  total_revenue: number
  total_units: number
  num_transactions: number
}

export interface CategoryRegionSale {
  region: string
  category: string
  total_revenue: number
  total_units: number
}

export interface InventoryItem {
  product_id: string
  name: string
  category: string
  price: number
  stock_quantity: number
  total_units_sold: number
  turnover_rate: number
  days_on_hand: number
  stock_value: number
}
