# Accessibility memo — items needing design input

Companion to the static a11y sweep (PR #16). The fixes that didn't need design
input are already applied: i18n on hardcoded ARIA labels and filter copy,
`aria-expanded` / `aria-pressed` / `role="group"` across toggleable widgets,
`role="search"` and an `aria-label` on the topbar search input, a skip-to-content
link, and converting the sidebar's "Installed / Saved" rows from focusable
buttons-that-do-nothing into non-interactive placeholders.

What follows is the punch-list that needs a product or design call before code
moves.

## 1. UserButton popover → Base UI Menu primitive

`components/layout/user-button.tsx` is a hand-rolled popover (click-outside via
`mousedown`, no `Esc` key handler, no focus trap, no focus restore on close, no
`role="menu"` / `role="menuitem"` semantics).

A11y fix: migrate to `@base-ui/react/menu` (already used elsewhere — see
`components/ui/select.tsx` for the wrapper pattern). Base UI gives us:

- `aria-haspopup="menu"` on the trigger
- `Esc` to close, focus restored to the trigger
- Arrow-key navigation through items
- `role="menu"` / `role="menuitem"` on the popup

This is a straight swap, ~30 LOC. Open question for the user: do we also want a
`Settings` link in the menu? Currently the only item is `Sign out`, and the
sign-in case is a separate element altogether.

## 2. Color contrast on `text-muted-foreground`

`oklch(48% 0.015 60)` against the ivory `--background` of `oklch(98%)` lands
around **3.5 : 1** by my rough check. WCAG AA requires **4.5 : 1** for body text
and **3 : 1** for UI/large. We use `text-muted-foreground` on plenty of small
body text (sidebar counts at `[11px]`, card descriptions at `[12.5px]`,
metadata rows in the About card, hint copy in empty states).

Likely failing surfaces:

- Sidebar function-cat / L1 / L2 counts (`[11px] opacity-55`)
- Card descriptions and tag chips (`[12.5px] / [11px]`)
- Detail page About card values (`[11.5px]`)
- Empty-state hint paragraph (`[13px]`)

Two options:

- **A — Darken the muted foreground** to ~`oklch(40% ...)` so all current
  usages clear AA. Will affect the "soft / editorial" feel — probably a small
  shift.
- **B — Reserve `text-muted-foreground` for ≥ 14 px text** and define a
  separate token for small captions that's darker. More plumbing.

Needs a designer eye.

## 3. Global `focus-visible` ring

Today the focus state is inconsistent: some buttons use the default browser
outline, some declare `outline-none` with no replacement, some declare
`focus-visible:ring-ring/20 focus-visible:ring-3`. Easy keyboard users to lose.

Suggested: a single rule in `app/globals.css` like

```css
:where(button, a, input, select, textarea, [role="button"]):focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

…and audit individual `outline-none` declarations to see which still need a
custom override. Probably half a day's work but the visual fingerprint is
project-wide so it warrants a design call.

## 4. Phase-9 follow-ups parked here

- **Sidebar "Installed" / "Saved"** rows are now non-interactive placeholders
  with hardcoded `0` counts. When per-user collections wire up (Phase 9 was
  CLI v1; collection routes are post-v1), make them real links and wire counts
  through. Until then the placeholder reads the same as a disabled link to AT.
- **Top-bar `Docs` link** is a non-interactive placeholder (was `href="#"`,
  which leaked into tab order and went nowhere). Decide where docs live — an
  external URL, an MDX route, or a redirect to the existing `docs/` md files
  rendered server-side — then re-enable the link.

## 5. Mobile a11y not covered

Touch targets, swipe gestures, screen-reader pass on iOS / Android — out of
scope for this static sweep. Worth a separate session with a real device once
the layout settles.
