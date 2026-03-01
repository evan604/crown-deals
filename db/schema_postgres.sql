-- Crown Deals Database Schema (PostgreSQL for Supabase)

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    ref_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT 'Rolex',
    msrp REAL
);

-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    source_id TEXT UNIQUE,
    title TEXT NOT NULL,
    price REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    condition TEXT NOT NULL,
    has_box BOOLEAN DEFAULT false,
    has_papers BOOLEAN DEFAULT false,
    seller_name TEXT,
    seller_rating REAL,
    seller_reviews INTEGER,
    url TEXT NOT NULL,
    image_url TEXT,
    deal_score REAL,
    deal_summary TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_sponsored BOOLEAN DEFAULT false,
    scraped_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create users table (for future auth)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    tier TEXT NOT NULL DEFAULT 'free',
    max_price REAL,
    alert_keywords TEXT[],
    email_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMPTZ
);

-- Create scraper_runs table for tracking Apify jobs
CREATE TABLE IF NOT EXISTS scraper_runs (
    id SERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    actor_run_id TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending',
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMPTZ,
    items_scraped INTEGER DEFAULT 0,
    items_inserted INTEGER DEFAULT 0,
    error_message TEXT
);

-- Create price_history table for tracking trends
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price REAL NOT NULL,
    date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    source TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_ref ON products(ref_number);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_listings_product ON listings(product_id);
CREATE INDEX IF NOT EXISTS idx_listings_source ON listings(source);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_deal ON listings(deal_score);
CREATE INDEX IF NOT EXISTS idx_listings_scraped ON listings(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(is_featured, deal_score DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_source ON scraper_runs(source, started_at DESC);

-- Seed data: Popular Rolex reference numbers
INSERT INTO products (ref_number, name, brand, msrp) VALUES
    ('126610LN', 'Rolex Submariner Date (41mm, Black)', 'Rolex', 9850),
    ('126610LV', 'Rolex Submariner Date (41mm, Green)', 'Rolex', 9850),
    ('124060', 'Rolex Submariner No-Date (41mm)', 'Rolex', 9150),
    ('126711CHNR', 'Rolex GMT-Master II Root Beer', 'Rolex', 16150),
    ('126710BLNR', 'Rolex GMT-Master II Batman', 'Rolex', 10750),
    ('126710BLRO', 'Rolex GMT-Master II Pepsi', 'Rolex', 10750),
    ('126720VTNR', 'Rolex GMT-Master II Sprite', 'Rolex', 10750),
    ('116500LN', 'Rolex Daytona (White Dial)', 'Rolex', 14150),
    ('116500LN-0002', 'Rolex Daytona (Black Dial)', 'Rolex', 14150),
    ('126300', 'Rolex Datejust 41 (Blue Dial)', 'Rolex', 8950),
    ('126334', 'Rolex Datejust 41 (Fluted, Blue)', 'Rolex', 11150),
    ('126200', 'Rolex Datejust 36 (Black Dial)', 'Rolex', 7850),
    ('228238', 'Rolex Day-Date 40 (Yellow Gold)', 'Rolex', 42650),
    ('228239', 'Rolex Day-Date 40 (White Gold)', 'Rolex', 44750),
    ('124300', 'Rolex Oyster Perpetual 41 (Tiffany Blue)', 'Rolex', 6450),
    ('126000', 'Rolex Oyster Perpetual 36 (Coral Red)', 'Rolex', 6050)
ON CONFLICT (ref_number) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security) - required for Supabase
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (listings/products are public)
CREATE POLICY "Allow public read access on products" ON products
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on listings" ON listings
    FOR SELECT USING (true);

-- Authenticated users can read scraper_runs
CREATE POLICY "Allow authenticated read on scraper_runs" ON scraper_runs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can write
CREATE POLICY "Allow service role write on listings" ON listings
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role write on products" ON products
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role write on scraper_runs" ON scraper_runs
    FOR ALL USING (auth.role() = 'service_role');

-- Users table: users can see their own data
CREATE POLICY "Users can read their own data" ON users
    FOR SELECT USING (auth.uid()::text = email);

-- Grant usage
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Enable realtime for listings (optional)
BEGIN;
  -- Publications for realtime
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
  ALTER PUBLICATION supabase_realtime ADD TABLE listings;
COMMIT;
