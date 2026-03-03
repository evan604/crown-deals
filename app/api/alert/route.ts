// CrownDeals Alert System
// POST /api/alert — Trigger alerts for deals matching user criteria

import { NextRequest, NextResponse } from 'next/server';

interface AlertPayload {
  listing_id: string;
  deal_score: number;
  force?: boolean; // Override user thresholds for testing
}

export async function POST(request: NextRequest) {
  try {
    const body: AlertPayload = await request.json();
    
    if (!body.listing_id) {
      return NextResponse.json(
        { error: 'listing_id required' },
        { status: 400 }
      );
    }

    // Get matching users from waitlist/subscribers
    const matches = await findMatchingUsers(body.listing_id, body.deal_score);
    
    // Send alerts
    const results = await Promise.allSettled(
      matches.map(user => sendAlert(user, body))
    );
    
    return NextResponse.json({
      sent: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      users_notified: matches.length
    });
  } catch (error) {
    console.error('Alert error:', error);
    return NextResponse.json(
      { error: 'Failed to send alerts' },
      { status: 500 }
    );
  }
}

async function findMatchingUsers(listingId: string, minScore: number) {
  // TODO: Query Supabase for users with:
  // - alert_threshold <= deal_score
  // - Preferences match listing category
  // - email_notifications enabled
  
  // Mock users for now
  return [
    { email: 'evan@example.com', tier: 'premium', phone: '+1234567890' },
    { email: 'test@example.com', tier: 'collector', phone: null }
  ];
}

async function sendAlert(user: any, payload: AlertPayload) {
  const alerts = [];
  
  // Email alert (all tiers)
  if (user.email) {
    alerts.push(sendEmailAlert(user, payload));
  }
  
  // SMS alert (Premium tier only)
  if (user.tier === 'premium' && user.phone) {
    alerts.push(sendSMSAlert(user, payload));
  }
  
  await Promise.all(alerts);
}

async function sendEmailAlert(user: any, payload: AlertPayload) {
  // TODO: Integrate Resend
  console.log('📧 Email alert would send to:', user.email, 'for deal score:', payload.deal_score);
  return { sent: true, channel: 'email' };
}

async function sendSMSAlert(user: any, payload: AlertPayload) {
  // TODO: Integrate Twilio
  console.log('📱 SMS alert would send to:', user.phone, 'for deal score:', payload.deal_score);
  return { sent: true, channel: 'sms' };
}
