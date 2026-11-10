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

## Stage 4 – Feature upgrades in Claude Code (from 9 Nov 2026)
Work moved from claude.ai to Claude Code. The repository was cloned fresh from GitHub; before any change, `npm install`, `npm test` (156 passed) and `npm run build` were run and passed. Features are built one at a time, each with tests, a README update, a commit and a check of the live site by the student before the next one starts.

### Feature 1 – "Show the math" (9 Nov 2026)
- New `src/lib/showMath.ts`: pure functions that take an already-calculated result and return the formula in words, the formula with the user's numbers, and the result as displayed. They do no arithmetic of their own, so an explanation cannot disagree with the screen.
- New `ShowMath` button component, added to the six dashboard cards, sales-mix break-even, margin of safety, the one-product break-even calculator, the What-If modified plan, the minimum calculated price, the profit goal tracker and the Production Planner's modified plan.
- No existing calculation or feature was changed. One duplicated rounding check in the price assistant now uses a shared, tested helper.

**Checks:** 171 tests in 11 files passed (156 unchanged + 13 unit + 2 click-through); build passed. Looked at in a browser at phone width (375 px) with nine explanations open: no sideways scrolling. `npm audit` reports 3 advisories in the test tool (Vitest) only, not in the published site; left as is because the fix is a major-version upgrade.

### Feature 2 – Save my work (9 Nov 2026)
- New `src/lib/saveWork.ts` (pure, tested): save-file format with an app name and **schema version 1**; full validation of imported files with plain-language errors; fresh internal ids on import; browser-storage read/write/clear wrapped in try/catch so blocked or full storage never crashes the app.
- Auto-save of the business only (name, fixed costs, products, inventory, recipes). An unchanged example is not saved. Experiments and challenge progress are never saved. The saved business is restored on reload, and the app says so; a damaged saved copy is reported and the example loads instead.
- On My Business: *Export my business* (.json), *Import a saved business* (asks before replacing), *Start fresh* (asks first), a "Saving is off" warning when storage is blocked, and a privacy note. The footer now says data is saved on this device only.
- A restored or imported business counts as the user's own work, so the existing "switch business" and "load demo" confirmations still protect it.

**Problems found and fixed during development:**
- On this computer's Node version (26), the simulated test browser has no `localStorage` (Node switches its own off without a file). The test setup now provides an in-memory one, like the earlier file-reading fix. Real browsers are unaffected.
- The first version stored a new "saved at" time after every keystroke, which made the whole app draw itself twice per change. It now only redraws when the save status changes, so the card no longer shows the save time.
- Measured on this computer, an existing click-through test ("asks before switching business") went from 3.9 s to 4.5 s, and with all files running together it passed the 5 s "probably stuck" limit. The limit was raised to 15 s in `vite.config.ts`; no test or expected value was weakened. One new test was split into two shorter ones.
- One test expectation written by the AI was wrong (it assumed the Coffee Shop example's fixed costs are $800; they are $1,500). The test was corrected; the app was right.

**Checks:** 196 tests in 12 files passed (171 earlier + 16 unit + 9 click-through); build passed. In a browser: typing $1,750 saved immediately with schema version 1 and only the business; after a page reload $1,750 and the "restored" message were back; at 375 px the Save card fits with no sideways scrolling.

### Export label (9 Nov 2026)
The student expected "Export my business" to give a spreadsheet. The .json file is a backup for re-importing, so the button now says "(backup file)" and a note explains why a computer may show it as a code file. The Excel download is Feature 7.

### Feature 3 – Sensitivity analysis + degree of operating leverage (9 Nov 2026)
- New `src/lib/sensitivity.ts`: profit when selling prices, variable costs, sales volume (same mix) or fixed costs move ±10 % on their own, in whole cents; degree of operating leverage = total CM ÷ operating profit, or "not meaningful" (with the reason) at $0 profit or a loss.
- On the Profit Dashboard: a table, a tornado chart (largest swing at the top), the DOL figure and "Show the math" for both.
- From the student's brief, all five hand-checked answers are reproduced exactly by unit tests: +$390 → $1,365; −$142.50 → $832.50; +$247.50 → $1,222.50 (+25.4 % = DOL × 10 %); −$150 → $825; DOL 2.54.

**Checks:** 210 tests in 13 files passed; build passed. At 375 px the dashboard has no sideways scrolling and the chart draws all 8 bars.

### Feature 4 – After-tax target profit (9 Nov 2026)
- New `src/lib/tax.ts`: tax-rate validation (0–100 %, user-entered, nothing hard-coded), required pre-tax profit = after-tax target ÷ (1 − rate) rounded UP to the cent, estimated tax (nearest cent, none on a loss), 100 % rate → Not Available.
- Pricing Lab: an optional, unticked-by-default panel that shows the required pre-tax profit, the estimated tax on current profit and after-tax operating profit, with "Show the math" and a "simplified estimate – not tax advice" label. When it is on, *What Price Should I Charge?* and the *Profit Goal Tracker* use the pre-tax figure as their target. It is an experiment and is not saved.
- Hand check reproduced: $1,000 after tax at 20 % → $1,250 pre-tax. A test over 72 target/rate pairs confirms the rounded pre-tax figure always leaves at least the target after tax.

**Checks:** 223 tests in 14 files passed; build passed.

### Feature 5 – Optional price-sensitive demand (9 Nov 2026)
- New `src/lib/demand.ts`: "for every $1 change in price, sales change by X units (opposite direction)", with X a whole number ≥ 0 and units rounded down and never negative; best price found by checking every cent from $0 to where sales reach zero (no calculus shortcut); lowest and highest prices that reach a target.
- One shared panel, off by default, in the What-If simulator (with "Try this price in the modified plan") and in *What Price Should I Charge?*. It has a profit-vs-price chart and a "best price under this assumption only" label. The "contribution from other products" sum moved into a tested library function (`contributionFromOthers`), so the screen no longer does that arithmetic itself.
- Hand check reproduced: the Intermediate challenge's rule (400 − 20 × price, cost $2, fixed $1,300) gives 220 units and $240 profit at $9.

**Mistakes caught:** two test expectations written by the AI were wrong, and the code was right. (1) It guessed $8.70 as the lowest price for a $200 profit; checking by hand gives $8.58 (228 units, $200.24). (2) It expected no sales at any price when none were expected at today's price; under the linear rule, lower prices win customers, so the best price is $3.50. A debugging run also showed that, because units are whole, the prices reaching a target are not one unbroken range ($13.35 works, $13.36 falls short, $13.40 works). The screen now says this instead of implying every price in between works.

**Checks:** 242 tests in 15 files passed; build passed. At 375 px with both demand panels and the after-tax panel open: no sideways scrolling.

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
