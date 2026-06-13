# Google Play — Internal Testing Preparation (STUDYZHOUSE)

Student Flutter app · Package **`com.studyzhouse.app`** · Display name **STUDYZHOUSE**

Use this guide after release signing is configured ([ANDROID_RELEASE_SIGNING.md](./ANDROID_RELEASE_SIGNING.md)) and before promoting beyond internal testing.

**Prerequisites**

- Google Play Developer account (one-time registration fee applies)
- Upload keystore + `key.properties` (do **not** commit to Git)
- Signed `app-release.aab` built with upload key
- Privacy policy URL live and accurate

---

## 1. Pre-flight (before Play Console)

| Step | Action | Done |
|------|--------|------|
| 1 | Create `upload-keystore.jks` and `android/key.properties` locally | ☐ |
| 2 | Build bundle: `flutter build appbundle --release --dart-define=API_BASE_URL=https://studyzhouse.com/api/v1` | ☐ |
| 3 | Confirm file: `apps/mobile/build/app/outputs/bundle/release/app-release.aab` | ☐ |
| 4 | Uninstall old APK (`com.studyzhouse.studyzhouse_mobile`) from test devices | ☐ |
| 5 | Run unit tests: `flutter test` | ☐ |

> Uploading a bundle signed only with **debug** keys will fail or is unsuitable for Play. Use upload signing per [ANDROID_RELEASE_SIGNING.md](./ANDROID_RELEASE_SIGNING.md).

---

## 2. Create the app in Google Play Console

1. Open [Google Play Console](https://play.google.com/console).
2. **Home** → **Create app**.
3. Fill in:

| Field | Value |
|-------|--------|
| **App name** | `STUDYZHOUSE` |
| **Default language** | **Arabic (العربية)** — primary UI is Arabic RTL |
| **App or game** | App |
| **Free or paid** | Free (unless you later sell on Play) |

4. Accept declarations (Developer Program Policies, US export laws, etc.).
5. **Create app**.

### Package name (critical — cannot change later)

When you upload the first release, Play links the app to:

```
com.studyzhouse.app
```

**Confirm** this matches `applicationId` in `apps/mobile/android/app/build.gradle.kts` before the first upload.

Do **not** create a second Play app with a different package id.

### App category (recommendations)

| Play Console field | Recommendation | Notes |
|--------------------|----------------|-------|
| **Category** | **Education** | Online courses, learning, student dashboard |
| **Tags** (if available) | Education, Learning, Courses | Pick only tags that match real features |
| **Content rating** | Complete questionnaire honestly | No gambling/violence; user-generated content only if applicable |
| **Target audience** | Adults / general learning audience per your policy | Align with signup age rules on studyzhouse.com |

Secondary tags to avoid unless accurate: Games, Social networking.

---

## 3. Play App Signing

On first **AAB** upload, Google prompts for **Play App Signing**.

| Option | Recommendation |
|--------|----------------|
| Let Google manage app signing key | **Recommended** for most teams |
| Upload key | Your local `upload-keystore.jks` (keep backup + passwords) |

After enrollment:

- Google holds the **app signing key** used for devices.
- You keep the **upload key** for future AAB uploads.
- Store upload keystore backup in a secure vault.

---

## 4. Upload `app-release.aab`

1. Play Console → **STUDYZHOUSE** → **Test and release** → **Testing** → **Internal testing** (or **Production** → first create internal track).
2. **Create new release** (internal testing track).
3. **Upload** → select:

   ```
   apps/mobile/build/app/outputs/bundle/release/app-release.aab
   ```

4. Wait for processing (signing, bundle analysis). Fix any blocking errors (version code, permissions, policy).
5. Add **Release name** (e.g. `1.0.0 (1) internal`) and **Release notes** (Arabic example below).

**Release notes (internal, Arabic — draft)**

```
الإصدار الأول للاختبار الداخلي:
- تسجيل الدخول وإنشاء حساب
- استكشاف الكورسات والتعلّم عبر YouTube
- تفعيل الكورسات وطلبات الدفع CliQ
- الإشعارات والملف الشخصي
```

6. **Save** (do not roll out until store listing minimum is met — see §6).

---

## 5. Internal testing track

### Create / use internal testing

1. **Test and release** → **Testing** → **Internal testing**.
2. If no track exists, follow console prompts to create **Internal testing**.
3. Attach the release with uploaded AAB.
4. **Testers** → **Create email list** (e.g. `internal-qa@yourdomain` list name).
5. Add tester Gmail addresses (max 100 for internal testing).
6. Copy the **opt-in link** from the internal testing page.
7. **Review release** → **Start rollout to Internal testing**.

Testers open the opt-in link on Android, accept, then install from Play Store (not sideload).

### Who should be on the list

- Core team Gmail accounts
- QA volunteers with physical Android devices
- No public link until you intend wider testing (closed/open tracks later)

---

## 6. Store listing (draft content)

Paste into Play Console → **Grow** → **Store presence** → **Main store listing**. Adjust tone to match your brand; keep claims factual.

### Arabic — short description (≤ 80 characters)

```
منصة تعليمية للطلاب: كورسات، تعلّم، تفعيل أكواد، وطلبات دفع CliQ.
```

### Arabic — full description

```
STUDYZHOUSE تطبيق للطلاب فقط.

استكشف الكورسات، تابع دروسك عبر فيديو YouTube، واحفظ الكورسات المفضّلة. فعّل الكورسات بأكواد التفعيل أو أرسل طلب دفع CliQ للمراجعة من الإدارة.

الميزات:
• لوحة تحكم للطالب
• استكشاف الكورسات مع بحث وتصنيفات
• مشغّل تعلّم مع إكمال الدروس
• تفعيل كورس بكود
• طلبات دفع CliQ وسجل المشتريات
• إشعارات داخل التطبيق
• الملف الشخصي والإعدادات ومركز المساعدة

يتطلب حساب طالب على studyzhouse.com. التطبيق باللغة العربية (واجهة RTL).

ملاحظات: لا يتضمن التطبيق تنزيل فيديو للاستخدام دون اتصال، ولا إشعارات دفع (Push)، ولا تسجيل دخول Google على الجوال في هذا الإصدار.
```

### English — short description (≤ 80 characters)

```
Student learning app: courses, lessons, activation codes, CliQ payment requests.
```

### English — full description

```
STUDYZHOUSE is a student-only mobile app for the STUDYZHOUSE platform.

Browse courses, watch lessons via YouTube, save favorites, redeem activation codes, and submit CliQ payment requests for manual admin review.

Features:
• Student dashboard
• Course explore with search and filters
• Learning player with lesson completion
• Course activation codes
• CliQ payment requests and purchase history
• In-app notifications
• Profile, settings, and help center

Requires a student account. The app UI is Arabic (RTL).

This version does not include offline video downloads, push notifications, or Google Sign-In on mobile.
```

### Keywords / feature highlights (for planning — not all appear on Play)

Use these internally for screenshots captions and future ASO; Play does not use a keyword field like iOS.

| Theme | Phrases |
|-------|---------|
| Learning | online courses, lessons, YouTube learning |
| Student | student dashboard, my courses, saved courses |
| Access | activation code, course redeem |
| Payments | CliQ payment request (manual review) |
| Arabic | Arabic RTL, Jordan / MENA education (if accurate for your audience) |

### Contact & legal (required)

| Field | Value |
|-------|--------|
| **Privacy policy URL** | https://studyzhouse.com/privacy-policy |
| **Terms** (if field available) | https://studyzhouse.com/terms |
| **Refund policy** (if relevant) | https://studyzhouse.com/refund-policy |
| **Support email** | support@studyhouse.app |

---

## 7. Required assets checklist

| Asset | Spec (typical) | Status in repo | Action |
|-------|----------------|----------------|--------|
| **App icon** | 512×512 PNG, 32-bit | Source: `apps/mobile/assets/branding/app_icon.png` | Export high-res 512×512 for Play upload |
| **Feature graphic** | 1024×500 PNG or JPG | **Not in repo** | Design: logo + tagline on navy `#151F35` |
| **Phone screenshots** | Min 2; recommend 4–8, 16:9 or device frames | **Not in repo** | Capture: home, explore, learn, profile |
| **7-inch / 10-inch tablet** | Optional for v1 | — | Skip unless targeting tablets |
| **Privacy policy URL** | HTTPS, publicly accessible | URL documented | Verify page loads in browser |
| **Support email** | Monitored inbox | support@studyhouse.app | Confirm mailbox works |

Suggested screenshot set:

1. Home / dashboard  
2. Explore courses  
3. Course detail  
4. Learn player  
5. Profile / account hub  
6. Redeem or purchases (optional)

---

## 8. Pre-upload / post-upload QA (internal testing)

Install via **internal testing opt-in link** (Play Store build, not `adb install` of debug APK).

| # | Area | Check | Pass |
|---|------|-------|------|
| 1 | Install | Opt-in link → Install → App opens | ☐ |
| 2 | Splash / login | Splash → login; invalid password shows Arabic error | ☐ |
| 3 | Login | Student account logs in → home | ☐ |
| 4 | Admin blocked | Admin login rejected (student-only) | ☐ |
| 5 | Courses | Home + explore load; open course detail | ☐ |
| 6 | Saved | Save/unsave course | ☐ |
| 7 | Learn | Enrolled course: `/learn/:slug`, video or placeholder | ☐ |
| 8 | Learn gate | Non-enrolled: no access message | ☐ |
| 9 | Payments | Submit CliQ request; history visible | ☐ |
| 10 | Redeem | Valid/invalid code messages | ☐ |
| 11 | Notifications | List, mark read, mark all read | ☐ |
| 12 | Profile | Edit profile save; settings links open | ☐ |
| 13 | Network | Airplane mode shows Arabic connection error | ☐ |
| 14 | Session | Logout → login again | ☐ |

Full matrix: [MOBILE_FLUTTER_PHASE_6_QA.md](./MOBILE_FLUTTER_PHASE_6_QA.md).

Record: device model, Android version, build version (`1.0.0+1`), tester, date.

---

## 9. Play Console checklist (dashboard)

Complete items Play shows before production (many apply to internal testing visibility):

| Item | Notes |
|------|--------|
| App access | Declare if login required (yes — student account) |
| Ads | No ads → declare accordingly |
| Content rating | Submit questionnaire |
| Target audience | Accurate age bands |
| Data safety | Declare data collected (email, profile, usage) per actual API |
| Store listing | Arabic + English text, graphics, contact email |
| Internal testing release | AAB uploaded + rolled out |
| Testers | Email list + opt-in link shared |

---

## 10. Troubleshooting

| Issue | Likely cause |
|-------|----------------|
| Upload rejected: wrong signature | Rebuild AAB with `key.properties` / upload keystore |
| Package name mismatch | AAB must be `com.studyzhouse.app` |
| Testers cannot install | Not on list, or rollout not started, or wrong Google account |
| “Item not found” on opt-in link | Release not published to internal track yet |
| Login fails on Play build | API URL must be production; check `API_BASE_URL` at build time |

---

## 11. After internal testing passes

1. Fix bugs from QA → bump `version:` in `apps/mobile/pubspec.yaml` → rebuild AAB.  
2. Promote to **Closed testing** (optional) with wider tester list.  
3. Prepare **Production** rollout (staged % recommended).  
4. Keep [MOBILE_RELEASE_READINESS.md](./MOBILE_RELEASE_READINESS.md) updated.

---

## Related docs

- [ANDROID_RELEASE_SIGNING.md](./ANDROID_RELEASE_SIGNING.md)
- [MOBILE_RELEASE_READINESS.md](./MOBILE_RELEASE_READINESS.md)
- [MOBILE_FLUTTER_PHASE_6_QA.md](./MOBILE_FLUTTER_PHASE_6_QA.md)
- [apps/mobile/README.md](../apps/mobile/README.md)
