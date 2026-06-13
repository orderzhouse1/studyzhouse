# Flutter Phase 6 — Manual QA Checklist

Use production API: `https://studyzhouse.com/api/v1`

Run app:

```bash
cd apps/mobile
flutter run --dart-define=API_BASE_URL=https://studyzhouse.com/api/v1
```

Record: device model, OS version, build mode (debug/release), tester name, date.

---

## Auth

| # | Scenario | Steps | Expected | Pass |
|---|----------|-------|----------|------|
| A1 | Splash without token | Fresh install / clear app data → open app | Splash → login screen | ☐ |
| A2 | Login — student | Valid student email + password | Home loads, token stored | ☐ |
| A3 | Login — admin rejected | Admin account credentials | Arabic student-only message, stays on login | ☐ |
| A4 | Invalid password | Wrong password for known student | Arabic invalid credentials message | ☐ |
| A5 | Signup OTP | Full signup → enter OTP | Account created or pending per API rules | ☐ |
| A6 | Forgot password | Request reset → complete flow | Success message, can login with new password | ☐ |
| A7 | Expired session | Login → invalidate token server-side or wait expiry → navigate | Redirect to login with session message | ☐ |
| A8 | Invalid session token | Corrupt secure storage token manually (dev) | Splash/login, no crash | ☐ |

---

## Courses

| # | Scenario | Steps | Expected | Pass |
|---|----------|-------|----------|------|
| C1 | Home loads | Login → Home tab | Dashboard stats, previews, no raw errors | ☐ |
| C2 | Explore loads | Courses tab | List + filters visible | ☐ |
| C3 | Search | Enter search term → بحث | Filtered results | ☐ |
| C4 | Category filter | Tap category chip | Filtered by category | ☐ |
| C5 | Pricing filter | مجاني / مدفوع chips | Filtered by pricing type | ☐ |
| C6 | Course detail | Tap course card | Detail page, thumbnail, actions | ☐ |
| C7 | Save course | Tap save on explore/detail | Saved state updates | ☐ |
| C8 | Unsave course | Tap save again | Removed from saved | ☐ |
| C9 | My courses — empty | New student with no enrollments | Empty state + CTA to explore | ☐ |
| C10 | My courses — populated | Enrolled student | List with continue learning | ☐ |
| C11 | Saved — empty / filled | Profile → المحفوظات | Correct empty or list state | ☐ |

---

## Learning

| # | Scenario | Steps | Expected | Pass |
|---|----------|-------|----------|------|
| L1 | Learn — enrolled | Open `/learn/:slug` for enrolled course | Player + syllabus load | ☐ |
| L2 | Learn — not enrolled | Open learn URL without access | Arabic forbidden / no access message | ☐ |
| L3 | YouTube plays | Lesson with valid YouTube ID | Video embed loads | ☐ |
| L4 | Missing/invalid video | Lesson without valid ID | Placeholder: لا يوجد فيديو | ☐ |
| L5 | Previous lesson | Tap previous when available | Switches lesson, URL updates | ☐ |
| L6 | Next lesson | Tap next when available | Switches lesson | ☐ |
| L7 | Mark complete | Tap complete on incomplete lesson | UI shows completed, no crash | ☐ |
| L8 | Progress bar | After complete | Progress reflects update in UI | ☐ |

---

## Utilities

| # | Scenario | Steps | Expected | Pass |
|---|----------|-------|----------|------|
| U1 | Redeem — valid | Profile → تفعيل كورس → valid code | Success + start learning CTA | ☐ |
| U2 | Redeem — invalid | Bad code | Arabic error, no crash | ☐ |
| U3 | Redeem — expired | Expired code | CODE_EXPIRED message | ☐ |
| U4 | Redeem — already used | Reuse code | ALREADY_REDEEMED message | ☐ |
| U5 | Payment submit | Purchases → fill form → submit | Success snackbar, appears in history | ☐ |
| U6 | Purchases/history | Open purchases screen | CliQ info, requests, purchase list | ☐ |
| U7 | Notifications list | Open notifications | List loads, read/unread styling | ☐ |
| U8 | Mark one read | Tap notification | Marked read, navigates if actionUrl | ☐ |
| U9 | Mark all read | تحديد الكل كمقروء | All marked read | ☐ |
| U10 | Profile edit | Edit fields → save | Success, data persists on reload | ☐ |
| U11 | Settings | Open settings | Account, password link, legal, logout | ☐ |
| U12 | Help | Open help | FAQ expands, links open externally | ☐ |

---

## Network

| # | Scenario | Steps | Expected | Pass |
|---|----------|-------|----------|------|
| N1 | No internet | Airplane mode → refresh screen | Arabic connection error + retry | ☐ |
| N2 | Slow network | Throttle connection (dev tools) | Loading states, no ANR | ☐ |
| N3 | API 401 | Expired token mid-session | Redirect to login | ☐ |
| N4 | API 500 | Simulate server error (proxy) | Arabic server error, retry where offered | ☐ |
| N5 | Broken thumbnail | Course with bad image URL | Placeholder, no crash | ☐ |

---

## Devices

Test on as many as available:

| Device class | Model (fill in) | OS | Pass |
|--------------|-----------------|-----|------|
| Small Android | | | ☐ |
| Large Android | | | ☐ |
| Small iPhone | | | ☐ |
| Large iPhone | | | ☐ |
| Tablet (optional) | | | ☐ |

Checklist per device:

- RTL layout correct
- Bottom nav usable
- Keyboard does not cover forms
- YouTube player visible (16:9)
- No overflow yellow stripes on home/explore/profile

---

## Regression smoke (5 min)

1. Login → Home → Explore → Course detail → Back  
2. Profile → Redeem (cancel) → Purchases → Notifications  
3. My courses → Learn one lesson → Mark complete → Back  
4. Logout → Login again  

---

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Developer | | | |
| QA / Product | | | |
