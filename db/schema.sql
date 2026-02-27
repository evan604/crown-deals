-- Crown Deals Database Schema

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ref_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    msrp REAL NOT NULL
);

CREATE TABLE listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    source TEXT NOT NULL,
    price REAL NOT NULL,
    condition TEXT NOT NULL,
    seller_rating REAL,
    deal_score REAL,
    scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    tier TEXT NOT NULL,
    max_price REAL
);

-- Indexes
CREATE INDEX idx_products_ref ON products(ref_number);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_listings_product ON listings(product_id);
CREATE INDEX idx_listings_source ON listings(source);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_deal ON listings(deal_score);
CREATE INDEX idx_listings_scraped ON listings(scraped_at);
CREATE INDEX idx_users_email ON users(email);
