import type { NextApiRequest, NextApiResponse } from 'next';

// Deprecated: This Pages Router webhook is disabled to avoid double-processing.
// The active handler is at app/api/stripe/webhook/route.ts
export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).send('Deprecated endpoint. Use App Router /api/stripe/webhook.');
}


