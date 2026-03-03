// CrownDeals Deal Scoring API Route
// POST /api/score — Takes a listing and returns AI-deal-score

import { NextRequest, NextResponse } from 'next/server';

interface ListingInput {
  title: string;
  price: number;
  condition: string;
  has_box?: boolean;
  has_papers?: boolean;
  seller_rating?: number;
  source: string;
  url: string;
  reference?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ListingInput = await request.json();
    
    // Validate required fields
    if (!body.title || !body.price || !body.condition) {
      return NextResponse.json(
        { error: 'Missing required fields: title, price, condition' },
        { status: 400 }
      );
    }

    // Call Claude API for scoring
    const scoreResult = await scoreWithClaude(body);
    
    return NextResponse.json(scoreResult);
  } catch (error) {
    console.error('Scoring error:', error);
    return NextResponse.json(
      { error: 'Failed to score deal', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function scoreWithClaude(listing: ListingInput) {
  const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;
  
  if (!CLAUDE_API_KEY) {
    // Fallback scoring if no API key
    return {
      deal_score: calculateFallbackScore(listing),
      deal_summary: "Fallback scoring (no Claude API)",
      confidence: "low",
      key_factors: ["Price check only", "API key needed"],
      source: "fallback"
    };
  }

  const prompt = buildScoringPrompt(listing);
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',  // Fast & cheap for scoring
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '{}';
    
    // Parse JSON from Claude response
    try {
      const parsed = JSON.parse(content);
      return {
        ...parsed,
        source: "claude"
      };
    } catch {
      // If Claude didn't return valid JSON, fall back
      return {
        deal_score: calculateFallbackScore(listing),
        deal_summary: content.substring(0, 200),
        confidence: "medium",
        key_factors: ["Partial AI parse"],
        source: "claude-partial"
      };
    }
  } catch (error) {
    console.error('Claude API error:', error);
    return {
      deal_score: calculateFallbackScore(listing),
      deal_summary: "Claude API failed, using fallback",
      confidence: "low",
      key_factors: ["API error"],
      source: "fallback"
    };
  }
}

function buildScoringPrompt(listing: ListingInput): string {
  return `You are DealScorer, an expert in luxury watch market analysis. Score this Rolex listing 0-10.

LISTING:
- Title: ${listing.title}
- Price: $${listing.price}
- Condition: ${listing.condition}
- ${listing.has_box ? 'Has box' : 'No box'}
- ${listing.has_papers ? 'Has papers' : 'No papers'}
- Seller Rating: ${listing.seller_rating || 'unknown'}/100
- Source: ${listing.source}

SCORING (0-10 scale):
- 0-3: Overpriced or suspicious
- 4-5: Fair/Average market price
- 6-7: Good deal, slightly below market
- 8-9: Excellent deal, well below market
- 10: Exceptional/rare opportunity

Respond ONLY with JSON:
{
  "deal_score": number,
  "deal_summary": "one sentence why",
  "confidence": "high/medium/low",
  "key_factors": ["factor1", "factor2", "factor3"]
}`;
}

function calculateFallbackScore(listing: ListingInput): number {
  // Simple heuristic scoring when Claude unavailable
  let score = 5; // Average
  
  // Price heuristics
  if (listing.price < 8000) score += 1; // Good price
  if (listing.price < 5000) score += 2; // Suspiciously low (but maybe good?)
  if (listing.price > 15000) score -= 1; // High end
  
  // Condition
  if (listing.condition.toLowerCase().includes('new')) score += 1;
  if (listing.condition.toLowerCase().includes('excellent')) score += 0.5;
  if (listing.condition.toLowerCase().includes('poor')) score -= 1;
  
  // Completeness
  if (listing.has_box && listing.has_papers) score += 1;
  else if (listing.has_papers) score += 0.5;
  
  // Seller
  if (listing.seller_rating && listing.seller_rating > 95) score += 0.5;
  if (listing.seller_rating && listing.seller_rating < 50) score -= 1;
  
  return Math.max(0, Math.min(10, score));
}
