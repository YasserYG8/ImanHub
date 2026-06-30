---
target: app/(tabs)/athkar.tsx
total_score: 34
p0_count: 0
p1_count: 2
timestamp: 2026-06-30T17-17-44Z
slug: app-tabs-athkar-tsx
---
# Design Critique: app/(tabs)/athkar.tsx

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Async state loading from AsyncStorage on mount has no loading spinner/skeleton. |
| 2 | Match System / Real World | 3 | Categories match liturgical time slots (Morning, Evening, etc.) accurately. |
| 3 | User Control and Freedom | 4 | Fluid navigation between dashboard and reading categories. |
| 4 | Consistency and Standards | 3 | Color styles generally align with DESIGN.md, but some tailwind color presets are used instead of theme mappings. |
| 5 | Error Prevention | 4 | Search behaves correctly and handles filtering. |
| 6 | Recognition Rather Than Recall | 4 | Clear category iconography makes categories instantly recognizable. |
| 7 | Flexibility and Efficiency | 3 | Direct route mapping, but lacks streak or shortcut customization. |
| 8 | Aesthetic and Minimalist Design | 4 | Serene glassmorphism and subtle background glows create a high-end interface. |
| 9 | Error Recovery | 4 | Simple list reading with minimal opportunity for validation failures. |
| 10 | Help and Documentation | 2 | No visual cue or onboarding explaining how daily ward progress resets. |
| **Total** | | **34/40** | **Good** |

## Anti-Patterns Verdict

*   **LLM Assessment:** The visual look is extremely clean, and using day-progression color-coding (Gold for Morning, Indigo for Evening) successfully prevents visual monotony. However, the static `+12% عن أمس` trend text is a hardcoded placeholder.
*   **Deterministic Scan:** The automated detector returned `[]` (exit 0) showing no basic code anti-pattern hits.
*   **Visual Overlays:** Not applicable (React Native source target).

## Overall Impression
A highly polished, serene, and visual categories dashboard that fits the spiritual theme. The primary improvement areas are cleaning up the empty header space, replacing the hardcoded metrics, and correcting small contrast or font scale details.

## What's Working
1.  **Liturgical Color System:** The background glow mapping aligns with prayer cycles.
2.  **Circular Svg Progress Rings:** Visual completion rings feel holistic and premium.

## Priority Issues

*   **[P1] Hardcoded Trend Metric:**
    *   *Why it matters:* Fabricating progress numbers in a devotional app erodes long-term trust.
    *   *Fix:* Remove the trend badge or replace it with a derived streak/consecutive days tracker.
    *   *Suggested command:* `/impeccable polish`
*   **[P1] Empty Header Space:**
    *   *Why it matters:* Removing the greeting and date left the header with just a small notification bell, leaving a large blank empty space.
    *   *Fix:* Add a styled page title (e.g. `الأذكار`) in the header next to the notification button to restore layout balance.
    *   *Suggested command:* `/impeccable layout`
*   **[P2] Progress Ring Text Size:**
    *   *Why it matters:* The `9px` percentage font size inside the SVG progress ring is illegible in dim bedrooms or at Fajr.
    *   *Fix:* Increase font size to `11px` and ensure color contrast is high.
    *   *Suggested command:* `/impeccable typeset`
*   **[P2] Async Initial State Flickering:**
    *   *Why it matters:* Loading stats from AsyncStorage shows a fast flicker of `0%` before popping in.
    *   *Fix:* Render a placeholder skeleton card or hide progress elements until `loading` resolves.
    *   *Suggested command:* `/impeccable polish`

## Persona Red Flags

*   **Casey (Distracted Mobile User):**
    *   All cards look visually uniform, which does not highlight the active card. Casey must spend extra time looking for the category to continue reading.
*   **Fatima (Daily Devotional User):**
    *   Fatima opens the app in a dark bedroom at 5:00 AM. The progress ring text inside the cards is too small and illegible under low-light conditions.
