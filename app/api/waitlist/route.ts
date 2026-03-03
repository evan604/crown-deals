// CrownDeals Waitlist API Route
// POST /api/waitlist — Add email to waitlist

import { NextRequest, NextResponse } from 'next/server';

interface WaitlistEntry {
  email: string;
  name?: string;
  preferred_models?: string[];
  max_budget?: number;
  tier_interest?: 'free' | 'collector' | 'premium';
}

export async function POST(request: NextRequest) {
  try {
    const body: WaitlistEntry = await request.json();
    
    if (!body.email || !isValidEmail(body.email)) {
      return NextResponse.json(
        { error: 'Valid email required' },
        { status: 400 }
      );
    }

    // Store in Supabase if configured, otherwise log
    const result = await storeWaitlistEntry(body);
    
    return NextResponse.json({
      success: true,
      message: 'Added to waitlist',
      position: result.position
    });
  } catch (error) {
    console.error('Waitlist error:', error);
    return NextResponse.json(
      { error: 'Failed to add to waitlist' },
      { status: 500 }
    );
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function storeWaitlistEntry(entry: WaitlistEntry) {
  // TODO: Connect to Supabase once configured
  // For now, log to console (will be stored locally)
  console.log('Waitlist entry:', {
    ...entry,
    joined_at: new Date().toISOString()
  });
  
  return { position: Math.floor(Math.random() * 100) + 1 }; // Placeholder
}
