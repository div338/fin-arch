# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LifeCompass** is a client-side financial planning web app for Indian households. It helps users plan for retirement, children's education, and lifestyle goals. No backend, no auth, no DB — all computation runs in the browser.

Currently the repo contains:
- `instructions.txt` — CTO technical spec / handoff document
- `LifeCompass.jsx` — monolithic reference implementation (1,600+ lines)

The intended scaffolded structure (from the spec) is:

```
src/
├── main.jsx
├── App.jsx                  # Step router — owns all state
├── engine/
│   ├── constants.js
│   ├── formulas.js          # Pure functions only
│   └── deriveFlows.js       # Assembles flows[] via useMemo in App
├── components/
│   ├── primitives/          # Blank, MoneyBlank, Toggle, NumToggle, HintText
│   ├── layout/              # Card, Sec, Prose
│   └── results/             # BarChart, HealthCard, OutflowList, WhatsAppBtn
└── screens/                 # Landing, Baseline, Goals, Results
```

## Commands

This project has not been scaffolded yet. When scaffolding:

```bash
npm create vite@latest lifecompass -- --template react
npm install
npm run dev        # start dev server
npm run build      # production build
npx vitest         # run tests
npx vitest run src/engine/__tests__/formulas.test.js  # single test file
```

## Architecture

### Step-based navigation
`step` (integer 0–3) in App.jsx state drives the entire UI — no router needed.

### State shape (App.jsx)
- **Baseline (Step 1):** `inc`, `exp`, `sav` → `{ v: string, u: 'lakh' | 'crore' }`; `age` → string
- **Retirement (Step 2):** `rTog` ('do'|'undecided'|null), `rAge` string, `rInc` MoneyBlank state
- **Children (Step 2):** `kTog`, `nKid` (1|2|3), `kYrs` string[]
- **Lifestyle goals:** `goals` → `Array<{ id, type, cost:{v,u}, freq:'once'|'every', yrs:string }>`
- **Derived (useMemo):** `flows` — assembled by `deriveFlows()`, the single source of truth for all results

### Flow object shape
```js
{ id, label, type: 'retirement'|'education'|'lifestyle', yearAway, calendarYear, fv, sip, emoji }
```
`sip` is 0 when `yearAway > SIP_CAP_YEARS (30)` — such flows still appear in the chart.

### Engine constants (engine/constants.js)
| Constant | Value | Meaning |
|---|---|---|
| `EDU_INFLATION` | 0.10 | 10%/yr for education costs |
| `STD_INFLATION` | 0.06 | 6%/yr for lifestyle goals |
| `PORTFOLIO_RETURN` | 0.12 | 12%/yr assumed portfolio return |
| `STEP_UP_RATE` | 0.10 | 10%/yr annual SIP step-up |
| `BASE_COLLEGE_INR` | ₹20L | Today's college cost baseline |
| `SWR_MULTIPLIER` | 300 | Corpus = desired monthly income × 300 (4% SWR) |
| `SIP_CAP_YEARS` | 30 | Goals beyond 30 yrs get sip=0 |
| `EMERGENCY_TARGET` | 6 | 6 months of expenses |
| `RECURRING_HORIZON` | 40 | Years to expand recurring goals over |

### BarChart SVG
- Flows grouped by `yearAway` → columns
- Stacked rects: retirement on top (orange `#fb923c`), education/lifestyle below (indigo `#c7d2fe`)
- Bars with total FV > ₹50L get a 4px dark cap (`#ea580c` retirement, `#4f46e5` goals)
- Wrap in `overflowX: 'auto'` for mobile scroll

## Critical Rules (PRD §7)

1. **Components must be defined at module level** — never inside App or another component. Defining components inside a render function causes React to remount them on every render, destroying input focus.
2. **No IIFEs in JSX** — pre-compute all conditional JSX as named `const` variables above `return`.
3. **Inline styles only** — no `className`, no CSS files, no Tailwind, no style tag injection.
4. **MoneyBlank stores strings** — only call `parseFloat()` inside `engine/` at calculation time, never in component state.
5. **Blank width** — use the hidden span mirror pattern (render typed value in an invisible span, read `offsetWidth`, apply to input). Do not use `ch` units — they are unreliable with serif fonts.

## Testing

All `engine/` functions are pure (no React, no DOM) — test with Vitest.

Test files go in `src/engine/__tests__/`. Priority cases:
- SIP cap boundary (exactly 30 years)
- Recurring goal expansion over 40-year horizon
- Emergency fund at each threshold (`healthy`/`building`/`critical`)
- Corpus calculation with `yearsToRetirement = 0`
- `formatINR` at Cr/L/sub-L boundaries

## Out of Scope

Do not add: backend, API calls, authentication, database, analytics, i18n, PDF export, SIP visualizer, delay cost calculator. These are explicitly deferred roadmap items.
