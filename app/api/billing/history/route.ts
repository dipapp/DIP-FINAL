import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For now, return empty billing history
    // You can implement actual billing history later
    return NextResponse.json({ 
      billingHistory: [],
      message: 'Billing history endpoint - not implemented yet'
    });
  } catch (error) {
    console.error('Error fetching billing history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing history' },
      { status: 500 }
    );
  }
}
