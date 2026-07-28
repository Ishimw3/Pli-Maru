# AGENTS.md — Habit Tracker · Structural Decisions

> This document is the single source of truth for all agents, contributors, and AI assistants working on this project.
> Every decision listed here is **non-negotiable** unless explicitly superseded by a new version of this file approved by the project owner.
> Before writing any code, UI copy, or logic, read this file in full and confirm your implementation aligns with every constraint below.

---

## 1. Core Concept — One Habit at a Time

- The application tracks **exactly one active habit at any given moment**.
- There is **no list view**, **no dashboard**, **no multi-habit overview**, and **no simultaneous tracking**.
- Do not implement, scaffold, or design any UI element that implies concurrent habit management.
- Switching to a new habit is a **deliberate, manual action** performed by the user (see §6).

---

## 2. Main Screen — The Circle

The main screen consists of **one single visual element**: a circle.

| State | Visual |
|---|---|
| Not yet checked today | Circle outline only — empty interior, same color as the habit's assigned color |
| Checked today | Circle fully filled with the habit's assigned color |

### Rules
- **No text** is displayed on the main screen by default — no habit name, no date, no counter, no label.
- **No numbers** are displayed on the main screen by default.
- **No icon** (flame, star, checkmark, trophy, streak indicator, etc.) is ever displayed on or around the circle.
- The filled circle is the **only and sufficient** validation signal.
- Tapping the circle toggles today's check-in. The transition between empty and filled must be animated (smooth fill, no abrupt snap).

---

## 3. Progress Ring — Cyclical, Never Frozen

A **thin ring** surrounds the outer edge of the circle. This ring represents progress within the current cycle.

### Rules
- **Default cycle duration**: 30 days. Configurable by the user (see §6 — hidden settings).
- The ring fills progressively as days are checked within the current cycle.
- When the cycle completes (all days checked within the period), the ring **loops back to zero and starts a new cycle**. It never freezes at 100%, never shows a completion animation that blocks the screen, and never resets to a locked or "finished" state.
- The ring is **the same color** as the habit's assigned color, possibly at a lighter opacity or slightly different shade — never a neutral grey that implies failure, and never red under any circumstance.
- Do not display the cycle count, cycle number, or any numeric representation of cycle progress on the main screen.

---

## 4. Missed Days — Gentle Decay, No Punishment

If the user does not check in on a given day:

- The progress ring for the current cycle **decreases smoothly** on the following day (or at midnight rollover), representing the missed day proportionally.
- This decay must be implemented as a **soft animation** — slow, calm, non-alarming.
- **Never display**: red color, orange warning color, a broken ring graphic, a cross (✗), a skull, a "streak lost" message, or any text indicating failure.
- **Never send** a notification that references a missed day, a broken streak, or any form of negative reinforcement.
- Points accumulated from completed cycles (see §5) are **permanently preserved** regardless of missed days.

---

## 5. Cycle Completion Dots — Permanent Memory

Each time the user completes a full cycle:

- A **small dot** is permanently added to the outer edge of the circle.
- Dots accumulate indefinitely and are **never removed**, even when switching habits or starting a new cycle.
- Dots are rendered at equal angular intervals around the outer rim, or clustered if space is limited — implementation choice, but they must all remain visible.
- Dots are **not interactive** and carry no tooltip, label, or counter by default.
- The dots must survive app restarts, habit transitions, and data migrations. They are part of the permanent history of the habit.

---

## 6. Habit Transition — User-Controlled

### Manual Transition (Default)
- A **discreet button** is available on the main screen (e.g., a small icon in a corner, or accessible via a long press on a non-circle area) that allows the user to declare the current habit complete and begin a new one.
- "Discreet" means: small, not colored, not animated by default, not in the primary visual hierarchy.
- Triggering it opens a minimal flow: name the new habit (optional), pick a color, confirm.

### Automatic Threshold (Disabled by Default)
- An optional feature exists that can automatically suggest transitioning after a configurable number of completed cycles.
- This feature is **OFF by default**.
- It is located in **hidden settings** only (see below) — never exposed in the primary UI or onboarding.
- When triggered (if enabled), it must present a **suggestion**, never an automatic redirect or forced transition.

### Hidden Settings
- A dedicated settings screen exists but is **not reachable from the main navigation**.
- Access: a specific gesture (e.g., long press on the cycle count dot area, or a multi-tap sequence) documented internally.
- Settings available: cycle duration, automatic threshold toggle and value, color re-assignment, **active theme selection** (see §13).

---

## 7. Statistics Screen — Opt-In, Never Pushed

A global statistics screen exists with the following data:
- Total days checked across all habits and all time
- Number of habits completed (i.e., manually transitioned away from by the user)
- A chronological history of past habits represented by their color only (no names required)

### Access Rules
- Accessible **only** via a deliberate gesture: **swipe down from the main screen**, or **long press on the circle**.
- **Never shown by default** on launch, after onboarding, or as a home tab.
- **Never linked from a visible navigation element** (no bottom tab bar icon, no hamburger menu item labeled "Stats").
- **Never pushed via notification** ("Here are your weekly stats!", "You've been on a streak!", etc.).
- The statistics screen must itself be **minimal**: no charts with gamification framing, no "personal bests", no motivational copy.

---

## 8. Design System — Strict Minimalism

### What is Forbidden
The following UI elements and patterns are **strictly forbidden** in this application:

| Forbidden Element | Examples |
|---|---|
| Gamification mechanics | Points, XP, levels, badges, leaderboards, streaks displayed as scores |
| Punitive visuals | Red color for failure, broken icons, "X" marks |
| Celebratory clutter | Confetti, fireworks animations, pop-up congratulations modals |
| Motivational copy | "Keep it up!", "You're on fire!", "Don't break the chain!" |
| Flame or fire icon | In any context, for any purpose |
| Classic checkmark (✓) | As a primary completion indicator |
| Push notification for missed days | Any wording that implies the user failed |
| Progress bars with percentage text | On the main screen |
| Numeric streak display | On the main screen |

### What is Required
- Typography: minimal, single weight if possible, no decorative typefaces.
- Color: the habit's chosen color is the only accent color. All chrome (backgrounds, borders, inactive elements) must be neutral (near-white or near-black depending on theme, no tinted greys).
- Spacing: generous. The circle must be large and breathe. No cramped UI.
- Motion: every animation must feel **unhurried and calm**. Easing curves should be smooth (ease-in-out or spring). Duration: 300ms–600ms for fill transitions, longer (up to 1200ms) for decay.
- Dark mode and light mode must both be supported from the start.

---

## 9. Color System — Per-Habit, Persistent

- **Every habit has exactly one color**, chosen by the user at habit creation.
- This color is used for: the circle fill, the ring, the completion dots.
- The color is **locked to the habit** for its entire active lifetime and stored in the historical record after transition.
- The color picker must offer a curated palette (avoid default system pickers with jarring neons) or a constrained HSL wheel. No default/placeholder color is acceptable — the user must make an active choice.
- Colors of past habits are preserved in the statistics history display.

---

## 10. No Default Text on Main Screen

- The main screen renders **no text whatsoever** in its default state.
- Habit name, current date, day counter, cycle counter — none of these are visible unless the user explicitly triggers an info state (if such a feature is ever designed, it must be ephemeral and gesture-gated).
- This constraint applies to both the checked and unchecked states of the circle.

### Exception — Ephemeral Post-Check Text (Theme-Controlled)
- A theme **may** display a short text immediately after the user performs a check-in tap. This text is:
  - **Ephemeral**: it appears briefly (e.g., 1–2 seconds) and then disappears on its own — it must never remain visible in the idle state of the screen.
  - **Defined by the theme**: the wording, duration, and animation are entirely the theme's responsibility. The core app does not prescribe any specific copy.
  - **Neutral in tone**: no motivational copy, no streak references, no gamification framing (see §8 — forbidden elements still apply).
  - **Never permanent**: under no circumstance should post-check text persist after its animation cycle ends.
- The default minimalist theme displays **a brief post-check text** and a subtle bounce animation.

---

## 11. Notification Policy

- **Allowed**: A single, opt-in, configurable daily reminder at a user-chosen time ("Time for your habit"). Neutral tone. No streak reference.
- **Forbidden**: Any notification referencing missed days, broken streaks, progress loss, or achievement unlocks.
- Notifications are **disabled by default**. The user must explicitly enable them.

---

## 12. Onboarding

- Onboarding is limited to: pick a habit name (optional), pick a color, start.
- No tutorial screens explaining gamification mechanics (there are none).
- No permission requests beyond what is strictly required (local notifications if user enables them, no contacts, no social, no analytics by default).

---

## 13. Theme Engine — Presentation Layer Only

The main screen is refactored into a **theme engine**: a pluggable presentation system that decorates the shared habit state without ever owning or altering it.

### Architecture Contract
- The theme is a **pure presentation layer**. It receives a read-only state object and returns its own visual rendering and animations. It never writes to, derives, or holds business logic.
- The shared state injected into every theme consists of exactly:
  - `isCheckedToday` — boolean
  - `cycleProgressPercent` — number (0–100)
  - `completedCyclesCount` — integer
  - `habitColor` — color value (hex or HSL)
- **No business logic lives inside a theme.** Tracking, persistence, cycle calculation, and missed-day decay are always handled by the core layer.
- The interface between core and theme is **strictly typed**: a theme is a component (or equivalent) that accepts the above props and returns its own visual tree and animations.

### Default Theme
- The current minimalist circle-and-ring design becomes the **default theme**.
- It is always available, always free, and cannot be removed or hidden.
- It serves as the reference implementation for any new theme.

### Additional Themes
- Additional themes are **cosmetic packs only**: they may change shapes, textures, particle effects, motion styles, and post-check text/micro-animation.
- **No tracking feature, reminder, or data access may be locked behind a paid or premium theme.** All functional capabilities are always available regardless of active theme.
- A theme may not introduce new persistent UI elements not described in this document (e.g., no new counters, no new progress indicators beyond ring and dots).
- A theme may include its own **post-check ephemeral text and micro-animation** triggered at the moment of tap, subject to §10 constraints.

### Theme Selection & Distribution
- A **theme selection screen** (also referred to as the theme store or theme picker) exists within the application.
- It is accessible **exclusively** from the hidden settings screen (see §6 — hidden settings). It is not reachable from any visible navigation element.
- The theme selection screen must itself be minimal: no promotional banners, no "featured" labels, no animated upsell.
- Free and paid themes may coexist in the picker, but the distinction must be calm and non-intrusive (e.g., a small neutral label — never a badge, star, or lock icon with punitive styling).

### Theme Implementation Rules
- Each theme must implement the shared interface and must be self-contained: its assets, animations, and logic must not bleed into other themes or the core layer.
- Themes must support both dark mode and light mode (see §8).
- A theme switch must not reset or affect any tracked data (check history, cycle count, dots).
- The active theme choice is persisted across app restarts and stored per-habit or globally — implementation choice, but it must survive restarts.

---

## Implementation Checklist for Agents

Before submitting any code or design contribution, verify:

- [ ] Main screen shows only the circle and the progress ring — nothing else by default
- [ ] Circle has no text, no icon, no checkmark overlay
- [ ] Ring loops at 100% instead of freezing
- [ ] Missed days cause smooth ring decay only — no red, no negative copy
- [ ] Completion dots persist permanently and survive all state changes
- [ ] Stats screen is hidden behind a deliberate gesture
- [ ] No gamification element of any kind is present
- [ ] Habit transition is manual by default; automatic threshold is OFF and hidden
- [ ] Notification for missed days does not exist anywhere in the codebase
- [ ] Color is chosen by user and is the sole validation signal
- [ ] Dark mode and light mode are both handled
- [ ] Theme engine is implemented as a pure presentation layer — no business logic inside any theme
- [ ] Theme receives only the four prescribed state props (isCheckedToday, cycleProgressPercent, completedCyclesCount, habitColor)
- [ ] Default minimalist theme is always available and free
- [ ] No functional tracking feature is gated behind a paid theme
- [ ] Post-check text (if used by a theme) is ephemeral and absent in the idle state
- [ ] Theme selection screen is accessible only from hidden settings — no visible navigation entry
- [ ] Switching themes does not alter or reset any tracked data
- [ ] Active theme selection persists across app restarts
