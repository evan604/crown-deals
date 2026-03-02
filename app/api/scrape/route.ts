import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Manual trigger for scraper runs
// POST /api/scrape - Trigger scraper manually
// GET /api/scrape/poll - Check for new listings & process

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, force = false } = body;
    
    // TODO: Trigger Apify actor run
    // const run = await triggerApifyScraper(source);
    
    // TODO: Store run ID for polling
    // await supabase.from('scraper_runs').insert({ source, run_id: run.id });
    
    // Placeholder response
    return NextResponse.json({
      success: true,
      message: `Scraper triggered for ${source}`,
      placeholders: {
        implementation: 'Call Apify API, store run ID, return for polling'
      }
    });
    
  } catch (error) {
    console.error('Scrape trigger error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger scraper' },
      { status: 500 }
    );
  }
}

// Webhook handler for Apify results
export async function PUT(request: NextRequest) {
  try {
    const signature = request.headers.get('x-apify-webhook-secret');
    
    // TODO: Verify webhook signature
    // if (signature !== process.env.APIFY_WEBHOOK_SECRET) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    const body = await request.json();
    const { data, source } = body;
    
    // Normalize and insert listings
    const