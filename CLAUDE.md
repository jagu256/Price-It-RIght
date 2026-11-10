# Price It Right – notes for Claude Code

> **Start here:** read [`docs/PROJECT_HISTORY.md`](docs/PROJECT_HISTORY.md) for everything done so far, and [`docs/requirements/`](docs/requirements/) for the student's original briefs (1 = first app, 2 = inventory estimator, 3 = full upgrade – the current target).

Small-business pricing, inventory and profitability simulator for an **ACCT 4500** university group project (KPU). The student owner has no coding background, so explain changes in plain language and keep the code simple enough to explain in an oral demo.

## Commands
- `npm install` – install dependencies (first time)
- `npm run dev` – local dev server (http://localhost:5173)
- `npm test` – Vitest suite (290 tests as of 9 Nov 2026; all must pass; the test timeout is 15 s because click-through tests are slow on this machine)
- `npm run build` – type-check (`tsc -b`) + production build; must succeed before pushing
- Deployment: Vercel builds automatically on every push to `main` (GitHub repo `jagu256/Price-It-RIght`, live at https://price-it-r-ight.vercel.app). Never push a failing build.

## Stack
React 18 + TypeScript + Vite 6 + Tailwind 3 + Recharts 2. Excel via read-excel-file / write-excel-file, CSV via papaparse, PDF via jspdf + jspdf-autotable. These four libraries are loaded with dynamic `import()` so the first page stays small; keep it that way. No backend, database, accounts, API keys or payments.

## Structure
- `src/lib/` – ALL calculations, as pure, tested functions. UI must never do its own accounting maths.
  - `business.ts` multi-product CVP, sales-mix break-even, largest-remainder allocation
  - `accounting.ts` single-product CVP (used by the one-product break-even calculator and challenges)
  - `model.ts` builds validated numbers from user input: inventory → recipes → material cost → product variable cost
  - `stock.ts`, `inventory.ts` inventory records, units, conversions, round-down capacity
  - `recipes.ts`, `planning.ts` recipes, material cost, shared-inventory plans, CM per scarce resource
  - `pricing.ts` scenarios, required price, profit goals
  - `saveWork.ts` save file (schema version), import validation, localStorage wrapped in try/catch. Only the business is saved – never scenario/planner/challenges. UI: `components/SaveMyWork.tsx`; auto-save lives in `app/StoreContext.tsx`
  - `sensitivity.ts` ±10 % one-at-a-time sensitivity and degree of operating leverage (dashboard: `components/Sensitivity.tsx`)
  - `tax.ts` optional after-tax target (user-entered rate, pre-tax = target ÷ (1 − rate) rounded up, no tax on a loss). UI `components/AfterTaxTarget.tsx`; it feeds `SmartPricing` and `ProfitGoal` via a `linkedTarget` prop
  - `demand.ts` OPTIONAL price-sensitive demand (off by default), best price by checking every cent – "best under this assumption only". UI `components/DemandExplorer.tsx` (What-If + SmartPricing)
  - `decisions.ts` special order (incremental profit; achievable only if every item the product uses covers regular demand + order) and make-or-buy (relevant costs; unavoidable fixed costs irrelevant). UI `sections/Decisions.tsx`
  - `projection.ts` 12-month projection (monthly sales level + fixed costs; annual = sum of months). UI `components/SeasonalProjection.tsx` on the dashboard
  - `showMath.ts` "Show the math" explanations – built only from already-calculated results, never its own arithmetic (UI: `components/ShowMath.tsx`)
  - `importer.ts`, `templates.ts` Excel/CSV import and templates; `events.ts`, `challenges.ts`; `report.ts` + `reportPdf.ts`
  - `store.ts` single reducer for all app state; `types.ts` input shapes; `samples.ts` fictional sample businesses
- `src/app/` – store context, hash routing (`#dashboard` etc.), confirmation dialog
- `src/sections/` – the 8 sections (incl. 🧭 Decisions) + Home; `src/components/` – shared UI (`ui.tsx` has common pieces)
- All sections stay mounted (hidden) so inputs are never lost when switching tabs. Charts must use `components/ChartContainer.tsx` (not Recharts' ResponsiveContainer) so hidden sections skip drawing them. In `App.test.tsx`, query within a panel (`within(panel(...))`), not `screen` – whole-page label/role queries take several seconds on this large DOM.

## Rules that must not be broken (they are part of the grading)
- **Accuracy first.** Money is calculated in whole cents; inventory in whole thousandths of g/mL/piece; BigInt where products can be large. No NaN/Infinity, no division by zero – show "N/A"/"Not Available" with an explanation.
- **Never silently replace invalid input with 0.** State keeps exactly what the user typed (strings); invalid fields show a message and results pause.
- **Fixed costs are subtracted once for the whole business**, never per product. Contribution margin ≠ operating profit ≠ net income.
- Break-even units round UP; production capacity rounds DOWN. Multi-product break-even assumes a constant sales mix and must say so.
- Keep **expected**, **inventory-constrained** and **scenario** profit separate and labelled. Unsold production is never revenue. Infeasible plans are never shown as achievable.
- **No double counting of costs**: a product uses either one manual variable cost OR itemized (recipe materials + other variable costs). Missing purchase costs are unknown, never $0.
- Duplicates in inventory/imports are flagged, never merged. Recipes are never invented.
- The "suggested plan" is a heuristic and must stay labelled "not proven optimal". Don't call anything optimal unless it is mathematically proven. `optimizer.ts` ("Best mix", branch and bound) may say "proven optimal" only when its search finished (status `proven-optimal`); keep its brute-force cross-check tests.
- Never describe a price as guaranteed or market-optimal. Experiments (Pricing Lab, Production Planner, events) don't change the business until the user confirms.
- All sample/demo data is **fictional** and labelled so. All amounts CAD.
- Ask for confirmation (use `useConfirm`) before replacing or deleting important data.
- Every new calculation needs unit tests; new workflows need a test in `src/App.test.tsx`. Don't claim tests pass unless they ran.

## Verified results (don't regress)
- Demo café (Coffee $6/$2/300, Muffin $4/$1.50/150, Sandwich $9/$4/100, Cookie $3/$1/200, fixed $1,500): revenue $3,900, VC $1,425, CM $2,475, operating profit $975; sales-mix break-even 455 units (182/91/61/121), break-even revenue $2,363.64.
- Inventory example (2,000 g beans, 5,000 mL milk, 100 cups; 20 g/200 mL/1 per coffee): 25 coffees, milk limiting.
- These were independently recalculated on 2 Nov 2026 – no discrepancies (see README → Independent verification).

## Design
Sage green / cream / white / pastel yellow / muted dark green; rounded cards, soft shadows; fonts Bricolage Grotesque (display) + Figtree. Colours are Tailwind tokens in `tailwind.config.js` (`sage`, `cream`, `butter`, `loss`). Must work at phone width with no sideways page scrolling.

## Still to do (owned by the student team)
- Fill in the README manual testing table (Actual Result / Pass-Fail) – only with real results.
- Run real user testing, record feedback in the README section, and make at least one improvement based on it (required by the brief). Never invent feedback or results.
- Vercel: remove the `price-it-right.ca` redirect unless the domain is actually owned and its DNS is set (A record @ → 216.198.79.1).
- Built: "Show the math", "Save my work", sensitivity + DOL, after-tax target, price-sensitive demand, Decisions, Excel export (9 Nov 2026). Still to do: independent verification of the new hand checks; extras: French toggle.
