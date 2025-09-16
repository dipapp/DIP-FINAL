import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // For now, just log the SMS (you can implement actual SMS sending later)
    console.log('SMS claim received:', { phoneNumber, message });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing SMS claim:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS claim' },
      { status: 500 }
    );
  }
}
