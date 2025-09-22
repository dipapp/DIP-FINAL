# Dip Portal (No-Stripe Starter)

A Vercel-ready Next.js portal for Dip. Firebase auth only for now (Stripe coming later).

## Quickstart
1. `npm i`
2. Copy `.env.example` to `.env.local` and fill with Firebase web config.
3. Add your PlateToVIN API key to `.env.local`: `PLATETOVIN_API_KEY=your_api_key_here`
4. `npm run dev` (http://localhost:3000)
5. Deploy to Vercel and add the same env vars.

## What's included
- Next.js App Router + Tailwind
- Firebase Auth (Email/Password)
- Landing page, Sign-in, Sign-up, Dashboard placeholder
- Vehicle management with PlateToVIN integration
- License plate to VIN lookup functionality

## Features
- **Vehicle Management**: Add, edit, and delete vehicles
- **PlateToVIN Integration**: Automatically lookup VIN from license plate and state
- **Stripe Integration**: Payment processing for vehicle activation
- **Photo Management**: Upload and manage vehicle photos

## Environment Variables
- `PLATETOVIN_API_KEY`: Your PlateToVIN API key for license plate to VIN conversion
- Firebase configuration variables
- Stripe configuration variables

## Next steps
- Add Storage uploads (docs)
- Add Firestore vehicles & requests
- Add Stripe Checkout + webhooks later
