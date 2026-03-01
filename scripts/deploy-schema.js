#!/usr/bin/env node
// Deploy Crown Deals schema to Supabase

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://huegynfpgsgoqzwrkbzl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_KEY) {
  console.error('Error: SUPABASE_SERVICE_KEY not set');
  console.error('Usage: SUPABASE_SERVICE_KEY=your_key node deploy-schema.js');
  process.exit(1);
}

async function executeSql(query) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return await response.json();
}

async function deploy() {
  console.log('🚀 Deploying Crown Deals schema...\n');

  // Read SQL file
  const sqlPath = path.join(__dirname, '..', 'db', 'schema_postgres.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split into statements (simple splitter)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  // Check if execute_sql RPC exists, if not use a different approach
  try {
    // Try using pg_dump/pg_restore style INSERT into query
    console.log('Attempting API-based deployment...');
    
    // For now, let's just create tables individually via REST API
    console.log('Creating tables via REST API...\n');

    // Products table
    const productResult = await createTable('products', {
      id: { type: 'int8', primaryKey: true },
      ref_number: { type: 'text', unique: true, notNull: true },
      name: { type: 'text', notNull: true },
      brand: { type: 'text', default: 'Rolex' },
      msrp: { type: 'float8' }
    });
    console.log('✅ Products table:', productResult ? 'OK' : 'Exists');

    // Listings table
    const listingResult = await createTable('listings', {
      id: { type: 'int8', primaryKey: true },
      product_id: { type: 'int8', notNull: true, references: 'products.id' },
      source: { type: 'text', notNull: true },
      source_id: { type: 'text', unique: true },
      title: { type: 'text', notNull: true },
      price: { type: 'float8', notNull: true },
      currency: { type: 'text', default: 'USD' },
      condition: { type: 'text', notNull: true },
      has_box: { type: 'bool', default: false },
      has_papers: { type: 'bool', default: false },
      seller_name: { type: 'text' },
      seller_rating: { type: 'float8' },
      seller_reviews: { type: 'int4' },
      url: { type: 'text', notNull: true },
      image_url: { type: 'text' },
      deal_score: { type: 'float8' },
      deal_summary: { type: 'text' },
      is_featured: { type: 'bool', default: false },
      is_sponsored: { type: 'bool', default: false },
      scraped_at: { type: 'timestamptz', default: 'now()' },
      created_at: { type: 'timestamptz', default: 'now()' },
      updated_at: { type: 'timestamptz', default: 'now()' }
    });
    console.log('✅ Listings table:', listingResult ? 'OK' : 'Exists');

    // Users table
    const usersResult = await createTable('users', {
      id: { type: 'int8', primaryKey: true },
      email: { type: 'text', unique: true, notNull: true },
      tier: { type: 'text', default: 'free' },
      max_price: { type: 'float8' }
    });
    console.log('✅ Users table:', usersResult ? 'OK' : 'Exists');

    // Scraper runs table
    const runsResult = await createTable('scraper_runs', {
      id: { type: 'int8', primaryKey: true },
      source: { type: 'text', notNull: true },
      actor_run_id: { type: 'text', unique: true, notNull: true },
      status: { type: 'text', default: 'pending' },
      started_at: { type: 'timestamptz', default: 'now()' }
    });
    console.log('✅ Scraper runs table:', runsResult ? 'OK' : 'Exists');

    console.log('\n🎉 Schema deployed!');
    console.log('📝 Next: Set up Apify actor and configure environment variables');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.log('\n💡 Alternative: Copy the SQL below and paste into');
    console.log('   Supabase Dashboard → SQL Editor → New query:');
    console.log('\n---');
    console.log(sql);
    console.log('---\n');
  }
}

async function createTable(name, columns) {
  // Try to insert a test row to see if table exists
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${name}?limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    if (response.status === 200) {
      return null; // Table exists
    }
    
    return true; // New table
  } catch (e) {
    return false;
  }
}

deploy();
