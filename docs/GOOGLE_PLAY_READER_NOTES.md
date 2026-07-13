# Google Play notes — STUDYZHOUSE Android

## Learning companion (Reader mode)

The Android app is a **learning companion for existing students**, not a course marketplace.

- Students sign in and continue learning from courses **already available in their account**.
- Enrolled courses (free or paid purchased on the website) appear in **My Courses**.
- The app does **not** include: course catalog/marketplace, prices, Stripe, CliQ, payment proof, activation/redeem codes, Google Play Billing, or any external purchase CTA or website buy link.
- Non-enrolled paid courses are not listed and cannot be opened (neutral unavailable screen).
- Account deletion is available in Settings.

## What testers can verify

1. Log in → My Courses.
2. Open an enrolled course and complete a lesson progress action.
3. Bottom nav: **Home / دوراتي / حسابي** only.
4. No CliQ, redeem, purchases, or price UI.

## Technical

- Client sends `X-Client-Platform: android`.
- Backend API: `https://studyzhouse.com/api/v1`

## Web

Course purchase and marketplace remain on the **website** only — not inside the Android app.
