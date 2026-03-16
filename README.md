# Retail Analytics Dashboard

A full-stack retail analytics dashboard built as part of the **Aplos Assessment**. It provides interactive KPIs, trend charts, inventory health, and business insights derived from a synthetic retail dataset.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Data generation | Python (Faker, NumPy, Pandas) |
| ETL | Python (Pandas) |
| Backend API | Next.js API Routes (TypeScript) |
| Frontend | Next.js 14 App Router (TypeScript) |
| UI Components | shadcn/ui + Tailwind CSS |
| Charts | Recharts |
| Date utilities | date-fns, react-day-picker |

---

## Project Structure

```
retail-dashboard/
├── pipeline/
│   ├── generate_data.py     # Synthetic dataset generation
│   ├── etl.py               # Pre-aggregation → JSON metrics
│   └── data/
│       └── raw/             # Generated CSV files
├── web/
│   ├── app/
│   │   └── page.tsx         # Main dashboard page
│   ├── components/
│   │   ├── AppHeader.tsx
│   │   ├── InsightsPanel.tsx
│   │   ├── charts/          # Recharts chart components
│   │   ├── filters/         # Category, region, date filters
│   │   └── ui/              # KPICard, ChartEmptyState, shadcn primitives
│   ├── pages/api/           # Next.js API routes (one per metric)
│   ├── public/metrics/      # Pre-aggregated JSON served by APIs
│   ├── lib/
│   │   └── loadMetric.ts    # JSON loader utility
│   └── types/
│       └── metrics.ts       # Shared TypeScript interfaces
└── README.md
```

---

## Getting Started

### 1 — Generate data and run ETL

```bash
cd pipeline
pip install pandas numpy faker
python generate_data.py   # writes CSV files to data/raw/
python etl.py             # aggregates and writes JSON to web/public/metrics/
```

### 2 — Install frontend dependencies

```bash
cd web
npm install
```

### 3 — Start the development server

```bash
npm run dev
Open http://localhost:3000
```

---

## Assessment Coverage

| Requirement | Status |
|-------------|--------|
| Synthetic dataset generation | ✅ |
| ETL / data transformation pipeline | ✅ |
| REST API endpoints | ✅ |
| Interactive dashboard with charts | ✅ |
| Cross-filtering (category + region) | ✅ |
| KPI cards | ✅ |
| Business insights panel | ✅ |
| Inventory analysis | ✅ |
| Responsive layout | ✅ |

---

## Data Model

### Entities

**customers** (`customers.csv`)
- `id`, `name`, `age_group` (`18-24`, `25-34`, `35-44`, `45-54`, `55+`), `region` (`North`, `South`, `East`, `West`)

**products** (`products.csv`)
- `id`, `name`, `category` (Electronics, Clothing, Food & Beverage, Home & Garden, Sports, Books, Toys), `price`, `stock_quantity`
- Stock ranges are category-aware: e.g. Food & Beverage (20–120 units) vs Electronics (100–400 units)

**transactions** (`transactions.csv`)
- `id`, `customer_id`, `product_id`, `quantity`, `unit_price`, `total_price`, `transaction_date`
- 5 000 transactions spanning January 2025 – March 2026

### Relationships
```
customers (1) ──< transactions (N) >── (1) products
```

---

## ETL Pipeline

**`generate_data.py`**
- Generates 200 customers, 200 products, and 5 000 transactions using Faker
- Assigns realistic stock quantities per category to produce varied inventory turnover
- Prices randomised per category within defined ranges

**`etl.py`**
- Reads the three CSVs, merges them, and produces pre-aggregated JSON files saved to `web/public/metrics/`
- All metrics include both category and region dimensions to support cross-filtering in the API layer

| Output file | Aggregation |
|-------------|-------------|
| `top_products.json` | Revenue + units per (product, region, category) |
| `sales_by_region.json` | Revenue + units + transactions per (region, category) |
| `sales_by_category.json` | Summary and monthly trend per (category, region) |
| `sales_by_age_group.json` | Revenue per (age_group, category, region) |
| `category_by_region.json` | Revenue + units per (category, region) |
| `inventory.json` | Turnover rate, days-on-hand, stock value per product; sorted ascending by turnover (slowest first) |

**Inventory turnover formula**
```
turnover_rate = total_units_sold / stock_quantity
days_on_hand  = 365 / turnover_rate   (9999 if no sales)
stock_value   = stock_quantity × price
```
Unit-based turnover was chosen over cost-based because selling price is not a reliable cost proxy in a synthetic dataset.

---

## API Reference

All endpoints accept optional `category` and `region` query params (repeatable). Aggregation happens at the API layer in TypeScript, so the pre-aggregated JSON can remain dimension-rich while public response types stay clean.

| Endpoint | Extra params | Response type |
|----------|-------------|---------------|
| `GET /api/top-products` | `limit` (default 10) | `TopProduct[]` |
| `GET /api/sales-by-region` | — | `RegionSale[]` |
| `GET /api/sales-by-category` | `from`, `to` (YYYY-MM) | `CategorySaleResponse` |
| `GET /api/sales-by-age-group` | — | `AgeGroupSale[]` |
| `GET /api/category-by-region` | — | `CategoryRegionSale[]` |
| `GET /api/inventory` | `limit` (default 15) | `InventoryItem[]` |

---

## Frontend Architecture

### Filtering
Three filters live in `page.tsx` state and are passed as URL params to every API call:
- **Category** — multi-select checkbox dropdown
- **Region** — multi-select checkbox dropdown
- **Trend Period** — date range picker (affects only the Monthly Revenue by Category chart)

### KPIs vs Insights tabs
The dashboard is split into two tabs:

**Key Metrics** — all values respond to the active filters:
- Total Revenue, Units Sold, Avg. Order Value, Top Category

**Business Insights** — always computed from the full unfiltered dataset (fetched once on mount). An explicit label clarifies this to users.

### Charts

| Component | Type | Description |
|-----------|------|-------------|
| `TopProductsChart` | Horizontal bar | Top 10 products by revenue, colored by category |
| `SalesByRegionChart` | Pie | Revenue share per region |
| `SalesByCategoryChart` | Area (stacked) | Monthly revenue trend per category |
| `AgeGroupChart` | Grouped bar | Revenue by age group and category |
| `CategoryRegionChart` | Grouped bar | Category preference per region |
| `InventoryTurnoverChart` | Horizontal bar | Slowest-moving products with 1× reference line |

### Empty states
`ChartEmptyState` is a reusable component used by all charts. It renders a contextual icon and message when a filter or date selection returns no data.

---

## Business Insights

The Insights panel surfaces four computed findings from the full dataset:

1. **North region leads in revenue** — drives 22% of total revenue. The lowest region (Central) holds 18% — all regions are within a narrow band, suggesting a well-balanced geographic distribution.

2. **82 slow-moving products** — 82 out of 200 products have a turnover rate below 1×, meaning they have not sold through their current stock within the equivalent of one year.

3. **55+ age group is the highest-spending segment** — customers aged 55 and over generate the most revenue, with their purchases concentrated in the Sports category.

4. **South has the highest average order value** — South customers average ~$2,985 per order, roughly 7% above the East region (the lowest), which averages ~$2,792.

---

## Design Decisions

- **Pre-aggregation over live queries**: all aggregations are done at ETL time and stored as JSON. API routes simply filter and re-aggregate in memory. This avoids a database dependency while keeping response times fast.

- **Cross-filtering via API**: rather than filtering on the client (which would require shipping full raw data), filters are applied server-side. The ETL embeds all necessary dimensions so the API can always narrow results without secondary lookups.

- **Insights use full dataset**: applying filters to business insights would change the benchmark numbers and make comparisons misleading. Insights are intentionally decoupled from the filter state.

- **Unit-based inventory turnover**: cost-of-goods is not available in the synthetic data; using selling price as a COGS proxy would distort the metric. Unit-based turnover (`units_sold / stock_qty`) is unambiguous and sufficient for identifying slow-moving stock.

- **Category-aware stock ranges**: each product category has realistic stock range bounds during generation. This produces naturally varied turnover rates across categories rather than uniform random noise.

- **Generated data excluded from version control**: raw CSVs (`pipeline/data/raw/`) and any intermediate cleaned files are listed in `.gitignore`. Because all data is fully reproducible by running `generate_data.py` followed by `etl.py`, committing it would add binary-like bulk to the repository with no traceability benefit. Only the final pre-aggregated JSON metrics (`web/public/metrics/`) are tracked, as they are the build artifact the frontend depends on.
