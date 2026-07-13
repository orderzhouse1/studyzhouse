# App Store Review Notes — STUDYZHOUSE iOS

Use this text in **App Review Information → Notes**.

## Learning companion (Reader mode)

The iOS app is a **learning companion for existing students**, not a course marketplace.

- Students sign in and continue learning from courses **already available in their account**.
- Enrolled courses (free or paid purchased on the website) appear in **My Courses**.
- The app does **not** include: course catalog/marketplace, prices, Stripe, CliQ, payment proof, activation/redeem codes, Apple In-App Purchase, or any external purchase CTA or website buy link.
- Non-enrolled paid courses are not listed and cannot be opened (neutral unavailable screen).
- Account deletion is available in Settings.

## What reviewers can test

1. Log in with the test account.
2. Land on **My Courses** (or Home → My Courses).
3. Open an enrolled course → start a lesson → mark progress.
4. Confirm bottom navigation is **Home / دوراتي / حسابي** only (no Explore/Courses catalog).
5. Settings → account deletion with confirmation.

## Test account

Provide a reviewer account that already has at least one enrolled course.

## Technical

- Client sends `X-Client-Platform: ios`.
- Backend API: `https://studyzhouse.com/api/v1`
- Account deletion: `https://studyzhouse.com/account-deletion`

## Web

Course purchase and marketplace remain on the **website** only — not inside the iOS app.
