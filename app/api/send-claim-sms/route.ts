import { NextRequest, NextResponse } from 'next/server';

type SendSmsResponse = {
  message: string;
  sid?: string;
  skipped?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, body: messageBody } = body;

    if (!to || !messageBody) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;

    // If Twilio is not configured, do not fail the request. Just no-op.
    if (!sid || !token || !from) {
      console.warn('[send-claim-sms] Twilio not configured. Skipping SMS send.');
      return NextResponse.json({ message: 'SMS skipped (Twilio not configured)', skipped: true });
    }

    try {
      // Import twilio dynamically to avoid hard dependency when not configured
      // This requires `twilio` package to be installed in production.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const twilio = require('twilio');
      const client = twilio(sid, token);
      const result = await client.messages.create({ from, to, body: messageBody });
      return NextResponse.json({ message: 'SMS sent', sid: result.sid });
    } catch (error: any) {
      console.error('[send-claim-sms] Failed to send SMS:', error);
      return NextResponse.json({ message: 'Failed to send SMS' }, { status: 500 });
    }
  } catch (error) {
    console.error('[send-claim-sms] Request parsing error:', error);
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  }
}
