import pandas as pd
import numpy as np
import json
from pathlib import Path

np.random.seed(42)

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

print(f"Loaded: {len(customers)} customers, {len(products)} products, {len(sales)} sales")

# ---------------------------------------------------------------------------
# Step 2 — Clean customers
# ---------------------------------------------------------------------------

customers = customers.dropna(subset=['id'])
customers = customers.drop_duplicates(subset=['id'], keep='first')
customers['region'] = customers['region'].where(
    customers['region'].isin(['North', 'South', 'East', 'West', 'Central']), other='Unknown'
)
customers['age'] = customers['age'].clip(0, 120)

print(f"Cleaned customers: {len(customers)} rows")

# ---------------------------------------------------------------------------
# Step 3 — Clean products
# ---------------------------------------------------------------------------

products = products.dropna(subset=['id'])
products = products[products['price'].notna() & (products['price'] > 0)]
products = products.drop_duplicates(subset=['id'], keep='first')
products['price'] = products['price'].clip(1.0, 9999.0)

KNOWN_CATEGORIES = ['Electronics', 'Clothing', 'Food & Beverage', 'Home & Garden', 'Sports', 'Books', 'Toys']
products['category'] = products['category'].where(products['category'].isin(KNOWN_CATEGORIES), other='Other')
products['name'] = products['name'].fillna('Unknown Product')

print(f"Cleaned products: {len(products)} rows")

# ---------------------------------------------------------------------------
# Step 4 — Clean sales
# ---------------------------------------------------------------------------

sales['date'] = pd.to_datetime(sales['date'])
sales = sales.drop_duplicates()

valid_customers = set(customers['id'])
valid_products  = set(products['id'])
sales = sales[
    sales['customer_id'].isin(valid_customers) &
    sales['product_id'].isin(valid_products)
]
sales = sales[(sales['quantity'] >= 1) & (sales['quantity'] <= 10)]

# Derive revenue
sales = sales.merge(products[['id', 'price']], left_on='product_id', right_on='id', how='left')
sales = sales.rename(columns={'id_x': 'id'}).drop(columns=['id_y'])
sales['revenue'] = (sales['price'] * sales['quantity']).round(2)

print(f"Cleaned sales: {len(sales)} rows")

# ---------------------------------------------------------------------------
# Step 5 — Save cleaned CSVs
# ---------------------------------------------------------------------------

customers.to_csv(CLEANED / "customers.csv", index=False)
products.to_csv(CLEANED  / "products.csv",  index=False)
sales.drop(columns=['price', 'revenue']).to_csv(CLEANED / "sales.csv", index=False)

print("Cleaned CSVs saved to data/cleaned/")

# ---------------------------------------------------------------------------
# Step 6 — Generate metrics JSON
# ---------------------------------------------------------------------------

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
print("  -> top_products.json")


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
print("  -> sales_by_region.json")


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
print("  -> sales_by_category.json")


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
print("  -> sales_by_age_group.json")


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
print("  -> sales_by_category_region.json")


print("\nETL complete. Metrics saved to data/metrics/")
