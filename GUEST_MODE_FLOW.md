# Guest Mode User Flow

## Current Implementation (Like iOS App)

```
┌─────────────────────────────────────────────────────────────┐
│                         Landing Page                         │
│                                                              │
│  - Guests can view without redirect                         │
│  - No forced login                                          │
│  - Navbar shows "Sign In" and "Join Now" buttons           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├──► Guest clicks "Marketplace" in navbar
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Marketplace (Guest View)                  │
│                                                              │
│  ✅ CAN DO:                                                  │
│    - Browse all listings                                    │
│    - Search and filter                                      │
│    - View listing details                                   │
│    - See photos and descriptions                            │
│    - View prices and locations                              │
│                                                              │
│  🔒 TRIGGERS AUTH PROMPT:                                    │
│    - Click "Post Listing"                                   │
│    - Click "Inbox"                                          │
│    - Click "My Listings"                                    │
│    - Click "Message Seller"                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├──► Guest tries protected action
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Auth Prompt Modal                         │
│                  (iOS-style popup)                          │
│                                                              │
│  ┌─────────────────────────────────────┐                   │
│  │   🏪  Sign in / Sign up             │                   │
│  │                                      │                   │
│  │   [Custom Message Here]             │                   │
│  │                                      │                   │
│  │   ┌────────────────────────────┐   │                   │
│  │   │   Create Account           │   │                   │
│  │   └────────────────────────────┘   │                   │
│  │   ┌────────────────────────────┐   │                   │
│  │   │   Sign In                  │   │                   │
│  │   └────────────────────────────┘   │                   │
│  │   ┌────────────────────────────┐   │                   │
│  │   │   Continue Browsing        │   │                   │
│  │   └────────────────────────────┘   │                   │
│  └─────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
           │              │                    │
           │              │                    │
           ▼              ▼                    ▼
    Create Account    Sign In           Close Modal
    (/auth/sign-up) (/auth/sign-in)  (Keep Browsing)
```

## Dashboard Tabs (Guest View)

```
┌─────────────────────────────────────────────────────────────┐
│                         Dashboard                            │
│                                                              │
│  Navigation Tabs:                                           │
│                                                              │
│  🔓 Marketplace  ────────► Open (Guest can browse)          │
│  🔒 Wallet       ────────► Locked (Shows auth prompt)       │
│  🔒 Add Vehicle  ────────► Locked (Shows auth prompt)       │
│  🔒 Coupons      ────────► Locked (Shows auth prompt)       │
│  🔒 Account      ────────► Locked (Shows auth prompt)       │
│                                                              │
│  Lock icons (🔒) appear on tabs requiring sign-in          │
└─────────────────────────────────────────────────────────────┘
```

## Comparison: iOS App vs Web App

### iOS App Behavior ✅
```
1. Open app → No login required
2. Browse marketplace → See all listings
3. Try to use feature → Sign in prompt appears
4. Choose: Sign in, Sign up, or Continue browsing
```

### Web App Behavior (AFTER Implementation) ✅
```
1. Open website → No redirect to login
2. Browse marketplace → See all listings
3. Try to use feature → Sign in modal appears
4. Choose: Sign in, Sign up, or Continue browsing
```

**They now match perfectly!** 🎉

## Protected vs Public Features

### 🔓 PUBLIC (No auth required)
- Homepage
- Marketplace browsing
- View listing details
- Search/filter listings
- View photos
- View prices and locations

### 🔒 PROTECTED (Auth required)
- Post listings
- Send messages
- View inbox
- View my listings
- Add vehicles
- View wallet
- Request coupons
- View/edit profile
- Make purchases

## Custom Messages by Feature

```typescript
// When guest tries to post listing
requireAuth('Sign in to post a listing');

// When guest tries to view inbox
requireAuth('Sign in to view your messages');

// When guest tries to message seller
requireAuth('Sign in to message the seller');

// When guest tries to view their listings
requireAuth('Sign in to view your listings');

// Generic fallback
requireAuth('Sign in to continue');
```

## Technical Flow

```
┌──────────────┐
│  Guest User  │
│              │
│  No Auth     │
└──────┬───────┘
       │
       ├──► Browse Public Content ✅
       │    - Marketplace listings
       │    - Homepage
       │    - Search results
       │
       └──► Try Protected Action ❌
            │
            ▼
       ┌────────────────┐
       │ useGuestMode() │──► requireAuth('message')
       └────────────────┘
            │
            ▼
       ┌──────────────────┐
       │  Modal Appears   │
       │                  │
       │  GuestModeContext│
       │  shows AuthPrompt│
       └──────────────────┘
```

## User Journey Example

**Scenario: Guest wants to buy a car**

```
1. Google Search → Finds DIP listing
   ↓
2. Clicks link → Opens marketplace page
   ✅ No login required
   ↓
3. Browses listings → Finds interesting car
   ✅ Can see all details
   ↓
4. Clicks "Message Seller"
   🔒 Auth prompt appears
   ↓
5. Chooses to create account
   ↓
6. Signs up → Returns to listing
   ↓
7. Messages seller ✅
```

## Code Structure

```
dip_portal/
├── contexts/
│   └── GuestModeContext.tsx       ← Global state management
│
├── components/
│   └── AuthPromptModal.tsx        ← Reusable auth modal
│
├── app/
│   ├── layout.tsx                 ← Wrapped in GuestModeProvider
│   │
│   ├── page.tsx                   ← Removed auto-redirect
│   │
│   └── dashboard/
│       ├── layout.tsx             ← Shows locked tabs
│       │
│       └── marketplace/
│           └── page.tsx           ← Uses useGuestMode()
```

## Benefits Summary

✅ **Lower Friction** - Explore before signing up
✅ **Consistent UX** - Matches iOS app behavior
✅ **Better SEO** - Public content indexable
✅ **Social Sharing** - Share listings with non-members
✅ **Conversion** - See value before registering
✅ **Mobile-First** - Responsive design
