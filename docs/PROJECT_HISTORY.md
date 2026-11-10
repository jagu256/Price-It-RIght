# Project history – how Price It Right was built

A record of the AI-assisted development of Price It Right (ACCT 4500), written so a new Claude Code session, or a marker, can see what was asked, what was built, what was checked and what is still open. The original requirement briefs are in [`docs/requirements/`](requirements/).

All work below was done with Claude (Anthropic) in one claude.ai session, 2–9 November 2026, directed by the student.

---

## Stage 1 – Original single-product simulator (2 Nov 2026)
**Brief:** [`1-original-app-brief.md`](requirements/1-original-app-brief.md)

Built from scratch with React + TypeScript + Vite + Tailwind + Recharts:
- Welcome page, 5 business categories with fictional defaults, input panel with term explanations, price slider.
- Single-product CVP: revenue, contribution margin, CM ratio, operating profit, break-even (rounded up), break-even revenue (theoretical vs. rounded units), margin of safety.
- Six-card results dashboard with plain-language explanations; contribution-format income statement.
- What-If price simulator (volume held constant, baseline only changed by "Apply new price", Reset Scenario).
- Two charts: revenue vs. total costs (break-even dot) and profit at different volumes.
- Validation: blank, negative, letters, fractional units, >2 decimals, very large numbers. Invalid input is kept as typed and never turned into 0.

**Decisions:** money in whole cents (avoids 0.1 + 0.2 errors); text inputs instead of number inputs so mistakes stay visible; results update live after the first "Calculate".

**Checks:** 61 tests passed; build passed. A browser check found a chart bug (when every bar was a loss, the profit axis didn't start at $0, which made bars misleading). It was fixed, along with a typographic minus sign. Published a preview; README written with a blank manual-test table and feedback section.

## Stage 2 – Inventory & Sales Estimator (2 Nov 2026)
**Brief:** [`2-inventory-estimator-brief.md`](requirements/2-inventory-estimator-brief.md)

- Added a separate section: inventory rows (add/edit/remove), units g/kg/mL/L/pieces with conversion, maximum production (round down, lowest item, ties shown), estimated sales = MIN(capacity, demand), revenue/profit via the existing `calculate`, shortage calculator, tooltips, Reset Inventory, service-business and clothing notes.
- Quantities stored as whole thousandths of the base unit so rounding down is exact.

**Checks:** 98 tests passed (the original 61 unchanged + 37 new).
- A test caught a real bug: tapping the "?" tooltip on a phone closed it immediately. It was fixed.
- On phones, the shortage table had a hidden column and the header wrapped. Both were fixed.

## Stage 3 – Full upgrade to a multi-product business tool (2 Nov 2026)
**Brief:** [`3-full-upgrade-brief.md`](requirements/3-full-upgrade-brief.md)

Restructured into one shared store and 7 sections:
- **🏠 My Business:** business picker with confirmation before replacing work; product table with add, edit, duplicate, delete and sort.
- **💰 Profit Dashboard:** 6 cards, 3 charts, sales-mix break-even with a whole-unit split, one-product break-even calculator, and "three ways to look at profit".
- **🎯 Pricing Lab:** what-if (apply/reset/compare), "What price should I charge?", profit goal tracker, 🎲 surprise events.
- **📦 Smart Inventory Hub:** Excel/CSV import wizard with mapping, validation and templates; editable inventory with 🟢🟡🔴 status; recipes (manual + upload, unknown-name matching); product costing in manual or itemized mode; production capacity.
- **🏆 Production Planner:** CM per unit of scarce resource, plan simulator with hypothetical extra inventory, "keep my mix" plan, labelled heuristic "suggested plan", alerts.
- **🎮 Business Challenge:** 3 fictional levels with explicit success rules.
- **📊 Business Report:** PDF generated in the browser.

The old single-product dashboard, what-if and estimator were folded in (not duplicated). The single-product calculator is reused as the one-product break-even tool. Libraries were chosen at versions at least two weeks old; production dependencies had 0 known vulnerabilities. The PDF and spreadsheet code loads only when needed.

**Key accounting decisions:**
- Multi-product break-even uses a constant sales mix and weighted-average CM. Whole units are allocated by largest remainder, adding a unit until fixed costs are covered.
- Each product uses either one manual variable cost OR itemized costing. Materials are added to a manual figure only after explicit confirmation. Missing purchase costs are never $0.
- Shared inventory: requirements are summed across products, never independent capacities added together.
- Inventory-constrained profit = "keep the mix, scale to fit" (one feasible plan, not optimal). The suggested plan is a heuristic labelled "not proven optimal".
- Required price rounds UP to the next cent; the screen states that demand may change.
- Inventory purchases are cash, not expense; inventory turnover isn't calculated (data not available).

**Checks:**
- **156 tests in 10 files passed**; build passed.
- Mistakes caught during development (examples of why checking matters):
  - Two test expectations written by the AI were wrong: a tie in sorting, and a misunderstood rounding case. The code was right; the tests were corrected after checking by hand.
  - An importer test had a wrong row number (the code was right).
  - The simulated browser used for tests lacked file-reading features, so test support was added.
  - Hidden accessibility labels widened the My Business page; fixed with one CSS rule.
  - The PDF filename dropped "é" (fixed).
  - The required-price note showed a confusing rounded "exact" figure; it now shows 4 decimals.
- **Independent verification:** a separate AI agent that had not seen the code recalculated 8 scenarios in exact Python fractions, then compared them with the app's functions. **No discrepancies.** Its suggestions led to labelling that the margin of safety uses theoretical break-even revenue. The full table is in the README.

## Deployment (2–9 Nov 2026)
- GitHub: `jagu256/Price-It-RIght` (renamed by the owner from `price-it-right`). Commits: v1 (stage 1–2), v2 (stage 3), then this documentation.
- Vercel project `price-it-r-ight` (Hobby), live at https://price-it-r-ight.vercel.app. Every push to `main` redeploys.
- Open issue: a custom domain `price-it-right.ca` was added in Vercel with "Invalid Configuration", and the vercel.app address was set to redirect to it. Advice given: remove the domain/redirect unless it is actually owned. If owned, add DNS A record `@ → 216.198.79.1` at the registrar.

## Recommendations discussed (9 Nov 2026) – not yet built
Priority for the grade:
1. Real user testing + one improvement based on it (required by the brief).
2. Fill in the manual testing table.
3. Prepare a 5-minute demo script.

Feature ideas, by value:
- "Show me the math" on each card
- Save my work (localStorage + export/import file)
- Sensitivity analysis + degree of operating leverage
- After-tax target profit
- Optional price-sensitive demand
- Special-order / make-or-buy tool
- Excel export
- French language toggle
- 12-month seasonality
- An exact product-mix optimizer (only if proven optimal)

## Not done – and must not be invented
- No real user testing has happened yet; the README feedback section is intentionally empty.
- The manual testing table's "Actual Result" and "Pass/Fail" columns are intentionally blank.
