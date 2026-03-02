import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// AI-powered deal scoring
// POST /api/score - Score a specific listing
// POST /api/score/batch - Score all unscored listings

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listing_id, batch = false } = body;
    
    if (batch) {
      // Queue all unscored listings for scoring
      const { data: listings } = await supabase
        .from('listings')
        .select('*')
        .is('deal_score', null)
        .limit(50);
      
      // TODO: Call Claude API for each listing
      // const scores = await Promise.all(listings.map(scoreListing));
      
      // TODO: Update listings with scores
      // await supabase.from('listings').upsert(scores);
      
      return NextResponse.json({
        message: `Scored ${listings?.length || 0} listings`,
        placeholder: 'Claude API integration pending'
      });
    }
    
    // Single listing score
    const { data: listing } = await supabase
      .from('listings')
      .select('*, products(*)')
      .eq('id', listing_id)
      .single();
    
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    
    // TODO: Call Claude API
    // const score = await scoreWithClaude(listing);
    
    // TODO: Update listing
    // await supabase.from('listings').update(score).eq('id', listing_id);
    
    // Placeholder response
    return NextResponse.json({
      listing_id,
      placeholder_score: 7.5,
      placeholder_summary: 'AI scoring pending - account required',
      criteria: {
        price_vs_historical: 0.35,
        price_vs_retail: 0.25,
        condition_completeness: 0.20,
        rarity_status: 0.15,
        seller_reliability: 0.05
      }
    });
    
  } catch (error) {
    console.error('Scoring error:', error);
    return NextResponse.json(
      { error: 'Scoring failed' },
      { status: 500 }
    );
  }
}

// Helper: Score single listing with Claude API
async function scoreListing(listing: any): Promise<number> {
  // TODO: Implement Claude API call
  // 1. Fetch 90-day price history
  // 2. Build prompt with weights
  // 3. Call Claude
  // 4. Parse response
  // 5. Return score + summary
  
  return 7.0; // Placeholder
}
