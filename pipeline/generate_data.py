import random
from faker import Faker
import pandas as pd
import numpy as np
from pathlib import Path

fake = Faker()
Faker.seed(42)
random.seed(42)
np.random.seed(42)

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Lookup tables
# ---------------------------------------------------------------------------

REGIONS    = ['North', 'South', 'East', 'West', 'Central']
CATEGORIES = ['Electronics', 'Clothing', 'Food & Beverage', 'Home & Garden', 'Sports', 'Books', 'Toys']
ADJECTIVES = ['Pro', 'Ultra', 'Lite', 'Premium', 'Essential', 'Deluxe']

PRODUCT_NAMES = {
    'Electronics':     ['Wireless Headphones', 'Smart Speaker', 'USB-C Hub', 'Webcam',
                        'Mechanical Keyboard', 'Portable Charger', 'Bluetooth Earbuds',
                        'LED Monitor', 'Laptop Stand', 'Smart Watch'],
    'Clothing':        ['Running Jacket', 'Denim Jeans', 'Cotton T-Shirt', 'Wool Sweater',
                        'Athletic Shorts', 'Rain Coat', 'Polo Shirt', 'Cargo Pants',
                        'Hoodie', 'Compression Leggings'],
    'Food & Beverage': ['Protein Bar', 'Green Tea Pack', 'Olive Oil Bottle', 'Ground Coffee',
                        'Granola Mix', 'Hot Sauce Set', 'Dried Fruit Mix', 'Sparkling Water',
                        'Energy Drink Pack', 'Honey Jar'],
    'Home & Garden':   ['Scented Candle', 'Plant Pot', 'Throw Pillow', 'Bamboo Cutting Board',
                        'Storage Basket', 'Wall Clock', 'Picture Frame', 'Desk Organizer',
                        'Garden Trowel', 'Doormat'],
    'Sports':          ['Yoga Mat', 'Resistance Bands', 'Water Bottle', 'Jump Rope',
                        'Foam Roller', 'Gym Gloves', 'Ankle Weights', 'Pull-Up Bar',
                        'Dumbbell Set', 'Skipping Rope'],
    'Books':           ['Business Strategy Guide', 'Python Programming Book', 'Self-Help Journal',
                        'Data Science Handbook', 'Fiction Novel', 'History Almanac',
                        'Cooking Recipe Book', 'Travel Photography Book',
                        'Leadership Playbook', 'Mindfulness Workbook'],
    'Toys':            ['Building Block Set', 'Remote Control Car', 'Puzzle Game',
                        'Stuffed Animal', 'Board Game', 'Science Kit', 'Art Supply Set',
                        'Action Figure', 'Card Game', 'Toy Robot'],
}

# ---------------------------------------------------------------------------
# Customers — 500 rows
# customers.csv → id, name, age, region
# ---------------------------------------------------------------------------

def generate_customers(n=500):
    records = []
    for _ in range(n):
        records.append({
            'id':     fake.uuid4(),
            'name':   fake.name(),
            'age':    random.randint(18, 75),
            'region': random.choice(REGIONS),
        })
    return pd.DataFrame(records)

# ---------------------------------------------------------------------------
# Products — 200 rows
# products.csv → id, name, category, price, supplier
# ---------------------------------------------------------------------------

# Stock ranges per category — faster-moving categories carry less stock
STOCK_RANGE = {
    'Food & Beverage': (20,  120),
    'Books':           (30,  150),
    'Clothing':        (40,  200),
    'Sports':          (40,  200),
    'Toys':            (60,  250),
    'Home & Garden':   (80,  350),
    'Electronics':     (100, 400),
}

def generate_products(n=200):
    records = []
    for _ in range(n):
        category = random.choice(CATEGORIES)
        lo, hi = STOCK_RANGE[category]
        records.append({
            'id':             fake.uuid4(),
            'name':           f"{random.choice(ADJECTIVES)} {random.choice(PRODUCT_NAMES[category])}",
            'category':       category,
            'price':          round(random.uniform(5.0, 999.0), 2),
            'supplier':       fake.company(),
            'stock_quantity': random.randint(lo, hi),
        })
    return pd.DataFrame(records)

# ---------------------------------------------------------------------------
# Sales — 5,000 rows
# sales.csv → id, customer_id, product_id, date, quantity
# ---------------------------------------------------------------------------

def generate_sales(df_customers, df_products, n=5000):
    # Weighted date distribution: Q4 2025 peaks, 2026 slightly elevated
    date_range = pd.date_range('2025-01-01', '2026-03-15')
    weights = []
    for d in date_range:
        if d.month in [11, 12]:
            weights.append(3.0)
        elif d.month == 10:
            weights.append(2.0)
        elif d.year == 2026:
            weights.append(1.5)
        else:
            weights.append(1.0)
    weights = np.array(weights)
    weights = weights / weights.sum()

    sale_dates   = np.random.choice(date_range, size=n, p=weights)
    customer_ids = df_customers['id'].sample(n=n, replace=True, random_state=42).values
    product_ids  = df_products['id'].sample(n=n,  replace=True, random_state=42).values

    records = []
    for i in range(n):
        records.append({
            'id':          fake.uuid4(),
            'customer_id': customer_ids[i],
            'product_id':  product_ids[i],
            'date':        pd.Timestamp(sale_dates[i]).strftime('%Y-%m-%d'),
            'quantity':    random.randint(1, 10),
        })
    return pd.DataFrame(records)

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    print("Generating customers...")
    df_customers = generate_customers(500)
    df_customers.to_csv(RAW_DIR / "customers.csv", index=False)
    print(f"  -> {len(df_customers)} rows saved to data/raw/customers.csv")

    print("Generating products...")
    df_products = generate_products(200)
    df_products.to_csv(RAW_DIR / "products.csv", index=False)
    print(f"  -> {len(df_products)} rows saved to data/raw/products.csv")

    print("Generating sales...")
    df_sales = generate_sales(df_customers, df_products, 5000)
    df_sales.to_csv(RAW_DIR / "sales.csv", index=False)
    print(f"  -> {len(df_sales)} rows saved to data/raw/sales.csv")

    print("\nDone. Raw CSVs written to data/raw/")
