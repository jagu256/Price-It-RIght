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

### Feature 6 – Decisions: special order and make-or-buy (9 Nov 2026)
- New `src/lib/decisions.ts` and a new **🧭 Decisions** section (between Production Planner and Business Challenge).
- Special order: incremental profit = order CM − extra one-time costs − CM lost on displaced regular sales. The inventory check reuses `checkPlan` on regular demand (less lost units) plus the order.
- **Design decision found while building:** in the Coffee Shop example, regular demand is already short of beans and milk. A whole-business check would therefore have called every special order "infeasible", even a muffin order that uses only flour and sugar. The rule used instead is that an order is achievable only if every item **its product uses** covers regular demand (all products sharing the item) plus the order. Items it doesn't use can't be affected by the order, so their existing shortages are reported separately. An order that doesn't fit is labelled "not achievable", and its profit is only described as "if you could get the extra inventory".
- Make or buy: relevant cost to make (variable + avoidable fixed + opportunity cost) vs cost to buy; unavoidable fixed costs shown crossed out as irrelevant; decision rule and qualitative factors.

**Checks:** 259 tests in 16 files passed; build passed. At 375 px the new section has no sideways scrolling.

### Feature 7 – Excel export (9 Nov 2026)
- New `src/lib/excelExport.ts` and a *Download my business as Excel* button in Business Report (the backup-file note in Save my work now points to it). Sheets: Products, Summary, Break-even, Inventory & shortages, Production plan. Numbers are number cells with CAD, % and unit formats; the writer library loads only on click. `fflate` 0.8.3 (already installed with read-excel-file) was added as a pinned dev dependency so the test can unzip the file and check the stored formats.
- **Checks:** 267 tests in 17 files passed, including reading the generated file back; build passed with Vite's 800 kB size warning for the main file (824 kB, 235 kB gzipped) – a warning, not an error.

### Extra A – 12-month projection with seasonality (9 Nov 2026)
- New `src/lib/projection.ts` and a 📅 panel on the Profit Dashboard: a sales level and fixed costs per month; monthly revenue, CM and operating profit; annual totals (sum of the months, tested over 200 random patterns); best/worst month; months below break-even; chart and table. Settings are an experiment and not saved.
- **AI mistake caught:** a test written by the AI claimed December (150 %) would be the best month. Working it by hand showed July (130 %) is better by $5, because December's fixed costs were $500 higher. The test was corrected, and the example is kept in the README because it shows why monthly fixed costs matter.

**Slow tests investigated (not an app speed problem):** after Extra A, four click-through tests took 16–21 s and went over the 15 s limit. Measuring rather than guessing showed:
- Drawing each screen takes only 6–146 ms in the test browser.
- The time went into the testing library's "find by label" searches across the whole page (6.8 s for one search). They grew with every new screen, because every section stays mounted.

Two fixes:
1. Charts are now drawn only on the screen being viewed (`app/visibility.tsx`, `components/ChartContainer.tsx`). Charts hold no inputs, so nothing is lost, and typing no longer redraws charts on hidden screens.
2. The tests search within the screen they mean, and find the confirmation dialog directly.

No test assertion was weakened. The slowest test went from 21 s to 6.6 s.

**Checks:** 281 tests in 18 files passed; build passed.

### Extra C – Exact product-mix optimizer (9 Nov 2026)
- The brief allowed this only if it could be proven correct. New `src/lib/optimizer.ts`: branch and bound with a valid upper bound (each remaining product's stand-alone maximum from the stock left). It is exact when the search completes, and is labelled "proven optimal" only then. If the 2,000,000-step limit is reached, it is labelled "suggested – not proven optimal".
- Checked against an independent brute-force search written separately in the tests: 300 random problems, the Expert challenge bakery (every one of 151 × 121 × 201 plans) and the demo café. All match. Production Planner gets a "🧮 Best mix (exact search)" button; the existing heuristic "Suggested plan" keeps its "not proven optimal" label.

**Checks:** 290 tests in 19 files passed; build passed.

### Extra B – French toggle (English / Français) (9 Nov 2026)
- **Design:** every UI text is English inside `t('…')`; the French lives in ONE file, `src/i18n/fr.ts` (≈1,200 entries). `src/i18n/i18n.ts` is the translator (`t`, `tx` for lists translated when shown, `plural` with the French rule that 0 and 1 are singular). `app/language.tsx` redraws the whole app when the language changes; the choice is kept in localStorage (`price-it-right:language`, try/catch).
- **Formats:** `format.ts` now follows the language (fr-CA: `1 800 $`, `63,5 %`, `9 novembre 2026`); in French a decimal comma (`6,50`) is accepted. Calculations are unchanged and still in whole cents.
- **Built in five parts** (local commits): language switch + Home/My Business; Profit Dashboard, explanations and Show the math; Pricing Lab; Smart Inventory Hub + importer (French headings and units) + templates; Production Planner, Decisions, Challenges, Business Report, PDF and Excel.
- **Language-dependent logic removed:** a few screens compared displayed English text to decide things (What-If rows, a surprise-event warning colour, a recipe check). They now use internal keys, so behaviour is identical in both languages.
- **Challenges** keep their text as getters (`get label() { return t('…') }`) so it is translated when read, not when the file loads.
- The user's own data is never translated; fictional samples are translated when loaded.
- **Tests:** `dictionary.test.ts` (every `t('…')` in the source has French, placeholders match), `frenchOutputs.test.ts` (report, PDF text, Excel in French with the same numbers), `App.fr.test.tsx` (French click-throughs and a check that every screen has no missing translation – it caught one: the planner's "kg" unit label).
- **Uncertain translations** are listed in the README for a French speaker to review.

**Checks:** 307 tests in 22 files passed; build passed (main file 1,012 kB / 288 kB gzipped – Vite's size warning, not an error). At 375 px every section in French has no sideways scrolling (checked in the browser).

### Independent verification of the new features (9 Nov 2026)
- As the brief asked, a separate agent with no access to the code recalculated nine scenarios from the problem statements alone, in exact integer arithmetic: café totals and break-even, sensitivity and DOL, after-tax target, price-sensitive demand, special order, make-or-buy, 12-month projection, capacity, and the Best mix brute force. A temporary script ran the app's own functions on the same inputs and was then deleted.
- **Every figure matched** (table in README → Independent verification). The checker also pointed out that $13.36 falls short of $200 profit inside the $8.58–$13.40 range. The app already allows for this: it reports only the lowest and highest qualifying price.
- **Final checks:** 307 tests in 22 files passed; build passed.

### More features – 1. Budget vs actual (15 Nov 2026)
- The user asked for every item on the list of extra features and UI/UX changes, one at a time. The first was variance analysis, chosen for its accounting value.
- New `src/lib/variance.ts` (flexible-budget variances in whole cents with BigInt; the quantity variance is rounded to the cent and mix is the remainder, so the variances add up exactly) and the `components/VarianceAnalysis.tsx` panel on the Profit Dashboard, prefilled with the budget and not saved.
- Hand-worked example: $975 budget → $943 actual (+5 − 32 + 45 − 50), checked directly from the actual figures.
- **AI slip caught by a test:** the first test multiplied units by 1.1, and in JavaScript 300 × 1.1 is not exactly 330. The test now uses whole-number arithmetic. The app's own inputs are always whole units because they are validated.

**Checks:** 319 tests in 23 files passed; build passed; no sideways scrolling at 375 px.

### More features – 2. What should I buy? (15 Nov 2026)
- New `src/lib/purchasing.ts` (target = need × (1 + buffer) rounded up; whole packs rounded up; cost in whole cents via millionths of a dollar; unknown cost stays unknown) and `components/PurchasePlanner.tsx` in the Smart Inventory Hub. The buffer and pack sizes are not saved.
- Hand-worked: demo café $20 (milk) + $11.25 (butter) = $31.25; with a 10 % buffer $51.88. All 7 unit tests passed on the first run.
- The panel says plainly that buying stock is a cash payment, not an expense, so it is not mixed up with operating profit.

**Checks:** 327 tests in 24 files passed; build passed.

### More features – 3. Cost-plus pricing helper (15 Nov 2026)
- New `src/lib/costPlus.ts` (markup and margin prices in whole cents, rounded up so the rate is always reached; markup ↔ margin conversion) and `components/CostPlusPricing.tsx` in the Pricing Lab, with a "try in What-If" button that changes only the experiment.
- Hand checks: $2 + 50 % = $3.00 (33.3 % margin), $2 at 50 % margin = $4.00 (100 % markup). A grid test confirms the price always reaches the rate and is less than a cent above the exact answer.
- Prices here are shown with cents ($3.00, not $3) because they are unit prices.

**Checks:** 337 tests in 25 files passed; build passed.

### More features – 4. Save and compare scenarios (15 Nov 2026)
- New `compareScenarios` in `src/lib/pricing.ts` and a `scenario-load` store action (with a deep copy, so later edits don't change a saved scenario). The UI is `components/SavedScenarios.tsx` under the What-If simulator: save up to 6, compare side by side, load back, and delete with confirmation.
- Design decision: saved scenarios are kept only while the app is open, following the existing rule that only the business is saved (never experiments). They store the typed changes and are recalculated from the current business. "Highest profit of these" is worded so it is never mistaken for "optimal".

**Checks:** 343 tests in 26 files passed; build passed.

### More features – 5. Step fixed costs (15 Nov 2026)
- New `src/lib/stepCosts.ts` (ranges, break-even per range at the expected mix using exact BigInt fractions, profit at any unit level, chart points on both sides of each step) and `components/StepFixedCosts.tsx` on the Profit Dashboard (up to 3 steps; duplicate levels are flagged, never merged; not saved).
- Hand checks: +$500 above 600 → break-even 455 and again 607, −$16.70 at 601 units, $475 at expected sales. This shows the course idea that "fixed" costs are fixed only within a relevant range.
- The explanation uses the weighted CM calculated in the library, so the UI does no arithmetic of its own.

**Checks:** 352 tests in 27 files passed; build passed.

### UI/UX – 6. Guided first-visit tour (15 Nov 2026)
- New `src/lib/tour.ts` (8 steps; "done" flag in localStorage, wrapped in try/catch) and `components/GuidedTour.tsx` (a `TourProvider` with a small non-blocking card: Back / Next / Skip / Finish, Esc, focus moved to the card). Home has a **🧭 Take the tour** button.
- `App` has an `autoTour` prop: the real app (`main.tsx`) turns it on, and the tests leave it off so the tour doesn't get in the way of other tests. A dedicated test turns it on.
- **Bug caught by a test:** the first version added the highlight class to the tab directly, and React removed it when the page changed. The Header now draws the highlight from the tour's state.
- Checked in the browser at 375 px: the card fits at the bottom, the tab is outlined, and there is no sideways scrolling.

**Checks:** 357 tests in 28 files passed; build passed.

### UI/UX – 7. Term tooltips (15 Nov 2026)
- New `src/lib/glossary.ts` (22 one-line definitions, consistent with "Understand Your Numbers") and `components/TermTip.tsx`: an **i** button (`aria-expanded`, label "What is …?") showing a short note. `ResultCard` and `SubHeader` got an optional `term` prop. The ⓘ sits next to the heading, not inside it, so headings keep their names.
- **Two problems found by checking at phone width in the browser:**
  1. The first version opened the box beside the button, and near the screen edges part of it ran off the screen (−21 px / 438 px on a 375 px phone). The box is now placed from the button's position and kept within 8 px of each edge.
  2. Inside the dashboard cards it then appeared hundreds of pixels away, because the cards' lift animation (a CSS transform) changes what "fixed" positions are measured from. The box is now drawn at the top level of the page with a React portal.
  Re-measured: every box opens 6 px under its button and stays within the screen.
- The box closes on a second tap, Esc, a click elsewhere or scrolling.

**Checks:** 360 tests in 29 files passed; build passed.

### UI/UX – 8. Live profit bar (15 Nov 2026)
- New `components/LiveProfitBar.tsx`: a sticky bar at the bottom of My Business showing revenue, CM and operating profit/loss from `model.summary` (no maths of its own), plus a dashboard link. When values are invalid it says how many fields need fixing (counted per field, not per product), and it never shows $0 in place of an unknown result.
- On the dark bar it uses light colours instead of the usual green/red money colours, which would have been hard to read. Checked at 375 px: it stays at the bottom while scrolling, within the screen width.

**Checks:** 361 tests in 29 files passed; build passed.

### UI/UX – 9. Undo after delete or Apply (15 Nov 2026)
- The reducer in `src/lib/store.ts` is now a small wrapper around the original (`baseReducer`). For big changes (listed in `undoMessage`) it remembers the previous business and baseline. `undo` restores them and `undo-dismiss` forgets them. **Any other change to the business clears the undo**, so undoing can never silently throw away a later edit. Experiments (What-If, planner) don't clear it.
- `components/UndoToast.tsx` shows the message with ↩ Undo and ✕. It closes after 15 s and sits at the top right so it doesn't cover the live profit bar. Existing confirmations stay. Undo is an extra safety net, not a replacement.
- Messages are stored as English keys and translated when shown, so they follow the language switch.

**Checks:** 369 tests in 30 files passed; build passed.

### UI/UX – 10. Setup checklist on Home (15 Nov 2026)
- New `src/lib/setupChecklist.ts` (5 items from the validated model: name, fixed costs, valid products, and inventory and recipes, both marked optional) and `components/SetupChecklist.tsx` under the Home hero: "x of 5 done", an accessible progress bar, ✅/⬜ per item with screen-reader "Done:/To do:", and a Go → link to the right section for anything missing.
- Nothing is assumed: an invalid value or a product without a recipe is never ticked. The Coffee Shop example shows 4 of 5 because its Sandwich has no recipe, on purpose.

**Checks:** 374 tests in 31 files passed; build passed.

### UI/UX – 11. Larger text and high contrast (15 Nov 2026)
- New `src/lib/display.ts` (load/save with try/catch; only real true/false values are accepted; applied as `data-text` and `data-contrast` attributes on `<html>`), CSS rules in `index.css` (112.5 % root font size, because everything is in rem, plus darker sage text and borders and a white background), and two `aria-pressed` buttons in the header. `main.tsx` applies the saved choice before the first paint.
- **Bug caught in the browser check:** two quick clicks (A+ then ◐) lost the first choice, because the second click built on out-of-date settings. Each click now updates the latest settings, and the click-through test clicks both straight after each other.
- Checked at 375 px with both on: 18 px text, no sideways scrolling on any of the 9 screens, and the header buttons fit (the business name hides itself to make room).

**Checks:** 378 tests in 32 files passed; build passed. The main file is now 1,094 kB (311 kB gzipped), still Vite’s size warning, not an error.

**All 11 items on the extra-features / UI-UX list are built** (15 Nov 2026). Not done: real user testing (still owned by the team).

### Independent re-check of the 15 Nov features (15 Nov 2026)
- The user asked for it. A separate agent with no access to the code recalculated budget vs actual, the purchase plan, cost-plus pricing, saved scenarios and step fixed costs from the problem statements alone, in exact integer arithmetic. A temporary script ran the app’s functions on the same inputs and was deleted afterwards.
- **Every figure matched** (table in README → Independent verification), including the checker’s extra cases (2 L cartons, profit at 501 units). Its reading of "above 600 units" as strictly more than 600 matches the app.

### More ideas – 1. Drop a product? (15 Nov 2026)
- The user asked for all 10 items in a second list of suggestions. This is the first: `dropProduct` in `src/lib/decisions.ts` (lost CM vs avoidable fixed costs, other products' lost CM and freed-capacity gains, in whole cents) and a `DropProduct` panel in `sections/Decisions.tsx` with the decision rule and qualitative factors.
- Hand checks: Sandwich $500 CM → keep at $300 saved (−$200), drop at $600 (+$100), keep again if $150 of coffee contribution is lost (−$50).

**Checks:** 385 tests in 32 files passed; build passed.

### More ideas – 2. Price change: how many must I sell? (15 Nov 2026)
- `volumeForPrice` in `src/lib/pricing.ts` (current total CM ÷ new CM per unit, rounded up, in whole cents with BigInt; *not possible* when the new CM ≤ $0) and `components/PriceChangeVolume.tsx` in the Pricing Lab, with "try it in What-If".
- Hand checks: Coffee $6 → $5 needs 400 units (+100); $7 needs 240 (−60); $5.50 needs 343.
- Kept to the project rule: the first version of the screen worked out the current contribution itself. It now comes from the library function.

**Checks:** 392 tests in 33 files passed; build passed.

### More ideas – 3. 3-month cash budget (15 Nov 2026)
- New `src/lib/cashBudget.ts` (reuses the projection's monthly units rounding; collections split by % paid now, rounded to the cent with the remainder collected next month, so no cent is lost) and `components/CashBudget.tsx` on the Profit Dashboard.
- Teaching point it demonstrates: with 60 % paid in the same month, the café is profitable ($975) yet has −$85 cash at the end of month 1.

**Checks:** 399 tests in 34 files passed; build passed.

### More ideas – 4. Target costing (15 Nov 2026)
- `targetCost` in `src/lib/costPlus.ts` (price × (1 − margin), rounded down so the margin is always met) and `components/TargetCosting.tsx` right after cost-plus pricing in the Pricing Lab, so the two methods sit side by side.
- Hand checks: $6 at 70 % → $1.80 (cut $0.20, 10 %); $4.99 at 60 % → $1.99. Cost-plus followed by target costing returns the original cost.

**Checks:** 404 tests in 34 files passed; build passed.

### More ideas – 5. Product ranking badges (15 Nov 2026)
- New `src/lib/productRanking.ts` (CM per unit vs weighted average and units vs average per product, compared with BigInt cross-multiplication so there is no rounding) and `components/ProductRanking.tsx` under the product table in My Business.
- Demo: Coffee star, Muffin review, Sandwich hidden gem, Cookie popular. Labelled as a guide, not a verdict.

**Checks:** 409 tests in 35 files passed; build passed.

### More ideas – 6. Presentation mode (15 Nov 2026)
- New `components/Presentation.tsx`: a button on the Profit Dashboard opens a full-screen dialog (in a portal, page scrolling locked while open) with six slides built from `model.summary` and the inventory check. There is no new arithmetic: the bar widths only scale the drawing. ← → / PageUp / PageDown / Space and Esc work, with Back/Next/Exit buttons.
- Measured in the browser: the slides fill a 1280×720 screen and fit a 375 px phone with no sideways overflow.
- Purpose: the oral demo. The "Keep in mind" slide repeats the key assumptions (fixed costs once, constant mix, not net income).

**Checks:** 410 tests in 35 files passed; build passed.

## Recommendations discussed (9 Nov 2026) – built since (see above)
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
