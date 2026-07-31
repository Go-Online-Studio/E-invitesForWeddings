# Revert Guide: Re-Enabling Intro Video Sequence & Scroll Restrictions

This guide contains step-by-step instructions to easily re-enable the Ganesha video opening sequence, the "Tap to Open the Door" button, the Naidu Family welcome overlay, and scroll locks in `GaneshaIntry.html`.

---

## Current Instant Editing Mode

To allow instant page loading, immediate editing, and unrestricted scrolling without waiting for the video sequence:

1. **`#intro-overlay` & `#welcome-overlay`**: Hidden using `display: none !important;` in CSS.
2. **`<body>`**: Unlocked with `overflow-y: auto;` so normal scrolling works on page load.
3. **`#hero` Section**: Set to `opacity: 1;` immediately on load.
4. **Petals & Scroll Animations**: Auto-started on `DOMContentLoaded`.

---

## Step-by-Step Instructions to Re-enable Full Intro Video Sequence

To bring back the full interactive video & door opening sequence later:

### Step 1: In `GaneshaIntry.html` (CSS)

1. Find `#intro-overlay` (around line 110) and change:
   `display: none !important;` -> `display: flex;`
2. Find `#welcome-overlay` (around line 205) and change:
   `display: none !important;` -> `display: flex;`
3. Find `body` (around line 43) and change:
   `overflow-y: auto;` -> `overflow: hidden;`
4. Find `#hero` (around line 290) and change:
   `opacity: 1;` -> `opacity: 0;`

### Step 2: In `GaneshaIntry.html` (JavaScript)

Near the bottom of the `<script>` tag (around line 1222), remove or comment out:
```javascript
// Auto-initialize for instant editing view
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  startPetalsOnce();
});
```

And ensure the `video.addEventListener('ended', ...)` callback remains active to trigger `initScrollReveal()` and `startPetalsOnce()` after the video sequence finishes!

---

## Quick Reference Table

| Code Area | Instant Editing Mode (Current) | Reverted / Full Intro Mode |
| :--- | :--- | :--- |
| `body` overflow | `overflow-y: auto;` | `overflow: hidden;` |
| `#intro-overlay` CSS | `display: none !important;` | `display: flex;` |
| `#welcome-overlay` CSS | `display: none !important;` | `display: flex;` |
| `#hero` CSS opacity | `opacity: 1;` | `opacity: 0;` |
