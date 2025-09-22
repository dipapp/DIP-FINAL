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
- Firebase Auth (Email/Password + Google/Apple OAuth)
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

## OAuth Setup (Google & Apple)

To enable Google and Apple sign-in, you need to configure OAuth providers in Firebase Console:

### Google OAuth Setup:
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable "Google" provider
3. Add your domain to authorized domains
4. No additional configuration needed

### Apple OAuth Setup:
1. Go to Firebase Console → Authentication → Sign-in method  
2. Enable "Apple" provider
3. You'll need to configure Apple Developer account:
   - Create an App ID in Apple Developer Console
   - Create a Service ID for web authentication
   - Download the Apple Sign In key (.p8 file)
   - Add the key ID and team ID to Firebase

### Required Apple Developer Setup:
- App ID with "Sign In with Apple" capability
- Service ID for web authentication
- Private key (.p8 file) from Apple Developer Console
- Configure domains and redirect URLs

## Next steps
- Add Storage uploads (docs)
- Add Firestore vehicles & requests
- Add Stripe Checkout + webhooks later
