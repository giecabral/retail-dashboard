import sys
import pandas as pd
import numpy as np
import json
from pathlib import Path
from loguru import logger

logger.remove()
logger.add(sys.stderr, format="{time:YYYY-MM-DD HH:mm:ss} | {level:<8} | {message}", colorize=True)

np.random.seed(42)


def log_dropped(entity: str, reason: str, count: int) -> None:
    """Log a cleaning step. WARNING if rows were actually removed, DEBUG if count is zero."""
    msg = f"{entity}: dropped {count} row{'s' if count != 1 else ''} — {reason}"
    if count > 0:
        logger.warning(msg)
    else:
        logger.debug(msg)


def log_remapped(entity: str, reason: str, count: int) -> None:
    """Log a value-remapping step. WARNING if values were changed, DEBUG otherwise."""
    msg = f"{entity}: remapped {count} value{'s' if count != 1 else ''} — {reason}"
    if count > 0:
        logger.warning(msg)
    else:
        logger.debug(msg)

BASE    = Path(__file__).parent.parent
RAW     = BASE / "data" / "raw"
CLEANED = BASE / "data" / "cleaned"
METRICS = BASE / "data" / "metrics"

for d in [CLEANED, METRICS]:
    d.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Step 1 — Load raw CSVs
# ---------------------------------------------------------------------------

customers = pd.read_csv(RAW / "customers.csv")
products  = pd.read_csv(RAW / "products.csv")
sales     = pd.read_csv(RAW / "sales.csv")

logger.info(f"Loaded: {len(customers)} customers, {len(products)} products, {len(sales)} sales")

# ---------------------------------------------------------------------------
# Step 2 — Clean customers
# ---------------------------------------------------------------------------

logger.info("Cleaning customers")

n = len(customers)
customers = customers.dropna(subset=['id'])
log_dropped("customers", "null id", n - len(customers))

n = len(customers)
customers = customers.drop_duplicates(subset=['id'], keep='first')
log_dropped("customers", "duplicate id", n - len(customers))

invalid_regions = ~customers['region'].isin(['North', 'South', 'East', 'West', 'Central'])
log_remapped("customers", "unknown region → 'Unknown'", int(invalid_regions.sum()))
customers['region'] = customers['region'].where(~invalid_regions, other='Unknown')

age_clipped = int(((customers['age'] < 0) | (customers['age'] > 120)).sum())
customers['age'] = customers['age'].clip(0, 120)
log_remapped("customers", "age out of range [0, 120] — clipped", age_clipped)

logger.info(f"Cleaned customers: {len(customers)} rows")

# ---------------------------------------------------------------------------
# Step 3 — Clean products
# ---------------------------------------------------------------------------

logger.info("Cleaning products")

n = len(products)
products = products.dropna(subset=['id'])
log_dropped("products", "null id", n - len(products))

n = len(products)
products = products[products['price'].notna() & (products['price'] > 0)]
log_dropped("products", "missing or non-positive price", n - len(products))

n = len(products)
products = products.drop_duplicates(subset=['id'], keep='first')
log_dropped("products", "duplicate id", n - len(products))

products['price'] = products['price'].clip(1.0, 9999.0)

KNOWN_CATEGORIES = ['Electronics', 'Clothing', 'Food & Beverage', 'Home & Garden', 'Sports', 'Books', 'Toys']
unknown_cats = ~products['category'].isin(KNOWN_CATEGORIES)
log_remapped("products", "unknown category → 'Other'", int(unknown_cats.sum()))
products['category'] = products['category'].where(~unknown_cats, other='Other')

null_names = int(products['name'].isna().sum())
products['name'] = products['name'].fillna('Unknown Product')
log_remapped("products", "null name → 'Unknown Product'", null_names)

products['stock_quantity'] = products['stock_quantity'].fillna(0).astype(int).clip(lower=0)
logger.info(f"Cleaned products: {len(products)} rows")

# ---------------------------------------------------------------------------
# Step 4 — Clean sales
# ---------------------------------------------------------------------------

logger.info("Cleaning sales")

n = len(sales)
sales['date'] = pd.to_datetime(sales['date'])
sales = sales.drop_duplicates()
log_dropped("sales", "exact duplicate rows", n - len(sales))

valid_customers = set(customers['id'])
valid_products  = set(products['id'])
n = len(sales)
sales = sales[
    sales['customer_id'].isin(valid_customers) &
    sales['product_id'].isin(valid_products)
]
log_dropped("sales", "orphaned customer_id or product_id", n - len(sales))

n = len(sales)
sales = sales[(sales['quantity'] >= 1) & (sales['quantity'] <= 10)]
log_dropped("sales", "quantity out of range [1, 10]", n - len(sales))

# Derive revenue
sales = sales.merge(products[['id', 'price']], left_on='product_id', right_on='id', how='left')
sales = sales.rename(columns={'id_x': 'id'}).drop(columns=['id_y'])
sales['revenue'] = (sales['price'] * sales['quantity']).round(2)

logger.info(f"Cleaned sales: {len(sales)} rows")

# ---------------------------------------------------------------------------
# Step 5 — Save cleaned CSVs
# ---------------------------------------------------------------------------

customers.to_csv(CLEANED / "customers.csv", index=False)
products.to_csv(CLEANED  / "products.csv",  index=False)
sales.drop(columns=['price', 'revenue']).to_csv(CLEANED / "sales.csv", index=False)

logger.success("Cleaned CSVs saved to data/cleaned/")

# ---------------------------------------------------------------------------
# Step 6 — Generate metrics JSON
# ---------------------------------------------------------------------------

logger.info("Generating metrics JSON")


def save_json(data, path: Path):
    with open(path, 'w') as f:
        json.dump(data, f, indent=2, default=str)


# --- top_products.json -------------------------------------------------------
# Stored per (product, region) so the API can filter by region before ranking.

top_products_df = (
    sales
    .merge(customers[['id', 'region']], left_on='customer_id', right_on='id', how='left')
    .drop(columns=['id_y'])
    .rename(columns={'id_x': 'id'})
    .groupby(['product_id', 'region'])
    .agg(
        total_revenue=('revenue', 'sum'),
        total_units=('quantity', 'sum'),
        num_transactions=('id', 'count'),
    )
    .reset_index()
    .merge(products[['id', 'name', 'category']], left_on='product_id', right_on='id', how='left')
    .drop(columns=['id'])
    .sort_values('total_revenue', ascending=False)
)
top_products_df['total_revenue'] = top_products_df['total_revenue'].round(2)

save_json(top_products_df.to_dict(orient='records'), METRICS / "top_products.json")
logger.success("top_products.json written")


# --- sales_by_region.json ----------------------------------------------------
# Stored per (region, category) so the API can filter by category.
# unique_customers is per-pair; the API sums it as an approximation when
# multiple categories are selected (acceptable for a pre-aggregated dataset).

region_sales_df = (
    sales
    .merge(customers[['id', 'region']], left_on='customer_id', right_on='id', how='left')
    .drop(columns=['id_y'])
    .rename(columns={'id_x': 'id'})
    .merge(products[['id', 'category']], left_on='product_id', right_on='id', how='left')
    .drop(columns=['id_y'])
    .rename(columns={'id_x': 'id'})
    .groupby(['region', 'category'])
    .agg(
        total_revenue=('revenue', 'sum'),
        total_units=('quantity', 'sum'),
        num_transactions=('id', 'count'),
        unique_customers=('customer_id', 'nunique'),
    )
    .reset_index()
)
region_sales_df['total_revenue'] = region_sales_df['total_revenue'].round(2)

save_json(region_sales_df.to_dict(orient='records'), METRICS / "sales_by_region.json")
logger.success("sales_by_region.json written")


# --- sales_by_category.json --------------------------------------------------

cat_sales = (
    sales
    .merge(products[['id', 'category']], left_on='product_id', right_on='id', how='left')
    .drop(columns=['id_y'])
    .rename(columns={'id_x': 'id'})
    .merge(customers[['id', 'region']], left_on='customer_id', right_on='id', how='left')
    .drop(columns=['id_y'])
    .rename(columns={'id_x': 'id'})
)

# Stored per (category, region) — API aggregates after filtering
category_summary_df = (
    cat_sales
    .groupby(['category', 'region'])
    .agg(
        total_revenue=('revenue', 'sum'),
        total_units=('quantity', 'sum'),
        num_transactions=('id', 'count'),
        avg_order_value=('revenue', 'mean'),
    )
    .reset_index()
)
category_summary_df['total_revenue']   = category_summary_df['total_revenue'].round(2)
category_summary_df['avg_order_value'] = category_summary_df['avg_order_value'].round(2)

cat_sales['year_month'] = cat_sales['date'].dt.to_period('M').astype(str)
# Stored per (category, year_month, region) — API aggregates after filtering
monthly_df = (
    cat_sales
    .groupby(['category', 'year_month', 'region'])
    .agg(monthly_revenue=('revenue', 'sum'))
    .reset_index()
)
monthly_df['monthly_revenue'] = monthly_df['monthly_revenue'].round(2)

save_json(
    {
        'summary': category_summary_df.to_dict(orient='records'),
        'monthly': monthly_df.to_dict(orient='records'),
    },
    METRICS / "sales_by_category.json"
)
logger.success("sales_by_category.json written")


# --- sales_by_age_group.json -------------------------------------------------
# Revenue and units broken down by customer age group and category

bins   = [18, 25, 35, 45, 55, 120]
labels = ['18-24', '25-34', '35-44', '45-54', '55+']
customers['age_group'] = pd.cut(customers['age'], bins=bins, labels=labels, right=False)

age_sales = (
    sales
    .merge(customers[['id', 'age_group']], left_on='customer_id', right_on='id', how='left')
    .drop(columns=['id_y'])
    .rename(columns={'id_x': 'id'})
    .merge(products[['id', 'category']], left_on='product_id', right_on='id', how='left')
    .drop(columns=['id_y'])
    .rename(columns={'id_x': 'id'})
)
age_sales['age_group'] = age_sales['age_group'].astype(str)

age_sales = (
    age_sales
    .merge(customers[['id', 'region']], left_on='customer_id', right_on='id', how='left', suffixes=('', '_cust'))
    .drop(columns=['id_cust'])
)

# Stored per (age_group, category, region) — API aggregates after filtering
age_df = (
    age_sales
    .groupby(['age_group', 'category', 'region'])
    .agg(
        total_revenue=('revenue', 'sum'),
        total_units=('quantity', 'sum'),
        num_transactions=('id', 'count'),
    )
    .reset_index()
)
age_df['total_revenue'] = age_df['total_revenue'].round(2)

save_json(age_df.to_dict(orient='records'), METRICS / "sales_by_age_group.json")
logger.success("sales_by_age_group.json written")


# --- sales_by_category_region.json -------------------------------------------
# Revenue per (region, category) — enables the category preference by region chart

cat_region_df = (
    sales
    .merge(customers[['id', 'region']], left_on='customer_id', right_on='id', how='left')
    .drop(columns=['id_y'])
    .rename(columns={'id_x': 'id'})
    .merge(products[['id', 'category']], left_on='product_id', right_on='id', how='left')
    .drop(columns=['id_y'])
    .rename(columns={'id_x': 'id'})
    .groupby(['region', 'category'])
    .agg(
        total_revenue=('revenue', 'sum'),
        total_units=('quantity', 'sum'),
    )
    .reset_index()
)
cat_region_df['total_revenue'] = cat_region_df['total_revenue'].round(2)

save_json(cat_region_df.to_dict(orient='records'), METRICS / "sales_by_category_region.json")
logger.success("sales_by_category_region.json written")


# --- inventory.json ----------------------------------------------------------
# Inventory turnover = units_sold / stock_quantity  (unit-based, no cost proxy)
# Days on hand       = 365 / turnover_rate
# Stock value        = stock_quantity × price  (current holding value)

inventory_df = (
    sales
    .groupby('product_id')
    .agg(total_units_sold=('quantity', 'sum'))
    .reset_index()
    .merge(products[['id', 'name', 'category', 'price', 'stock_quantity']],
           left_on='product_id', right_on='id', how='left')
    .drop(columns=['id'])
)

inventory_df['turnover_rate'] = (
    inventory_df['total_units_sold'] / inventory_df['stock_quantity']
).round(2)

# Cap days_on_hand at 9999 for zero-sales products to avoid inf
inventory_df['days_on_hand'] = np.where(
    inventory_df['turnover_rate'] > 0,
    (365 / inventory_df['turnover_rate']).round(0).astype(int),
    9999,
)

inventory_df['stock_value'] = (
    inventory_df['stock_quantity'] * inventory_df['price']
).round(2)

inventory_df = inventory_df.sort_values('turnover_rate')

save_json(inventory_df.to_dict(orient='records'), METRICS / "inventory.json")
logger.success("inventory.json written")

logger.info("ETL complete — metrics saved to data/metrics/")
