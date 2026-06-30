---
target: app/(tabs)/prayers.tsx
total_score: 23.5
p0_count: 0
p1_count: 2
timestamp: 2026-06-30T17-52-41Z
slug: app-tabs-prayers-tsx
---
# Design & Usability Review: `app/(tabs)/prayers.tsx`

**Target File:** [`app/(tabs)/prayers.tsx`](file:///C:/Users/Lenovo/Desktop/projects/athkar%20app/athkar-app/app/%28tabs%29/prayers.tsx)  
**Method:** Dual-agent (A: 21a4d9a1-67ae-4fb1-8de2-689556eb8a99 · B: 7ddd66e4-c7c1-4c07-8106-e9f29032282f)

---

## Design Health Score

Each of Nielsen's 10 Usability Heuristics is scored on a **0–4 scale**:
- **0:** Broken / missing entirely
- **1:** Major issues / highly frustrating
- **2:** Acceptable / significant room for improvement
- **3:** Good / minor friction
- **4:** Excellent / intuitive and robust

| # | Heuristic | Score | Key Issue & Finding |
|---|-----------|-------|---------------------|
| 1 | **Visibility of System Status** | **3/4** | Good loading states for geocoding and location updates. The countdown timer ticks dynamically. However, when GPS permission is denied, the screen locks into a full-page error block. |
| 2 | **Match System / Real World** | **4/4** | Arabic language conventions, Hijri date mappings, and prayer terminology are highly natural. The solar timeline curves logically from dawn to dusk. |
| 3 | **User Control and Freedom** | **2/4** | Permission errors trap the user with no "Back," "Retry," or "Cancel" options. The location modal cannot be dismissed by tapping the backdrop overlay (must tap the small close button). |
| 4 | **Consistency and Standards** | **2/4** | The typography uses the `Tajawal` font family (not specified in [`DESIGN.md`](file:///C:/Users/Lenovo/Desktop/projects/athkar%20app/athkar-app/DESIGN.md#L36)), card corner radii range from `20px` to `30px` (violating the `16px` standard), and base background color uses `#121214` instead of `#18181B`. |
| 5 | **Error Prevention** | **3/4** | Input geocoding handles empty inputs and catches API failures. However, when a manual search returns zero results, the modal remains empty with no user feedback. |
| 6 | **Recognition Rather Than Recall** | **2/4** | Toggling alarms cycles between three states with no text indicators. The "vibrate" state uses a speaker-with-x icon (`volume-mute-sharp`), which traditionally means "Mute/Silent" (creating high recall friction). |
| 7 | **Flexibility and Efficiency** | **3/4** | Seamless toggle between manual city lookup and GPS location banner. However, there are no batch controls (e.g., "Mute All Alarms" or "Set All to Active") which is a standard utility. |
| 8 | **Aesthetic & Minimalist Design** | **2.5/4** | The ambient top glow and glassmorphic panels are visually pleasant, but the screen is layout-heavy. The large `solarCard` pushes key prayer data below the fold, and the active accent bar is visual clutter. |
| 9 | **Error Recovery** | **2/4** | Tapping "تحديث" on the banner allows location retries. However, recovery from the permission-denied state requires a force quit and manual device settings changes (highly disruptive). |
| 10 | **Help and Documentation** | **0/4** | No settings or documentation exist for the calculations (e.g., Islamic prayer method angle conventions, Asr juristic school). Tying calculation adjustments to specific local mosque standards is impossible. |
| **Total** | | **23.5/40** | **Acceptable (Significant improvements needed)** |

---

## Anti-Patterns Verdict

**Verdict: Borderline Slop** (Contains clear AI structural patterns and code-generation artifacts that deviate from the design system specifications).

*   **LLM assessment:**
    1.  **Side-Stripe Borders (AI Scaffold Tell):** The active prayer card utilizes `activeAccentBar` styled as a vertical accent bar on the right side with `width: 6`. This is a classic "side-stripe border" card accent pattern, which is flagged as an absolute ban in `impeccable` guidelines.
    2.  **Excessive Roundness:** Multiple elements exceed the standard rounded-corner rules. The `solarCard` and `activeCardInner` use `borderRadius: 24` (lines 996, 1096), and the `locationBanner` uses `borderRadius: 30` (line 1260), violating the `16px` standard from [`DESIGN.md`](file:///C:/Users/Lenovo/Desktop/projects/athkar%20app/athkar-app/DESIGN.md#L60).
    3.  **Dead Code & Incomplete Implementation:** Lines 315-353 calculate the elapsed `progress` percentage between the current and next prayers, but this variable is never used in the render tree.
*   **Deterministic scan:** The CLI detector scan reported `0 findings` because the regex engine matches CSS properties (e.g. `border-radius:`) but skips React Native's camelCase styles (like `borderRadius:`). This is a known engine limit for non-web mobile surfaces.
*   **Visual overlays:** Visual overlays are unavailable because live browser mutation is skipped for mobile native components.

---

## Overall Impression

The screen offers a visually pleasant ambient backdrop glow and clean typography, but suffers from layout density issues and lock-in error flows. The primary opportunity is to make the error states recovery-friendly and strictly align container styles with the layout principles in `DESIGN.md`.

---

## What's Working

1.  **Dynamic Solar Curve Visual:** The visual representation of the sun's altitude (using altitude-based opacity and animated breathing corona flares) provides a serene, spiritual feel that fits the brand personality.
2.  **Contextual Location Banner:** Floating location banner at the bottom provides instant confirmation of coordinates and an easy refresh trigger without cluttering the main header.
3.  **Adaptive Card States:** Cards distinguish between passed prayers (opacity `0.5`), the active prayer (glow, badges, countdown), and upcoming prayers, aiding scanning.

---

## Priority Issues

#### [P1] Critical Lock-In on Permission Denial (Error Recovery)
- **Why it matters:** If the user denies GPS permissions, the app replaces the entire viewport with an error screen with no button to manually search, use a cached location, or retry. The user is locked out.
- **Fix:** Replace the full-screen error block with a fallback layout that offers a button to **"Set Location Manually"** or **"Use Default (Ghomrassen, Tunisia)"** along with a **"Retry GPS"** trigger.
- **Suggested Command:** `$impeccable harden`

#### [P1] Missing Calculation Methods & Asr Settings (Help & Documentation)
- **Why it matters:** Prayer times differ by 10-20 minutes globally depending on the calculation method (e.g., Umm al-Qura, ISNA, Muslim World League) and Asr juristic school (Hanafi vs. Shafi'i). Tying calculation configurations is standard for prayer apps; without this, the app is unusable for users whose mosques use other guidelines.
- **Fix:** Integrate a settings selector (under the location modal or a secondary settings button) to change the `CalculationParameters` (angles) and juristic school (shadow length) computed by `adhan`.
- **Suggested Command:** `$impeccable shape`

#### [P2] Inconsistent Design System Styling (Consistency & Standards)
- **Why it matters:** The screen uses corner radii up to `30px`, a flat background `#121214`, and custom typography `Tajawal` that are undocumented in [`DESIGN.md`](file:///C:/Users/Lenovo/Desktop/projects/athkar%20app/athkar-app/DESIGN.md). This dilutes the cohesive identity of the application.
- **Fix:** Update background color to `#18181B` (Deep Zinc), cap card corner radii at `16px` as specified in [`DESIGN.md`](file:///C:/Users/Lenovo/Desktop/projects/athkar%20app/athkar-app/DESIGN.md#L60), and remove the vertical `activeAccentBar` side-stripe (replacing it with a subtle, thin full border overlay of `rgba(255,255,255,0.1)`).
- **Suggested Command:** `$impeccable layout`

#### [P2] Confusing Cycle Alarm Icons (Recognition vs. Recall)
- **Why it matters:** The alarm cycles to "Vibrate" using `volume-mute-sharp` (a speaker with an X), which is universally understood as "Muted Audio" rather than "Vibrate". Users will confuse the vibrate state with the silent state.
- **Fix:** Use a vibration-specific icon (such as a phone with vibration marks or `vibrate-sharp`/`notifications-outline`) for the vibrate state, and provide a tiny text label or tooltip explaining the state on first tap.
- **Suggested Command:** `$impeccable clarify`

#### [P2] Unused Progress Variable & Sunrise Confusion (Visual Aesthetics)
- **Why it matters:** The code computes an active prayer progress percentage but fails to render it, leaving the active card static. Meanwhile, the sunrise card uses a dashed, faded border which visually conflicts with upcoming prayers, leading users to assume it has passed.
- **Fix:** Add a progress bar (e.g., a thin horizontal bar in the active card) using the calculated `progress` value. Render Sunrise as a distinct event card that does not look "disabled" or "passed."
- **Suggested Command:** `$impeccable polish`

#### [P3] Location Modal Backdrop Tap Dismissal (User Control)
- **Why it matters:** In mobile apps, users expect to tap outside a modal to close it. The current modal requires hitting a small `close` button on the top-left, causing friction for one-handed use.
- **Fix:** Wrap the modal overlay `BlurView` in a `Pressable` that triggers `setIsModalVisible(false)`.
- **Suggested Command:** `$impeccable adapt`

---

## Persona Red Flags

### Alex (Impatient Power User)
- **Friction:** Alex wants to quickly check the upcoming prayer and mute/unmute notifications. 
- **Red Flags:**
  1. The large `solarCard` pushes the upcoming prayer cards below the fold on standard mobile screens, forcing Alex to scroll.
  2. Muting alarms requires clicking the alarm toggle button repeatedly to cycle through three states. There is no batch control or "Mute All" shortcut.
  3. No keyboard dismiss or gesture swipe-down closes the location modal; Alex must tap the small close icon.

### Casey (Distracted Mobile User)
- **Friction:** Casey operates the app one-handed on the go (e.g., walking home in low light).
- **Red Flags:**
  1. The location refresh text is very small and close to the location coordinates, creating a tiny touch target.
  2. The alarm toggle button is small (`36px` touch diameter), which is below the standard `44x44pt` recommendation. Casey will frequently misclick and trigger no action, or accidentally tap adjacent cards.
  3. Tapping the backdrop doesn't dismiss the search modal, forcing Casey to stretch their thumb to the top left of the screen.

### Jordan (First-Timer)
- **Friction:** Jordan expects an intuitive, beautiful companion app that requires no learning curve.
- **Red Flags:**
  1. Jordan gets confused by the speaker icon for "Vibrate", thinking the app is muted.
  2. Jordan notices the prayer times do not match their local mosque and assumes the app has a bug, because there is no help section explaining prayer calculation settings.
  3. The Sunrise card looks faded out (opacity `0.55`) and dashed, leading Jordan to believe it has already occurred or is inactive.
