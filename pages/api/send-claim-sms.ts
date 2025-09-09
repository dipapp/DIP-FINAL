import type { NextApiRequest, NextApiResponse } from 'next';

type SendSmsResponse = {
  message: string;
  sid?: string;
  skipped?: boolean;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SendSmsResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { to, body } = req.body || {};

  if (!to || !body) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  // If Twilio is not configured, do not fail the request. Just no-op.
  if (!sid || !token || !from) {
    console.warn('[send-claim-sms] Twilio not configured. Skipping SMS send.');
    return res.status(200).json({ message: 'SMS skipped (Twilio not configured)', skipped: true });
  }

  try {
    // Import twilio dynamically to avoid hard dependency when not configured
    // This requires `twilio` package to be installed in production.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const twilio = require('twilio');
    const client = twilio(sid, token);
    const result = await client.messages.create({ from, to, body });
    return res.status(200).json({ message: 'SMS sent', sid: result.sid });
  } catch (error: any) {
    console.error('[send-claim-sms] Failed to send SMS:', error);
    return res.status(500).json({ message: 'Failed to send SMS' });
  }
}


















