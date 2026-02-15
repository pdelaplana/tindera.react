# Merchant Welcome & Signup Page — Design Document

**Date:** 2026-02-15
**Route:** `/welcome`
**File:** `src/features/auth/MerchantWelcomePage.tsx`

## Overview

A high-impact, dual-section landing page that pairs a visual marketing pitch ("Start Selling in 2 Minutes") with a streamlined lead-capture signup form. Designed for merchant conversion, not full account registration.

The existing `/signup` route and `SignupPage.tsx` are preserved. This new page is added alongside them.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Route | `/welcome` | New route for lead conversion; keeps existing `/signup` intact |
| Approach | styled-components (Option A) | Full layout control; Ionic grid is too constrained for split-screen marketing layouts |
| Fields | Business Name + Email | Minimal friction for lead capture; password setup via email verification link |
| Photo block | Placeholder + merchant quote | Easy to swap with a real photo later |
| Mobile | Right panel (form) shown first | Prioritizes conversion on mobile |

## Layout & Structure

Full-viewport split using CSS Grid (`grid-template-columns: 1fr 1fr` on desktop).

- **Left panel** — Orange fill (`#E8713C`), marketing pitch
- **Right panel** — Off-white (`#fafafa`), centered signup card

On mobile (< 768px): stacked single-column layout, form card shown first (top), left panel content shown second (collapsed/simplified).

Wrapped in `<IonPage>` for Ionic router compatibility. `<IonContent>` omitted — raw `div` used for the split so CSS takes full control.

## Left Panel

- Tindera logo/wordmark — white, top-left
- Headline: `"Start Selling in"` (white bold) + `"2 Minutes"` (dark orange `#d96d0a`, underline accent)
- Subheadline: `"The simplest POS for food stalls, micro-merchants, and side hustlers."`
- Feature list (3 items):
  - ⚡ **Fast Checkout** — Serve customers in seconds with our optimized interface
  - 📦 **Automatic Inventory** — Never run out of stock. Real-time tracking as you sell
  - 📊 **Instant Reports** — Track your daily sales anywhere. No more manual logs
- Bottom block: Rounded placeholder image (orange gradient fallback) with italic testimonial overlay:
  > *"I saved 3 hours a day on inventory with Tindera." — Maria, Food Stall Owner*

## Right Panel (Signup Card)

White card, `border-radius: 20px`, soft shadow, generous padding, centered in panel.

- Heading: **"Create Account"** (dark, bold)
- Subtext: *"Join 5,000+ happy merchants today."* (muted gray)
- **Business Name** input: store icon prefix, placeholder `"e.g. Potato Corner SM North"`
- **Email** input: mail icon prefix, placeholder `"you@example.com"`
- **"Get Started →"** CTA: full-width, orange fill, large pill border-radius, white bold text
- **"Already have an account? Log in"** link below button — "Log in" in orange, links to `/signin`
- Footer: `"Secure Cloud POS"` — small muted trust text

## Form Behavior

- Both fields must be non-empty for the CTA to be enabled
- On submit: calls `signUp({ email, displayName: businessName, password: '' })` or a dedicated lead-capture endpoint
- On success: navigate to the email verification screen (same success state as existing SignupPage)
- On error: inline error message below the form fields (red text)
- No password field — this is a lead capture entry point

## Components

| Component | Purpose |
|---|---|
| `MerchantWelcomePage` | Page shell (`IonPage` + split grid layout) |
| `WelcomeLeftPanel` | Marketing content (styled-component) |
| `FeatureItem` | Reusable icon + title + description row |
| `SignupCard` | White card with form (styled-component) |

## Routing

Add to `App.tsx`:
```tsx
<Route exact path="/welcome">
  <MerchantWelcomePage />
</Route>
```

No auth guard — this is a public route.
