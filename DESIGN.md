# Design System: ImanHub Home Dashboard
**Project ID:** projects/18250759736966785696

This document serves as the canonical design system specification and "Source of Truth" synthesized directly from the active Google Stitch project. It provides visual descriptions, structural rules, and exact design tokens to ensure all generated pages align with the visual identity of ImanHub.

---

## 1. Visual Theme & Atmosphere
The overall atmosphere of the ImanHub dashboard is **serene, spiritual, high-fidelity, and modern**. It employs a rich dark mode background layered with subtle radial gradients to create an ambient, celestial feel.
- **Mood:** Reflective, calm, and premium.
- **Density:** Balanced and structured, with comfortable padding margins (`16px` spacing) and a single-column layout hierarchy matching typical mobile viewports.
- **Aesthetic Vibe:** Translucent, glassmorphic cards overlapping soft color meshes.

---

## 2. Color Palette & Roles
The design system operates primarily on a dark theme base, utilizing functional color accents corresponding to Islamic prayer phases (sunset, sunrise, night):

| Color Name | Hex/RGBA Value | Functional Role |
| :--- | :--- | :--- |
| **Deep Zinc (Base Background)** | `#18181B` | The primary backdrop for the entire screen body. |
| **Translucent Glass (Dark)** | `rgba(39, 39, 42, 0.6)` | Background fill for floating container cards. |
| **Glass Light Overlay** | `rgba(255, 255, 255, 0.7)` | Light mode container overlay backing. |
| **Emerald Accent (Primary)** | `#006C49` | Primary brand identification, solid CTA buttons, and success indicators. |
| **Emerald Light (Primary Fixed)** | `#4EDEA3` / `#6FFBBE` | Primary active highlights and text glow colors in dark mode. |
| **Sunset Plum (Accent)** | `#AB47BC` | Used for ambient headers, countdown widgets, and highlight text shadows. |
| **Sunrise Coral** | `#FF7043` | Dynamic color for morning/sunrise actions and widgets. |
| **Dawn Teal** | `#4DD0E1` | Dynamic highlights for dawn-specific elements. |
| **Noon Amber / Gold** | `#FFC107` | Noon prayer highlights and active icons. |
| **Afternoon Bronze** | `#FFB300` | Late afternoon category backgrounds. |
| **Night Indigo** | `#7C4DFF` | Night theme indicators and secondary service buttons. |
| **High Contrast Borders** | `rgba(255, 255, 255, 0.1)` | Fine border stroke for glass cards to establish edge definition. |

---

## 3. Typography Rules
ImanHub utilizes a strong typographic hierarchy, pairing modern, readable sans-serif fonts for data displays with classical serifs for sacred script.

- **Sacred Texts & Supplications (Quranic Text):**
  - **Font Family:** `Amiri` (loaded with serif fallback).
  - **Treatment:** Classically styled, centering alignment, large size (`32px`), generous line-height (`48px`) to ensure perfect readability of Arabic diacritics.
- **English Translations & Quotes:**
  - **Font Family:** `Noto Serif` (italicized, smaller size `14px` to `16px`).
- **System Interface (Headers, Labels, Data):**
  - **Font Family:** `Plus Jakarta Sans` (sans-serif stack).
  - **Headline Large:** `24px` size, bold (`fontWeight: '700'`), line-height `32px`.
  - **Headline Medium:** `20px` size, semibold (`fontWeight: '600'`), line-height `28px`.
  - **Body Medium:** `14px` size, regular (`fontWeight: '400'`), line-height `20px`.
  - **Label Medium:** `12px` size, medium (`fontWeight: '500'`), letter-spacing `0.5px`.

---

## 4. Component Stylings

*   **Buttons:**
    *   **Shape:** Pill-shaped (`rounded-full`) or rounded rectangular layout.
    *   **Color & Fill:** Primary buttons are filled with Solid Emerald (`#006C49`) with bold white text. Secondary options use a translucent glass hover state.
    *   **Behavior:** Active press scaling (`scale: 95%`) for physical feedback.
*   **Cards/Containers:**
    *   **Shape:** Subtly rounded corners (`border-radius: 1rem` / `16px`).
    *   **Background:** Glassmorphism overlay (`rgba(39, 39, 42, 0.6)`) with `backdrop-filter: blur(12px)`.
    *   **Shadow:** Subtle flat depth with fine white border outline overlay (`rgba(255,255,255,0.1)`) to contrast against the dark background.
*   **Inputs/Forms:**
    *   **Stroke:** Thin outlines with focus borders that transition smoothly into emerald highlights.

---

## 5. Layout Principles
- **Whitespace Strategy:** Sections are clearly separated by a standardized layout stack (`gap: 24px` / `stack-lg`). Inner card elements use compact padding (`16px` to `20px`).
- **Grid Alignment:** Single-column layout alignment with a fixed maximum width for mobile screens (`max-width: 448px` / `max-w-md`), centered horizontally with `16px` screen edge margins.
- **Sticky Overlays:** Headers and footers (navigation bars) utilize frosted glass backing (`backdrop-blur-md`) with high-contrast border borders to separate navigation from active scroll content.
