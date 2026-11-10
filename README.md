# Price It Right

**Set your price. Know your costs. Maximize your profit.**

Price It Right is a small-business pricing, inventory and profitability simulator built for an **ACCT 4500** group project. Users can manage several products, see contribution margins and break-even points, test pricing scenarios, upload inventory spreadsheets, link products to inventory through recipes, plan production when inventory is limited, play business challenges and download a PDF report.

It is an **educational decision-support tool**: every result depends on the assumptions the user enters. All sample and demo data is **fictional**.

---

## Contents
1. [Problem being solved](#problem-being-solved)
2. [Target users](#target-users)
3. [Features](#features)
4. [Main user workflows](#main-user-workflows)
5. [Accounting calculations](#accounting-calculations)
6. [Financial assumptions](#financial-assumptions)
7. [Inventory upload instructions](#inventory-upload-instructions)
8. [Product recipe instructions](#product-recipe-instructions)
9. [Production planning methodology](#production-planning-methodology)
10. [Installation](#installation)
11. [Testing](#testing)
12. [Known limitations](#known-limitations)
13. [AI-assisted development disclosure](#ai-assisted-development-disclosure)
14. [Deployment](#deployment-github--vercel)

---

## Problem being solved

Small-business owners often set prices by gut feel and track stock in a separate spreadsheet. They may not know:

- how much each product contributes once its variable costs are paid,
- how many sales they need to break even with several products,
- whether they have enough inventory to meet demand, or
- which products make the best use of a scarce ingredient.

Price It Right brings cost-volume-profit (CVP) analysis, product costing and inventory-constrained planning together in one beginner-friendly tool that runs entirely in the browser.

## Target users

- Small-business owners and side-hustlers (cafés, bakeries, salons, shops, services)
- Student entrepreneurs testing an idea
- Accounting and business students learning managerial accounting

## Features

| Section | What it does |
|---|---|
| **Home** | Name, tagline and description. **🚀 Start My Business** and **✨ Try a Demo Business** (a complete fictional café). Four-step guide. **📚 Understand Your Numbers** explains ten concepts. |
| **🏠 My Business** | Choose ☕ Coffee Shop, 🧁 Bakery, 💅 Nail Salon, 👕 Clothing Store or ✨ Custom (fictional samples). The app asks for confirmation before replacing your work. Enter the business name and monthly fixed costs once. **🛒 My Product Collection** is an editable table: add, edit, duplicate or delete (with confirmation), optional category, sorting, and per-product revenue, variable costs, CM per unit, total CM and CM ratio. |
| **💰 Profit Dashboard** | **Your Business at a Glance**: six summary cards with explanations. *Three ways to look at profit*: expected, inventory-constrained and scenario. Charts: **A** revenue vs. total costs (with the break-even point), **B** contribution by product, **C** revenue breakdown. Sales-mix break-even with a whole-unit split per product, plus an interactive single-product break-even calculator. |
| **🎯 Pricing Lab** | **What-If Pricing Simulator** comparing the current and modified plans, with Apply Changes (confirmed), Reset Scenario and Compare Results. **💡 What Price Should I Charge?** finds the minimum price for a target profit. **Profit Goal Tracker** shows progress, the gap, and the plan needed (same mix, your own mix, or one product). **🎲 Surprise Me!** offers five hypothetical events; you can accept, modify or reset each. |
| **📦 Smart Inventory Hub** | Upload **Excel (.xlsx) or CSV** by file picker or drag-and-drop. Includes worksheet choice, preview, column mapping you confirm, row-by-row validation, and replace or add. Downloadable template. Editable inventory table with unit conversion, purchase costs and 🟢/🟡/🔴 status. **🔗 Connect Your Products to Inventory**: recipes typed in or uploaded, with matching for unknown names. **🧾 Know Your Product Costs**: material costing, using manual or itemized cost. **📦 How Much Can You Produce?**: single-product capacity and shared-inventory check. |
| **🏆 Production Planner** | **What Should I Produce More Of?** shows CM per unit of the scarce resource, with a chart and explanation. Production Plan Simulator: adjust planned units and hypothetical extra inventory, then compare the original and modified plans. Includes a "keep my mix" constrained plan, a labelled **suggested** plan, and inventory alerts. |
| **🎮 Business Challenge** | **Can You Save Your Business?** Beginner, Intermediate and Expert fictional scenarios with clear success conditions. Kept separate from your own data. |
| **🧮 Show the math** (everywhere) | A small **Show the math** button on every main number: the six dashboard cards, sales-mix break-even, margin of safety, the one-product break-even calculator, the What-If modified plan, the minimum calculated price, the profit goal gap, and the Production Planner's modified plan. It shows the formula in words, then the same formula with your own numbers, e.g. *Operating profit = total contribution margin − fixed costs* → *$2,475 − $1,500 = $975*. |
| **📊 Business Report** | Preview, then **📥 Download My Business Report** as a PDF generated in the browser. It covers products, totals, a chart, break-even, inventory, shortages, production planning, any scenario comparison, and assumptions. All amounts are labelled CAD. |

## Main user workflows

1. **Explore quickly:** Home → *Try a Demo Business* → Profit Dashboard → Production Planner.
2. **Model your own business:** My Business → choose a category → edit products and fixed costs → Profit Dashboard.
3. **Test a price change:** Pricing Lab → change a price in the modified plan → compare → *Apply Changes* (or *Reset Scenario*).
4. **Set a price for a goal:** Pricing Lab → *What Price Should I Charge?* → choose a product and target.
5. **Check inventory:** Smart Inventory Hub → download the template → fill it in → upload → confirm columns → review problems → import → add recipes.
6. **Plan production:** Production Planner → see which product uses the scarce item best → adjust the plan → check feasibility and profit.
7. **Report:** Business Report → *Download My Business Report*.

Every section shares one application state, so values stay consistent and nothing is lost when moving between sections. Nothing is saved after the page is closed or refreshed.

## Accounting calculations

All calculations are plain, independently tested TypeScript functions in [`src/lib`](src/lib):

| File | Contents |
|---|---|
| `accounting.ts` | Single-product CVP (used by the single-product break-even calculator and the challenges) |
| `business.ts` | Multi-product totals, sales-mix break-even, whole-unit allocation |
| `model.ts` | Turns typed inputs into validated numbers, and links inventory → recipes → costs → products |
| `stock.ts`, `inventory.ts` | Inventory records, units, conversions, round-down capacity |
| `recipes.ts` | Recipes and material cost |
| `planning.ts` | Shared inventory, shortages, CM per scarce resource, constrained and suggested plans |
| `pricing.ts` | Scenarios, required price, profit goals |
| `showMath.ts` | "Show the math": turns an already-calculated result into the formula in words plus the formula with the user's numbers |
| `importer.ts`, `templates.ts` | Excel/CSV import and templates |
| `events.ts`, `challenges.ts` | Surprise events and challenges |
| `report.ts`, `reportPdf.ts` | The report's contents and its PDF layout |

Money is converted to **whole cents** before arithmetic. Inventory quantities are converted to **whole thousandths of a gram, millilitre or piece**. Exact whole-number (BigInt) arithmetic is used where large products could lose precision. This prevents floating-point errors (e.g. 0.3 ÷ 0.1 is exactly 3) and guarantees no `NaN` or `Infinity` results.

### Product level
| Measure | Formula |
|---|---|
| Revenue | Selling price × expected units sold |
| Total variable costs | Variable cost per unit × expected units sold |
| Contribution margin (CM) per unit | Selling price − variable cost per unit |
| Total CM | Revenue − total variable costs |
| CM ratio | CM per unit ÷ selling price × 100 (**N/A** when the price is $0) |

Fixed costs are **never** subtracted from each product. Product CM is not profit.

### Business level
| Measure | Formula |
|---|---|
| Total revenue / variable costs / CM | Sum across products |
| Monthly operating profit | Total CM − monthly fixed costs (*not net income*: no taxes, interest or other items) |
| Overall CM ratio | Total CM ÷ total revenue × 100 (**N/A** when revenue is $0) |

### Break-even
- **Single product:** Break-even units = fixed costs ÷ CM per unit, **rounded up**. Theoretical break-even revenue uses the unrounded units.
- **Several products (constant sales mix):**
  - Weighted-average CM = Σ (mix share × CM per unit), where mix share = expected units of the product ÷ total expected units.
  - Break-even total units (theoretical) = fixed costs ÷ weighted-average CM.
  - Break-even revenue = fixed costs ÷ overall CM ratio.
  - Product-level whole units use the **largest-remainder method**: the total is rounded up and split by mix share, with leftover units going to the largest remainders. If rounding leaves total CM a few cents short (possible when a product has a negative margin), one unit at a time is added until fixed costs are covered.
  - The app states clearly that **a different mix has a different break-even point**.
- **Not Available** is shown when there are no expected sales, or when the mix's weighted CM is not positive. There is no division by zero.
- **Margin of safety** = expected revenue − theoretical break-even revenue (and as a % of revenue).

### Pricing
- **Required price (multi-product)** = variable cost + (fixed costs + target profit − contribution from other products) ÷ expected units of the selected product. For a single product the other contribution is $0, which gives the standard formula.
  - With *a chosen share*, the product covers a user-entered share of fixed costs plus the target, on its own.
  - The result is rounded **up** to the next cent so the target is met. A check of profit at that price is shown.
  - The app handles 0 expected sales (*Not Available*) and targets already met by other products.
  - The result is a minimum under the user's assumptions, **not** a market-optimal or guaranteed price.
- **Profit goal:** difference = current − target; additional CM required = max(0, target − current).
  - *One product:* extra units = ⌈additional CM ÷ that product's CM⌉. Not possible if its CM ≤ 0.
  - *Sales mix (expected or user-chosen):* the smallest whole-unit plan whose CM ≥ fixed costs + target. Products are never assumed to have the same margin.

### Show the math
The explanations do **no calculating of their own**. Each one receives a result that another function in `src/lib` already produced (the same object the screen displays) and formats its figures with the same helpers the cards use. This means the explanation cannot disagree with the number on screen. The formulas shown are exactly the ones in this section:

| Number | Formula shown | Demo café |
|---|---|---|
| Total revenue | Selling price × expected units, added up for every product (one working line per product) | $1,800 + $600 + $900 + $600 = $3,900 |
| Total variable costs | Variable cost per unit × expected units, added up for every product | $600 + $225 + $400 + $200 = $1,425 |
| Total contribution margin | Total revenue − total variable costs | $3,900 − $1,425 = $2,475 |
| Operating profit | Total contribution margin − fixed costs | $2,475 − $1,500 = $975 |
| Overall CM ratio | Total contribution margin ÷ total revenue × 100 | $2,475 ÷ $3,900 × 100 = 63.5% |
| Weighted-average CM per unit | Total contribution margin ÷ total expected units | $2,475 ÷ 750 units = $3.30 |
| Break-even units (sales mix) | Fixed costs ÷ weighted-average CM per unit, rounded up | $1,500 ÷ ($2,475 ÷ 750) = 454.55, rounded UP to 455 units |
| Break-even revenue | Fixed costs ÷ (total contribution margin ÷ total revenue) | $1,500 ÷ ($2,475 ÷ $3,900) = $2,363.64 |
| Margin of safety | Expected revenue − break-even revenue | $3,900 − $2,363.64 = $1,536.36 |

Total CM ÷ total units is the same number as Σ (mix share × CM per unit); the explanation uses the first form because both figures are already on the dashboard. Negative figures are put in brackets, e.g. −$300 − (−$200) = −$100. When a figure is not available (for example the CM ratio with $0 revenue) the explanation says why instead of showing a number.

### Inventory and costing
| Measure | Formula |
|---|---|
| Max units of one product from an item | ⌊available ÷ quantity per product⌋ |
| Max units of one product | Minimum across its recipe items (the limiting item; ties are shown) |
| Required (several products) | Σ (planned units × quantity per product) |
| Remaining | Available − required |
| Shortage | max(0, required − available) |
| Material cost per product | Σ (quantity required × purchase cost per compatible unit) |
| Variable cost (itemized) | Direct materials + labour + packaging + payment fees + other, rounded to the nearest cent |
| CM per unit of scarce resource | CM per unit ÷ resource used per product (shown per kg, per L or per piece) |

**Required verification examples (reproduced by the app and its tests):**
- Coffee $6/$2/300, Muffin $4/$1.50/150, Sandwich $9/$4/100, Cookie $3/$1/200, fixed $1,500 gives **revenue $3,900, variable costs $1,425, CM $2,475 and operating profit $975**. This is the demo business.
- 2,000 g beans, 5,000 mL milk, 100 cups, with 20 g / 200 mL / 1 cup per coffee, gives **25 coffees, limited by milk**.
- Shared inventory, worked by hand: coffee (200 mL milk) and latte (300 mL milk) sharing 10,000 mL. 30 coffees + 20 lattes need 12,000 mL, which is **2,000 mL short**. Alone, they could make 50 and 33, but those can't be added together. Coffee earns **$20.00 per litre of milk** and latte **$16.67**.

## Financial assumptions

- All amounts are CAD per month. Sales are **expected (forecast)** figures, not actual transactions.
- Price and variable cost per unit are constant. Fixed costs are constant within the relevant range.
- Break-even and goal plans assume a **constant sales mix** unless the user chooses another.
- The What-If simulator does not change demand automatically when prices change; users adjust expected sales themselves.
- **Three profits are kept separate:**
  - *Expected profit* is based on demand.
  - *Inventory-constrained profit* is based on what stock allows: it keeps the mix and scales down.
  - *Scenario profit* is based on modified assumptions.
- Products made beyond expected demand are **not** counted as revenue.
- **No double counting.** Each product uses *either* one manual variable cost (materials assumed included) *or* itemized costing (materials from the recipe + other variable costs). Materials are added to a manual cost only if the user explicitly confirms the manual figure excluded them.
- Missing purchase costs are **never treated as $0** unless the user enters 0.
- **Buying inventory is a cash outflow, not an expense.** Its cost is recognised through variable cost per unit when products are sold, so hypothetical extra inventory does not reduce operating profit by itself.
- **Inventory turnover is not calculated**, because it needs beginning/ending inventory values and cost-of-goods-sold records. It is only defined in the learning section.
- Surprise events and challenges are **fictional, hypothetical scenarios**, not forecasts.
- **Show the math** displays money rounded to the cent and percentages to one decimal, like the rest of the app. Where a displayed step is rounded (e.g. a weighted-average CM of $2.67), a note says the unrounded figure is used for the next step.

## Inventory upload instructions

1. Go to **📦 Smart Inventory Hub** and click **📥 Download Inventory Template** (an Excel file with example rows and an Instructions sheet).
2. Fill in one row per item: **Item Name, Available Quantity, Unit, Cost Per Unit** (cost is optional; leave it blank if unknown). Units can be g, kg, mL, L or pieces (common spellings like "grams", "litres" and "each" are recognised).
3. Drag the file onto the upload box or click **Choose a file**. Files are read **in your browser only** and never sent to a server. Limits: 5 MB and 2,000 rows; formats .xlsx and .csv (save older .xls files as .xlsx first).
4. Choose the worksheet (Excel), check whether the first row holds headings, and **confirm the column mapping**. Common column names are detected automatically, but you can change any of them.
5. Review the results. Valid rows are listed. Problems are reported by row number: missing name or quantity, negative or invalid numbers, unsupported units, invalid costs, and **duplicate names, which are flagged on every copy and never merged**. If most rows fail, the app warns that the mapping may be wrong.
6. Choose **Replace** your inventory or **Add** to it (adding flags names that already exist), then import. Everything can be edited afterwards.

Imported data is a **snapshot**, not a live inventory feed.

## Product recipe instructions

- **By hand:** in **🔗 Connect Your Products to Inventory**, choose a product, click **+ Add ingredient**, select the inventory item, enter the quantity for ONE product and its unit (only compatible units are offered), then **Save recipe**. Unsaved changes are marked, and switching product asks before discarding them.
- **By upload (optional):** download the **Recipe Template**, which has the columns Product, Inventory Item, Quantity Required and Unit. If the file mentions products or items the app doesn't know, you must **match each name to an existing one or skip those rows**. Nothing is invented. Incompatible units and duplicate lines are rejected. Each product in the file has its recipe replaced; other products keep theirs.
- Each product shows its status: ✅ **complete recipe**, ❓ **requirements unknown** (no recipe), or ⚠️ **recipe has errors**. Products without recipes are flagged and never checked against inventory as if they used nothing.

## Production planning methodology

1. **Shared consumption:** a plan's needs are summed across all products before comparing with stock. Separate single-product capacities are never added together.
2. **Feasibility:**
   - *Feasible:* no shortages and every planned product has a recipe.
   - *Not feasible:* at least one item is short. The figures are shown crossed out and labelled as not achievable.
   - *Unverified:* some planned products have no recipe.
3. **Alerts:**
   - 🟢 Sufficient: the plan uses less than 80 % of the item.
   - 🟡 Low Stock: the plan uses 80–100 %.
   - 🔴 Shortage: the plan needs more than is available, with the extra quantity required.
4. **CM per unit of scarce resource** ranks products for one chosen item (by default, the most constrained one) and explains the result with the required caveat. The app never claims the highest CM-per-unit product is automatically best.
5. **Plans you can load into the simulator:**
   - *Expected demand*, the original plan.
   - *Keep my mix, fit inventory.* Every product is scaled by the largest single factor that fits all inventory (an exact fraction), then rounded down. One feasible plan, not necessarily the most profitable.
   - *Suggested plan.* Fill demand in order of CM per unit of the scarce item, using whatever stock remains each time, respecting every item and demand, and skipping products with CM ≤ 0. This is a **heuristic: it is labelled "suggested", not proven optimal**. No optimisation algorithm is claimed.
6. **Plan profit:** units sold = min(planned, demand). Variable costs and revenue apply to units sold.

## Installation

1. Install **Node.js** (LTS) from <https://nodejs.org>.
2. In a terminal inside the project folder:
   ```bash
   npm install
   npm run dev
   ```
3. Open the address shown (usually <http://localhost:5173>).

To build and preview the production version: `npm run build` then `npm run preview`.

**Tech stack:**
- React 18, TypeScript 5.6, Vite 6, Tailwind CSS 3, Recharts 2
- read-excel-file / write-excel-file (Excel), Papa Parse (CSV), jsPDF + jspdf-autotable (PDF)
- Vitest + React Testing Library

There is no backend, database, account system, API key or payment. The PDF and spreadsheet libraries load only when used.

## Testing

```bash
npm test            # run every test once
npm run test:watch  # re-run while editing
```

| Test file | Covers |
|---|---|
| `business.test.ts` | Required financial example; product metrics; $0 price; sorting; one-product business; rounding up; sales-mix break-even and whole-unit split; different mixes; negative-margin step-up; zero sales; zero fixed costs; unreachable break-even; huge numbers |
| `inventoryPlanning.test.ts` | Required inventory example; **shared-inventory scenario worked by hand**; shortages; low stock; extra inventory; CM per litre; material costs; constrained and suggested plans; unsold units; zero inventory; tied limiting items; demand limits; recipes (missing, invalid units, deleted items); costing without double counting; missing costs; inventory validation and duplicates; unit changes; all sample businesses; store actions (add, duplicate, delete, scenario reset/apply) |
| `importer.test.ts` | CSV and real Excel files (multiple sheets); unsupported, empty, oversized and damaged files; column guessing; required and duplicate mappings; missing values; negative and invalid numbers; unsupported units; duplicates flagged on both rows; existing names; wrong-mapping warning; row limit; **downloaded templates import cleanly**; recipe import with unknown-name matching; incompatible units; duplicate recipe lines |
| `pricingEvents.test.ts` | Scenario comparison and invalid scenario values; required price (single, multi-product, rounding up, zero sales, already met, below VC); profit goals; extra units per product; mix plan for target; all five surprise events; all three challenges (success only for valid, feasible plans); report contents; PDF generation |
| `showMath.test.ts` | "Show the math": the demo café's explanations (profit $2,475 − $1,500 = $975, revenue, variable costs, CM, CM ratio, break-even 455 units and $2,363.64, margin of safety); **each explanation's result equals the figure the dashboard displays**; losses and negative numbers; $0 revenue (N/A, no NaN); rounded weighted CM note; one-product break-even; required price ($7.75) with its rounding step and profit check; profit goal gap |
| `accounting.test.ts`, `validation.test.ts`, `explain.test.ts`, `chartData.test.ts`, `inventory.test.ts` | The original single-product calculator, input validation and explanations (kept and still used) |
| `App.test.tsx` | Click-through workflows in a simulated browser: home buttons and demo; Show the math (opens, matches the card's figure, hides again; break-even and required price); add / duplicate / delete with confirmation; sorting; invalid input pausing results; confirmation before switching business; what-if compare / reset / apply; required price; CSV upload with mapping, problems and editing afterwards; unsupported file; saving a recipe; shared-inventory shortages; production planner; challenge success rules; PDF report generation |

**Automated test record (development environment, Vitest 3.2.7, Node 22):**
- 2 November 2026, original single-product version: 61 tests passed.
- 2 November 2026, with the Inventory & Sales Estimator: 98 tests passed.
- 2 November 2026, this upgraded version: **156 tests in 10 files passed**. `npm run build` completed without errors.
- 9 November 2026, after adding "Show the math" (Vitest 3.2.7, Node 26): **171 tests in 11 files passed**. `npm run build` completed without errors.

Re-run `npm test` yourself to confirm.

**Independent verification:** see [Independent verification](#independent-verification) below.

### Manual testing table
*To be completed by the project team while using the app. "Actual Result" and "Pass/Fail" are intentionally blank.*

| # | Test Case | Input | Expected Result | Actual Result | Pass/Fail |
|---|---|---|---|---|---|
| 1 | Demo business | Home → Try a Demo Business | Revenue $3,900; variable costs $1,425; CM $2,475; operating profit $975 | | |
| 2 | Add / duplicate / delete product | My Business table buttons | Product added; "(copy)" created with its recipe; delete asks for confirmation | | |
| 3 | Invalid input | Coffee price = `abc` | Message shown; dashboard shows "Some business numbers need attention" | | |
| 4 | Sales-mix break-even | Demo business | 455 units (182 / 91 / 61 / 121); break-even revenue $2,363.64 | | |
| 5 | Zero sales | All expected sales = 0 | Break-even "Not Available"; loss = fixed costs | | |
| 6 | What-if | Coffee shop sample, Coffee price $7 | Operating profit $1,575 → $1,875 (+$300); current plan unchanged until applied | | |
| 7 | Required price | Demo, Coffee, target $1,500 | $7.75 | | |
| 8 | Inventory upload | Fill in and upload the template | 4 rows import; columns detected | | |
| 9 | Bad rows | CSV with negative quantity and duplicate names | Rows listed with messages; duplicates flagged, not merged | | |
| 10 | Unsupported file | Upload a .pdf or .xls | Clear "Unsupported file type" message | | |
| 11 | Unit conversion | Change Coffee beans unit g → kg | 8000 g → 8 kg; cost $0.03 → $30 | | |
| 12 | Recipe | Coffee shop sample: give Sandwich a recipe | Status changes to "Complete recipe" | | |
| 13 | Costing | Demo Coffee | Materials $0.60 + $0.40 + $0.15 = $1.15 | | |
| 14 | Itemized costing | Switch Coffee to itemized | Variable cost = materials + other costs; manual cost not added | | |
| 15 | Capacity | 2,000 g / 5,000 mL / 100 cups; 20 g / 200 mL / 1 | 25 coffees, milk limiting | | |
| 16 | Shared shortage | Demo, expected demand | Milk 10 L short, butter 1.25 kg short | | |
| 17 | CM per resource | Demo, butter | Cookie $200/kg > Muffin $166.67/kg | | |
| 18 | Feasible plan | Planner → Keep my mix | "✅ Feasible"; Coffee 211 | | |
| 19 | Challenge | Beginner, price $5 | "Challenge complete!" | | |
| 20 | Challenge invalid | Expert, all products at full demand | Not feasible; no success | | |
| 21 | Surprise event | Rent increase $300 on demo | Profit $975 → $675; accept applies it | | |
| 22 | PDF report | Business Report → Download | PDF downloads with all sections, labelled CAD | | |
| 23 | Mobile | Open on a phone | All sections usable, no sideways page scrolling | | |
| 24 | Show the math – profit | Demo → Profit Dashboard → *Show the math* on Projected Operating Profit | "Operating profit = total contribution margin − fixed costs" then "$2,475 − $1,500 = $975"; same $975 as the card; button changes to *Hide the math* and hides it | | |
| 25 | Show the math – revenue | Demo → *Show the math* on Total Monthly Revenue | One line per product (Coffee $6 × 300 = $1,800 …) and $1,800 + $600 + $900 + $600 = $3,900 | | |
| 26 | Show the math – break-even | Demo → *Show the math* under the break-even figures | $1,500 ÷ ($2,475 ÷ 750) = 454.55, rounded UP to 455 units; break-even revenue $2,363.64 | | |
| 27 | Show the math – follows changes | Change Coffee price to $7 in My Business, reopen the profit math | Numbers in the explanation change with the card ($2,775 − $1,500 = $1,275) | | |
| 28 | Show the math – required price | Demo → Pricing Lab → target $1,500 → *Show the math* | $2 + ($1,500 + $1,500 − $1,275) ÷ 300 = $7.75, plus a profit check ending in $1,500 | | |
| 29 | Show the math – phone | Open several explanations on a phone | Text wraps inside the card; no sideways page scrolling | | |

### Independent verification
On 2 November 2026 a separate checking step (a second AI agent that had not seen the code) recalculated eight scenarios from first principles in exact Python fractions. It then called the app's own functions and compared the results:

| Scenario | Checked | Result |
|---|---|---|
| Required financial example (4 products, $1,500 fixed) | Totals, profit, CM ratio, weighted CM, break-even units and revenue, margin of safety | All match |
| Single product $6/$2/300, $800 | Profit $400, break-even 200, MOS $600 | Match |
| Single product $10/$6/100, $1,000 | Loss −$600, break-even 250 | Match |
| Single product $5/$7/100, $500 | Loss −$700, no finite break-even | Match |
| Required inventory example | 25 coffees, milk limiting; 15,000 mL short for 100 coffees | Match |
| Coffee + latte sharing milk | Capacities 50/33 (not additive), 2,000 mL short, $20.00 vs $16.67 per L, 25 + 16 scaled plan, $1.15 / $1.35 material cost | All match |
| Demo café inventory | Item-by-item requirements and shortages; scale 12/17; plan 211/105/70/141; profit $238.50 | All match |
| Required price and extra units | $7.75 for a $1,500 target; 132 extra coffees for $525 | Match |

**No discrepancies were found.** The checker noted that other whole-unit break-even splits are also defensible (e.g. 454 units exactly covering fixed costs). The app's 455-unit split rounds the total up and keeps the mix most closely. Following its other notes, the dashboard now states that the margin of safety uses the *theoretical* break-even revenue.

> **For the project team:** also check a few results yourselves, by hand or in Excel, and record them in the manual testing table above.

## Real user testing and feedback

> **TO BE COMPLETED BY THE PROJECT TEAM.** No real user testing has been done yet. Do not fill this in until a real person has used the app.

| Item | Details |
|---|---|
| Tester (role, not full name) | |
| Date | |
| Tasks attempted | |
| What worked well | |
| What was confusing | |
| Suggestions | |

**Improvements made after feedback:**
1. _…_

## Known limitations

- **No saving.** Data lives only in the open browser tab; refreshing resets to the sample. (This is by design: no database or accounts.)
- **Constant sales mix and linear costs.** Break-even and goal plans assume a fixed mix; costs don't change with volume (no step costs or volume discounts). Demand doesn't react to price automatically.
- **Production planning is a scenario tool, not an optimiser.** The "suggested plan" is a labelled heuristic; with several scarce items it may not be the most profitable feasible plan. No integer-programming optimiser is included.
- **Recipes:** one fixed recipe per product. There is no waste, spoilage, expiry, batch sizes or labour/time constraints (for services, staff and appointment capacity are not modelled).
- **Units:** weight (g, kg), volume (mL, L) and pieces only. There are no imperial units and no conversion between weight and volume. Quantities allow up to 3 decimals, costs up to 6 decimals and money up to 2; each value is capped at 1,000,000,000.
- **Imports:** .xlsx and .csv only (not .xls), first worksheet row as headings (optional), up to 5 MB / 2,000 rows. Formulas in Excel are read as their saved values.
- **Inventory is a snapshot**; there is no purchasing, reorder points, lead times or inventory turnover.
- **Taxes:** no income tax, GST/PST/HST, interest or financing costs. Operating profit is not net income.
- **Rounding:** itemized variable costs are rounded to the nearest cent per unit before multiplying by volume.
- **Show the math** covers the main figures only. It does not explain every table cell, the charts, the inventory figures, the challenges or the PDF report, and it gives no explanation when a break-even point does not exist (the screen already says why). With many products the revenue and variable-cost explanations become long lists.
- **PDF fonts** use standard Latin characters, so emojis and some symbols are left out of the PDF.
- **Previews:** some preview environments block file downloads (templates and PDF). They work when the app runs locally or on Vercel.

## AI-assisted development disclosure

This application was developed with substantial help from **Claude**, an AI assistant by Anthropic, which wrote the code, tests and first draft of this README from the project team's detailed requirements. The project team is responsible for:

- reviewing every formula and assumption against course material,
- checking results by hand (see the manual testing table),
- conducting and documenting real user testing and the improvements made, and
- the final submission.

The calculations were also checked by an independent recalculation step. AI-generated work can contain mistakes, so results should be verified rather than assumed correct.

## Deployment (GitHub + Vercel)

1. Put the project on GitHub (repository `price-it-right`). From a terminal:
   ```bash
   git init && git add . && git commit -m "Price It Right"
   git branch -M main
   git remote add origin https://github.com/<username>/price-it-right.git
   git push -u origin main
   ```
2. Go to <https://vercel.com>, **sign in with GitHub**, choose **Add New → Project**, import `price-it-right` and click **Deploy**. Vercel detects Vite automatically (see `vercel.json`: build `npm run build`, output `dist`).
3. Every push to `main` redeploys automatically.
