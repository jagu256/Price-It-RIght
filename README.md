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
| **💰 Profit Dashboard** | **Your Business at a Glance**: six summary cards with explanations. *Three ways to look at profit*: expected, inventory-constrained and scenario. Charts: **A** revenue vs. total costs (with the break-even point), **B** contribution by product, **C** revenue breakdown. Sales-mix break-even with a whole-unit split per product, plus an interactive single-product break-even calculator. **🌪️ Sensitivity analysis**: operating profit when selling prices, variable costs, sales volume (same mix) or fixed costs move ±10 % one at a time, as a table and a tornado chart, plus the **degree of operating leverage** (or "Not meaningful" with an explanation when there is no profit). |
| **🎯 Pricing Lab** | **What-If Pricing Simulator** comparing the current and modified plans, with Apply Changes (confirmed), Reset Scenario and Compare Results. **📉 Optional price-sensitive demand** (off by default, in the What-If simulator and the price assistant): "for every $1 change in price, sales change by X units"; shows a profit-vs-price chart and the **best price under this assumption only**, found by checking every cent, with a button to try it in the modified plan. **🧾 After-tax target profit (optional)**: enter the profit you want after income tax and your own tax rate; the app shows the required pre-tax profit, the estimated tax and after-tax profit, and feeds the pre-tax figure into the next two tools (a simplified estimate, not tax advice). **💡 What Price Should I Charge?** finds the minimum price for a target profit. **Profit Goal Tracker** shows progress, the gap, and the plan needed (same mix, your own mix, or one product). **🎲 Surprise Me!** offers five hypothetical events; you can accept, modify or reset each. |
| **📦 Smart Inventory Hub** | Upload **Excel (.xlsx) or CSV** by file picker or drag-and-drop. Includes worksheet choice, preview, column mapping you confirm, row-by-row validation, and replace or add. Downloadable template. Editable inventory table with unit conversion, purchase costs and 🟢/🟡/🔴 status. **🔗 Connect Your Products to Inventory**: recipes typed in or uploaded, with matching for unknown names. **🧾 Know Your Product Costs**: material costing, using manual or itemized cost. **📦 How Much Can You Produce?**: single-product capacity and shared-inventory check. |
| **🏆 Production Planner** | **What Should I Produce More Of?** shows CM per unit of the scarce resource, with a chart and explanation. Production Plan Simulator: adjust planned units and hypothetical extra inventory, then compare the original and modified plans. Includes a "keep my mix" constrained plan, a labelled **suggested** plan, and inventory alerts. |
| **🧭 Decisions** | **📨 Special order**: product, order quantity, offered price, extra one-time costs and any regular sales it would push out → incremental profit, plus the shared-inventory check (an order the stock can't cover is shown as **not achievable**, never as profit). **⚖️ Make or buy**: compares the supplier's price with the relevant cost to make (variable cost + avoidable fixed costs + optional opportunity cost); unavoidable fixed costs are shown crossed out as irrelevant. Both explain the decision rule and list qualitative factors. Nothing here changes the business. |
| **🎮 Business Challenge** | **Can You Save Your Business?** Beginner, Intermediate and Expert fictional scenarios with clear success conditions. Kept separate from your own data. |
| **💾 Save my work** (My Business) | Your business (name, fixed costs, products, inventory and recipes) is **saved automatically in this browser** and restored when you come back. **📤 Export my business (backup file)** downloads a `.json` backup – a Price It Right file for re-importing, not a spreadsheet (your computer may show it as a code file); **📥 Import a saved business** checks the file fully, lists any problems in plain language, and asks before replacing your current work; **🧹 Start fresh** (with confirmation) removes the saved copy and reloads the Coffee Shop example. If the browser blocks storage, the app keeps working and says **"Saving is off"**. A privacy note explains that the data stays on this device only. |
| **🧮 Show the math** (everywhere) | A small **Show the math** button on every main number: the six dashboard cards, sales-mix break-even, margin of safety, the one-product break-even calculator, the What-If modified plan, the minimum calculated price, the profit goal gap, and the Production Planner's modified plan. It shows the formula in words, then the same formula with your own numbers, e.g. *Operating profit = total contribution margin − fixed costs* → *$2,475 − $1,500 = $975*. |
| **📊 Business Report** | Preview, then **📥 Download My Business Report** as a PDF generated in the browser. It covers products, totals, a chart, break-even, inventory, shortages, production planning, any scenario comparison, and assumptions. All amounts are labelled CAD. |

## Main user workflows

1. **Explore quickly:** Home → *Try a Demo Business* → Profit Dashboard → Production Planner.
2. **Model your own business:** My Business → choose a category → edit products and fixed costs → Profit Dashboard.
3. **Test a price change:** Pricing Lab → change a price in the modified plan → compare → *Apply Changes* (or *Reset Scenario*).
4. **Set a price for a goal:** Pricing Lab → *What Price Should I Charge?* → choose a product and target.
5. **Check inventory:** Smart Inventory Hub → download the template → fill it in → upload → confirm columns → review problems → import → add recipes.
6. **Decide on a special order or make-or-buy:** Decisions → fill in the offer or the supplier's price → read the result, the inventory check and the qualitative factors.
7. **Plan production:** Production Planner → see which product uses the scarce item best → adjust the plan → check feasibility and profit.
8. **Report:** Business Report → *Download My Business Report*.

Every section shares one application state, so values stay consistent and nothing is lost when moving between sections. The business itself (not experiments) is saved on this device automatically – see *Save my work* in the features table.

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
| `saveWork.ts` | Save my work: the save-file format (with a schema version), full validation of imported files, and safe reading/writing of browser storage |
| `sensitivity.ts` | ±10 % sensitivity analysis and degree of operating leverage |
| `tax.ts` | Optional after-tax target: tax-rate validation, required pre-tax profit, estimated tax (none on a loss) |
| `demand.ts` | Optional price-sensitive demand: units at a price, profit at a price, best price and target prices by checking every cent |
| `decisions.ts` | Special-order incremental profit and inventory check; make-or-buy relevant costs |
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

### Sensitivity analysis and operating leverage
Each input moves by 10 % **on its own**; everything else stays the same. The change in operating profit follows straight from the contribution-format income statement:

| Input +10 % | Change in operating profit | Demo café (profit $975) |
|---|---|---|
| Selling prices | + 10 % × total revenue | + $390 → $1,365 |
| Variable costs | − 10 % × total variable costs | − $142.50 → $832.50 |
| Sales volume (same mix) | + 10 % × total contribution margin (revenue and variable costs both rise 10 %) | + $247.50 → $1,222.50 (+25.4 %) |
| Fixed costs | − 10 % × fixed costs | − $150 → $825 |

A 10 % decrease gives exactly the opposite change. Each change is worked in whole cents and rounded to the nearest cent once. The % column is the change ÷ the size of current operating profit (N/A when profit is $0). The tornado chart sorts the inputs by the size of the swing.

**Degree of operating leverage (DOL)** = total contribution margin ÷ operating profit. Demo café: $2,475 ÷ $975 = **2.54**, so a 1 % change in sales volume changes operating profit by about 2.54 % (check: +10 % volume → +25.4 %). When operating profit is $0 or a loss, DOL is shown as **"Not meaningful"** with the reason (division by zero, or a negative ratio that can't be read as "times as fast").

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

### After-tax target profit (simplified, not tax advice)
- **Required pre-tax operating profit** = target after-tax profit ÷ (1 − tax rate), **rounded up** to the next cent so the after-tax target is met. Hand check: $1,000 after tax at 20 % → $1,000 ÷ 0.8 = **$1,250**.
- **Estimated tax** = operating profit × tax rate, rounded to the nearest cent. **No tax on a loss** (or on $0). After-tax operating profit = operating profit − estimated tax. Demo café at 20 %: $975 − $195 = $780.
- The tax rate is typed by the user (0–100 %, up to 2 decimals); no rate is built in. At 100 % a positive target is **Not Available** (nothing is left after tax), so there is no division by zero. A target of $0 or a loss needs no gross-up.
- When switched on, *What Price Should I Charge?* and the *Profit Goal Tracker* use the pre-tax figure as their target (their target box becomes read-only and says where it came from). Demo café, Coffee, $1,000 after tax at 20 %: $2 + ($1,500 + $1,250 − $1,275) ÷ 300 = $6.9167 → **$6.92**.

### Optional price-sensitive demand
The user may switch on one assumption for one product: **"for every $1 change in price, sales change by X units (opposite direction)"**, where X is a whole number, 0 or more. It is off by default, so no other result changes.
- Units at a price = expected units − X × (price − current price), **rounded down** to whole units and never below 0.
- Operating profit at a price = (price − variable cost) × units + contribution from the other products − fixed costs.
- **Best price:** profit is worked out at **every cent** from $0.00 up to the price where sales reach zero (capped at $20,000), and the highest wins; if prices tie, the lowest is shown. There is no calculus shortcut. It is labelled **"best price under this assumption only"**. With X = 0, sales never fall, so there is no best price and the app says so.
- **Target prices** (price assistant): the lowest and highest prices, checked every cent, whose profit reaches the target. Because units are whole numbers, a few prices between them can fall just short, and the app says so.
- Hand check (the Intermediate challenge's rule, 400 − 20 × price; coffee cost $2; fixed $1,300): a **$9 price gives 220 units and a $240 profit**. The best price is $11.00 (180 units, $320). Demo café Coffee with X = 20: best $11.50 (190 units, profit $1,580).

### Decisions (relevant costs only)
**Special order**
- Incremental profit = (offered price − variable cost) × order units − extra one-time costs − (regular price − variable cost) × regular units lost. Fixed costs don't change, so they are left out. Accept if > $0 (on the numbers), reject if < $0.
- Worked by hand: 100 coffees at $4 (cost $2), $50 extra, 20 regular $6 coffees lost → $200 − $50 − $80 = **+$70**.
- **Inventory:** the order is achievable only if every inventory item that product uses can cover **regular demand of all products sharing that item, plus the order** (regular units lost are taken off first). This uses the same shared-inventory check as the Production Planner. If any of those items would be short, the app says **"Not achievable with your current inventory"**, lists the shortages and does not show the order's profit as achievable. Shortages of items the product doesn't use already exist for regular sales; they are listed separately as not caused by the order. Products without a recipe, or a business with no valid inventory, are labelled **"Inventory not checked"**.
- Coffee Shop example: +10 muffins fits (16 kg of 20 kg flour, 4.8 kg of 5 kg sugar); +20 muffins needs 5.1 kg sugar → **100 g short, not achievable**; losing 10 regular muffin sales makes it fit again.

**Make or buy**
- Relevant cost to make = variable cost per unit × units + avoidable fixed costs + opportunity cost. Cost to buy = purchase price × units. Make if the relevant cost to make is lower; buy if it is higher.
- Unavoidable fixed costs are paid either way, so they are shown crossed out in both columns as irrelevant.
- Worked by hand: 1,000 units, buy at $5, make at $3.50 + $1,000 avoidable fixed + $300 opportunity cost → make $4,800 vs buy $5,000 → **make, saving $200**. Wrongly adding $2,000 of unavoidable fixed costs would give $6,800 and the wrong answer ("buy").
- Both tools state that the result also depends on qualitative factors (quality, reliability, customer reactions, spare capacity…).

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
- **Decisions** assume the variable cost per unit stays the same for the special order or the made item, and that fixed costs not listed as avoidable don't change. A special order is checked against inventory for the items its product uses; labour time, equipment capacity and delivery dates are not modelled, which is why "losing regular sales" is entered by the user.
- **Price-sensitive demand** is an optional straight-line assumption chosen by the user; it is not estimated from data. It changes one product at a time; other products keep their expected sales. Any best price is only the best under that assumption, never a market-optimal or guaranteed price.
- **After-tax target** treats operating profit as taxable income at one flat, user-entered rate. Interest, deductions, losses carried forward, instalments and sales taxes (GST/HST/PST) are ignored. It is labelled a simplified estimate, not tax advice, and it is an experiment: it is not saved.
- **Sensitivity analysis** changes one input at a time by exactly 10 % of its current total. "Sales volume" keeps the sales mix and allows fractions of units, so it is a quick estimate; real changes often happen together (e.g. a higher price may reduce sales).
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
| `saveWork.test.ts` | Save my work: the file contains only the business plus app name, **schema version** and date; the demo café round-trips with the same verified results ($975 profit, same milk and butter shortages); fresh, non-clashing ids; typed text kept as typed (invalid stays invalid, never 0); experiments and unknown fields dropped; friendly errors for empty, non-JSON, wrong-app, too-large, newer-version and damaged files and for each broken field; long error lists shortened; storage that is missing, blocked or full never throws; damaged saved copy reported; loading clears experiments and counts as the user's own work |
| `sensitivity.test.ts` | **All five hand-checked answers**: prices +10 % → +$390 → $1,365; variable costs +10 % → −$142.50 → $832.50; volume +10 % → +$247.50 → $1,222.50 (+25.4 % = DOL × 10 %); fixed costs +10 % → −$150 → $825; DOL 2.54. Also: −10 % is the exact opposite; tornado order; explanations; half-cent rounding; a loss (DOL not meaningful); zero profit (no division by zero); no sales (no NaN); other percentages |
| `tax.test.ts` | Tax rate input (0–100, %, decimals; blank/negative/letters/over 100/too many decimals rejected, never turned into 0); **hand check $1,000 at 20 % → $1,250**; 0 % rate; rounding up ($1,000 at 30 % → $1,428.58); after-tax always reaches the target over a grid of 72 targets × rates; no tax on a loss or $0; 100 % → Not Available; demo profit $975 at 20 % → tax $195, after tax $780; tax rounding; explanations |
| `demand.test.ts` | **Hand check: the Intermediate challenge's rule (400 − 20 × price, cost $2, fixed $1,300): $9 → 220 units, $240 profit**; agrees with the challenge's own rule at every 5¢ from $3 to $12; rounding down and never below 0; best price $11 → 180 units → $320 after checking all 2,001 cents (confirmed by a separate brute-force loop); lowest/highest prices for a $200 target ($8.58 and $13.40) and why prices in between can fall short; unreachable target; X = 0 → no best price; other products' contribution ($1,275); demo Coffee best $11.50 → $1,580; $20,000 search cap; no NaN; X validation |
| `decisions.test.ts` | Special order: **+$70 worked example**, reject and indifferent cases, a below-average-cost price that still adds profit, a price below variable cost, whole cents, explanation; inventory: Coffee Shop muffin order that fits, one that is 100 g of sugar short, lost regular sales freeing stock, demo café coffee order not achievable (milk already short), no recipe / no inventory → not checked. Make or buy: **$4,800 vs $5,000 → make, saving $200**; unavoidable fixed costs never change the answer; opportunity cost flipping to buy; indifferent; explanations |
| `showMath.test.ts` | "Show the math": the demo café's explanations (profit $2,475 − $1,500 = $975, revenue, variable costs, CM, CM ratio, break-even 455 units and $2,363.64, margin of safety); **each explanation's result equals the figure the dashboard displays**; losses and negative numbers; $0 revenue (N/A, no NaN); rounded weighted CM note; one-product break-even; required price ($7.75) with its rounding step and profit check; profit goal gap |
| `accounting.test.ts`, `validation.test.ts`, `explain.test.ts`, `chartData.test.ts`, `inventory.test.ts` | The original single-product calculator, input validation and explanations (kept and still used) |
| `App.test.tsx` | Click-through workflows in a simulated browser: home buttons and demo; Decisions (special order +$15 when stock covers it, "not achievable" with "Sugar: 100 grams short" for a larger order, +$5 after giving up 10 regular sales; make-or-buy "Make it", $4,800 vs $5,000, unavoidable fixed costs marked irrelevant); price-sensitive demand (off by default; best price $11.50 / 190 units / $1,580 for demo Coffee; "Try" fills the What-If plan without changing the business; also in the price assistant; negative X rejected); after-tax target ($1,250 pre-tax, $195 tax, $780 after tax, price tool $6.92 and goal tracker −$275 using the pre-tax target, invalid rate shown and tools back on their own targets); sensitivity table, DOL 2.54 and its math, then "Not meaningful" after raising fixed costs to a loss; Save my work (auto-save and restore after "reopening" the app, storage blocked → "Saving is off", damaged saved copy, export read back, bad files rejected with friendly errors and nothing changed, import asks first, Start fresh asks first, privacy note); Show the math (opens, matches the card's figure, hides again; break-even and required price); add / duplicate / delete with confirmation; sorting; invalid input pausing results; confirmation before switching business; what-if compare / reset / apply; required price; CSV upload with mapping, problems and editing afterwards; unsupported file; saving a recipe; shared-inventory shortages; production planner; challenge success rules; PDF report generation |

**Automated test record (development environment, Vitest 3.2.7, Node 22):**
- 2 November 2026, original single-product version: 61 tests passed.
- 2 November 2026, with the Inventory & Sales Estimator: 98 tests passed.
- 2 November 2026, this upgraded version: **156 tests in 10 files passed**. `npm run build` completed without errors.
- 9 November 2026, after adding "Show the math" (Vitest 3.2.7, Node 26): **171 tests in 11 files passed**. `npm run build` completed without errors.
- 9 November 2026, after adding "Save my work": **196 tests in 12 files passed**. `npm run build` completed without errors.
- 9 November 2026, after adding sensitivity analysis + DOL: **210 tests in 13 files passed**. `npm run build` completed without errors.
- 9 November 2026, after adding the after-tax target: **223 tests in 14 files passed**. `npm run build` completed without errors.
- 9 November 2026, after adding optional price-sensitive demand: **242 tests in 15 files passed**. `npm run build` completed without errors.
- 9 November 2026, after adding Decisions (special order, make or buy): **259 tests in 16 files passed**. `npm run build` completed without errors.

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
| 30 | Auto-save | My Business → change fixed costs to 1750 → refresh the page | 1750 is still there; "Welcome back – the business you saved on this device was restored" | | |
| 31 | Untouched example not saved | *Start fresh*, then look at the Save my work card | "nothing to save yet"; refresh shows the Coffee Shop example | | |
| 32 | Experiments not saved | Change a price in the Pricing Lab What-If (don't apply) → refresh | Business restored; the What-If modified plan is back to "No changes yet" | | |
| 33 | Export | Demo → My Business → *Export my business (backup file)* | File `price-it-right-maple-leaf-cafe-demo.json` downloads; the note under the buttons says it is a backup, not a spreadsheet | | |
| 34 | Import (good file) | *Start fresh* → *Import a saved business* → choose the file from row 33 → *Replace my work* | Asks first (shows 4 products); after confirming, dashboard profit is $975 | | |
| 35 | Import cancelled | Import the same file → *Cancel* | Current business unchanged | | |
| 36 | Import (bad file) | Import a .json file that wasn't made by this app (or a text file renamed to .json) | Red box "This file was not imported – your current business is unchanged" with a plain reason; no crash | | |
| 37 | Start fresh | Change something → *Start fresh* → *Cancel*, then again → *Start fresh* | Cancel keeps the change; confirming loads the Coffee Shop example and removes the saved copy | | |
| 38 | Saving off | Open the site in a private/incognito window that blocks storage (depends on the browser) | Yellow "Saving is off" message; everything else still works | | |
| 39 | Privacy note | Read the Save my work card | Says data stays on this device only; nothing sent to a server | | |
| 40 | Sensitivity – prices | Demo → Profit Dashboard → Sensitivity analysis | Selling prices +10 %: +$390 → $1,365; −10 %: $585 | | |
| 41 | Sensitivity – variable costs | Same table | Variable costs +10 %: −$142.50 → $832.50 | | |
| 42 | Sensitivity – volume | Same table | Sales volume +10 %: +$247.50 → $1,222.50 (+25.4 %) | | |
| 43 | Sensitivity – fixed costs | Same table | Fixed costs +10 %: −$150 → $825 | | |
| 44 | DOL | Same section → *Show the math* under DOL | 2.54; "$2,475 ÷ $975 = 2.54"; check line says 25.4 % = 2.54 × 10 % | | |
| 45 | DOL not meaningful | Demo, change fixed costs to 3000 | DOL shows "Not meaningful" with the operating-loss explanation | | |
| 46 | Tornado chart | Same section, also on a phone | Prices bar longest at the top; no sideways page scrolling | | |
| 47 | After-tax target | Demo → Pricing Lab → tick *Plan with an after-tax target* → target 1000, rate 20 | Required pre-tax operating profit $1,250; *Show the math*: $1,000 ÷ (1 − 20%) = $1,250 | | |
| 48 | Tax on current profit | Same | Estimated tax $195; after-tax operating profit $780 | | |
| 49 | Feeds the tools | Same, scroll down | Price tool target shows 1250 (pre-tax), Coffee minimum price $6.92; goal tracker target 1250, difference −$275 | | |
| 50 | No tax on a loss | Target −200, rate 20 | Required pre-tax profit −$200 (no gross-up) | | |
| 51 | Invalid rate | Rate 120, then abc | Clear message; not treated as 0; tools go back to their own targets | | |
| 52 | 100 % rate | Rate 100, target 1000 | "Not Available" with an explanation | | |
| 53 | Off by default | Reload, open Pricing Lab | After-tax panel unticked; existing results unchanged | | |
| 54 | Demand off by default | Demo → Pricing Lab → What-If | Demand assumption unticked; What-If results as before | | |
| 55 | Best price | Tick "customers react to the price of Coffee", X = 20 | Best price under this assumption only: $11.50, 190 units, $1,580; "checking every cent from $0 to $21 (2,101 prices)" | | |
| 56 | Profit vs price chart | Same | Line chart with a "Now" line at $6 and a "Best" dot at $11.50 | | |
| 57 | Try it | Click *Try $11.50 (190 units) in the modified plan* | Modified price 11.50 and sales 190; modified operating profit $1,580; My Business still shows $6 until Apply Changes | | |
| 58 | Price assistant | Same assumption in *What Price Should I Charge?*, target $500 | Best price $11.50; lowest and highest prices that reach $500 | | |
| 59 | Invalid X | Type −5, then 2.5 | Clear message; no result; not treated as 0 | | |
| 60 | Challenge rule check | Business Challenge → Intermediate, price $9 | 220 customers, operating profit $240 (same rule as the unit test) | | |
| 61 | Special order – fits | Coffee Shop example → 🧭 Decisions → Muffin, 10 units at $3, extra 0 | Incremental profit +$15; "Inventory check: covered" | | |
| 62 | Special order – short | Same, 20 units | "Not achievable with your current inventory"; Sugar: 100 grams short; no profit shown as achievable | | |
| 63 | Lost regular sales | Same, tick "losing some regular sales", 10 | Fits again; +$5 | | |
| 64 | Special order – hand example | Any product with price $6 and variable cost $2 (e.g. Coffee Shop Coffee): 100 at $4, extra $50, 20 lost | +$70 *if* stock covers it (Coffee Shop beans/milk are already short, so it shows "not achievable" with that profit only "if you could get the extra inventory") | | |
| 65 | No recipe | Coffee Shop → Sandwich order | "Inventory not checked" warning | | |
| 66 | Make or buy | Units 1000, buy $5, make $3.50, avoidable $1,000, unavoidable $2,000, opportunity $300 | "Make it"; $4,800 vs $5,000; saves $200; unavoidable row crossed out as irrelevant | | |
| 67 | Make or buy flips | Same, opportunity cost $600 | "Buy it"; buying costs $100 less | | |
| 68 | Invalid input | Offered price "abc", units 0 | Clear messages; no result | | |

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

- **Saving is per browser, per device.** The business is kept in this browser's storage (no database or accounts), so it does not follow you to another device or browser unless you export and import a file. Clearing browser data, or some private windows, remove it. Only one business is saved at a time. Pricing Lab / Production Planner experiments, surprise events and challenge progress are not saved, by design.
- **Save files are not encrypted.** Anyone with the .json file can open it in a text editor. Don't put confidential data in the app.
- **Imported files are checked for structure, not for sense.** A typed value like `abc` imports exactly as typed and then shows the usual validation message (it is never turned into 0). Recipe lines that point at an inventory item missing from the file are kept and flagged, as elsewhere in the app.
- **Constant sales mix and linear costs.** Break-even and goal plans assume a fixed mix; costs don't change with volume (no step costs or volume discounts). Demand doesn't react to price unless the optional straight-line demand assumption is switched on.
- **Production planning is a scenario tool, not an optimiser.** The "suggested plan" is a labelled heuristic; with several scarce items it may not be the most profitable feasible plan. No integer-programming optimiser is included.
- **Recipes:** one fixed recipe per product. There is no waste, spoilage, expiry, batch sizes or labour/time constraints (for services, staff and appointment capacity are not modelled).
- **Units:** weight (g, kg), volume (mL, L) and pieces only. There are no imperial units and no conversion between weight and volume. Quantities allow up to 3 decimals, costs up to 6 decimals and money up to 2; each value is capped at 1,000,000,000.
- **Imports:** .xlsx and .csv only (not .xls), first worksheet row as headings (optional), up to 5 MB / 2,000 rows. Formulas in Excel are read as their saved values.
- **Inventory is a snapshot**; there is no purchasing, reorder points, lead times or inventory turnover.
- **Taxes:** only the optional after-tax target estimates income tax, at one flat user-entered rate on operating profit. There is no GST/PST/HST, interest, deductions, loss carry-forward or financing costs anywhere. Operating profit is not net income.
- **Rounding:** itemized variable costs are rounded to the nearest cent per unit before multiplying by volume.
- **Sensitivity analysis** is fixed at ±10 % and moves one input at a time; it does not model inputs changing together, step costs, or demand reacting to price. DOL only describes small changes around the current sales level.
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
