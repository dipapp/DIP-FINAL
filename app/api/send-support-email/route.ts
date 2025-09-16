import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, subject, message } = await request.json();

    if (!email || !subject || !message) {
      return NextResponse.json(
        { error: 'Email, subject, and message are required' },
        { status: 400 }
      );
    }

    // For now, just log the email (you can implement actual email sending later)
    console.log('Support email received:', { email, subject, message });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing support email:', error);
    return NextResponse.json(
      { error: 'Failed to send support email' },
      { status: 500 }
    );
  }
}
