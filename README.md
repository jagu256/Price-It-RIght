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
10. [Language: English / Français](#language-english--français)
11. [Installation](#installation)
12. [Testing](#testing)
13. [Known limitations](#known-limitations)
14. [AI-assisted development disclosure](#ai-assisted-development-disclosure)
15. [Deployment](#deployment-github--vercel)

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
| **Home** | Name, tagline and description. **🚀 Start My Business** and **✨ Try a Demo Business** (a complete fictional café). Four-step guide. **📚 Understand Your Numbers** explains ten concepts. **✅ Your setup checklist**: name, fixed costs, valid products, inventory (optional) and recipes (optional). It ticks itself off from the same validated numbers the rest of the app uses, shows "x of 5 done" with a progress bar, and links to whatever is missing. |
| **🏠 My Business** | Choose ☕ Coffee Shop, 🧁 Bakery, 💅 Nail Salon, 👕 Clothing Store or ✨ Custom (fictional samples). The app asks for confirmation before replacing your work. Enter the business name and monthly fixed costs once. **🛒 My Product Collection** is an editable table: add, edit, duplicate or delete (with confirmation), optional category, sorting, and per-product revenue, variable costs, CM per unit, total CM and CM ratio. **📈 Live profit bar**: a small bar stays at the bottom of the screen while you edit, showing revenue, contribution margin and operating profit (or loss) as you type, with a link to the dashboard. When a value is invalid it says how many fields to fix, instead of showing a number. Its figures come from the same summary as the dashboard. **🏅 How each product compares**: badges under the product table. ⭐ Star (high margin and volume), 🐴 Popular (high volume, lower margin), 💎 Hidden gem (high margin, lower volume), ⚠️ Review (both low) or ❗ Loss on each sale, each with a one-line tip. |
| **💰 Profit Dashboard** | **Your Business at a Glance**: six summary cards with explanations. *Three ways to look at profit*: expected, inventory-constrained and scenario. Charts: **A** revenue vs. total costs (with the break-even point), **B** contribution by product, **C** revenue breakdown. Sales-mix break-even with a whole-unit split per product, plus an interactive single-product break-even calculator. **🌪️ Sensitivity analysis**: operating profit when selling prices, variable costs, sales volume (same mix) or fixed costs move ±10 % one at a time, as a table and a tornado chart, plus the **degree of operating leverage** (or "Not meaningful" with an explanation when there is no profit). **📅 12-month projection**: a sales level (100 % = expected sales) and fixed costs for each month → monthly revenue, contribution margin and operating profit, the annual totals, the best and worst month and the months below break-even, as a chart and a table. **📋 Budget vs actual**: type in a month's actual units, prices, variable costs and fixed costs; the app explains the difference from the budget as sales volume (split into quantity and mix), selling price, variable cost and fixed cost variances, each marked F (favourable) or U (unfavourable), adding up exactly to the actual profit. **🪜 Step fixed costs (relevant range)**: add up to 3 steps such as "above 600 units, fixed costs rise $500". The app shows the fixed costs and break-even in each range (there can be more than one break-even point), operating profit at expected sales, and a profit-vs-units chart with the drop at each step. **💵 3-month cash budget**: cash at the start, the % of sales paid in the same month (the rest the next month), and per month a sales level, extra stock bought and other cash payments. It shows cash from sales, cash paid out, net cash flow and cash at month end beside operating profit, and warns about any month that runs below $0. **🎬 Presentation mode** (button at the top): six full-screen slides for a demo or projector, made from the same numbers. They are title, each month (revenue, CM, operating profit), contribution by product, break-even and margin of safety, inventory, and "keep in mind" assumptions. Move with ← → or the buttons; Esc exits. |
| **🎯 Pricing Lab** | **What-If Pricing Simulator** comparing the current and modified plans, with Apply Changes (confirmed), Reset Scenario and Compare Results. **📉 Optional price-sensitive demand** (off by default, in the What-If simulator and the price assistant): "for every $1 change in price, sales change by X units"; shows a profit-vs-price chart and the **best price under this assumption only**, found by checking every cent, with a button to try it in the modified plan. **🧾 After-tax target profit (optional)**: enter the profit you want after income tax and your own tax rate; the app shows the required pre-tax profit, the estimated tax and after-tax profit, and feeds the pre-tax figure into the next two tools (a simplified estimate, not tax advice). **💡 What Price Should I Charge?** finds the minimum price for a target profit. **Profit Goal Tracker** shows progress, the gap, and the plan needed (same mix, your own mix, or one product). **🎲 Surprise Me!** offers five hypothetical events; you can accept, modify or reset each. **🏷️ Cost-plus pricing helper**: pick a product and a markup on cost or a target margin on price; it shows the price (rounded up to the cent), CM per unit, the actual markup and margin, the equivalent of the other measure, and operating profit at that price if expected units stay the same, with a button to try the price in the What-If simulator. **📸 Save and compare scenarios**: save the What-If plan under a name (up to 6), then compare them side by side with the current plan (revenue, costs, CM, operating profit, change, break-even). The one with the most profit is marked "highest profit of these", and you can load a scenario back into the simulator or delete it (with confirmation). Saved scenarios last while the app is open and never change the business. **🔁 Price change: how many must I sell?**: choose a product and a new price to see how many units keep the same profit (more after a cut, fewer after a rise), with a button to try it in the What-If simulator. **🎯 Target costing**: enter the market price and target margin to get the most one unit may cost (rounded down), and how much today's variable cost must fall to reach it. |
| **📦 Smart Inventory Hub** | Upload **Excel (.xlsx) or CSV** by file picker or drag-and-drop. Includes worksheet choice, preview, column mapping you confirm, row-by-row validation, and replace or add. Downloadable template. Editable inventory table with unit conversion, purchase costs and 🟢/🟡/🔴 status. **🔗 Connect Your Products to Inventory**: recipes typed in or uploaded, with matching for unknown names. **🧾 Know Your Product Costs**: material costing, using manual or itemized cost. **📦 How Much Can You Produce?**: single-product capacity and shared-inventory check. **🛒 What should I buy?**: a shopping list that tops your stock up to what expected sales need, with an optional safety buffer % and pack sizes (rounded up to whole packs) and the estimated purchase cost. Missing costs are shown as unknown, never $0. Buying stock is explained as a cash payment, not an expense. |
| **🏆 Production Planner** | **What Should I Produce More Of?** shows CM per unit of the scarce resource, with a chart and explanation. Production Plan Simulator: adjust planned units and hypothetical extra inventory, then compare the original and modified plans. Includes a "keep my mix" constrained plan, a labelled **suggested** plan (a rule of thumb, not proven optimal), **🧮 Best mix (exact search)** – a branch-and-bound search labelled **"proven optimal"** only when it has checked every possibility (otherwise "suggested – not proven optimal") – and inventory alerts. |
| **🧭 Decisions** | **📨 Special order**: product, order quantity, offered price, extra one-time costs and any regular sales it would push out → incremental profit, plus the shared-inventory check (an order the stock can't cover is shown as **not achievable**, never as profit). **⚖️ Make or buy**: compares the supplier's price with the relevant cost to make (variable cost + avoidable fixed costs + optional opportunity cost); unavoidable fixed costs are shown crossed out as irrelevant. Both explain the decision rule and list qualitative factors. Nothing here changes the business. **✂️ Drop a product?**: pick a product and enter the fixed costs that would really stop, any contribution lost on other products, and any contribution gained from the freed capacity. The app shows keep or drop, the change in operating profit, the decision rule and qualitative factors. |
| **🎮 Business Challenge** | **Can You Save Your Business?** Beginner, Intermediate and Expert fictional scenarios with clear success conditions. Kept separate from your own data. |
| **💾 Save my work** (My Business) | Your business (name, fixed costs, products, inventory and recipes) is **saved automatically in this browser** and restored when you come back. **📤 Export my business (backup file)** downloads a `.json` backup – a Price It Right file for re-importing, not a spreadsheet (your computer may show it as a code file); **📥 Import a saved business** checks the file fully, lists any problems in plain language, and asks before replacing your current work; **🧹 Start fresh** (with confirmation) removes the saved copy and reloads the Coffee Shop example. If the browser blocks storage, the app keeps working and says **"Saving is off"**. A privacy note explains that the data stays on this device only. |
| **🧮 Show the math** (everywhere) | A small **Show the math** button on every main number: the six dashboard cards, sales-mix break-even, margin of safety, the one-product break-even calculator, the What-If modified plan, the minimum calculated price, the profit goal gap, and the Production Planner's modified plan. It shows the formula in words, then the same formula with your own numbers, e.g. *Operating profit = total contribution margin − fixed costs* → *$2,475 − $1,500 = $975*. |
| **🧭 Guided tour** | On a first visit, a small card walks through the 8 sections in about a minute. Each step opens its section and highlights its tab with a gold outline. **Back / Next / Skip tour**, or Esc to close. It is remembered in this browser (if storage is blocked it simply shows again), and **🧭 Take the tour** on Home restarts it. Keyboard focus moves to the card, and the highlight respects "reduce motion". |
| **ⓘ Term tooltips** (everywhere) | A small **i** button next to accounting terms gives a one-line plain-language definition. It appears on the six dashboard cards, break-even, margin of safety, sensitivity, operating leverage, relevant range, budget vs actual, cost-plus, the shopping list, special order, make or buy, CM per scarce resource and the after-tax target. Tap or click to open; tap again, press Esc, click elsewhere or scroll to close. It works with touch and keyboard and is translated into French. The definitions live in one file, `src/lib/glossary.ts`. |
| **↩ Undo** (everywhere) | After a big change, a message at the top right says what happened and offers **↩ Undo**: deleting a product or inventory item, clearing or importing inventory, importing recipes, **Apply Changes**, applying a surprise event, or loading another or saved business. Undo restores the business exactly as it was. The message closes after 15 seconds or with ✕. Any other change to the business removes the chance to undo, so a later edit is never thrown away. The confirmations before deleting or replacing are still asked first. |
| **🔠 Larger text / ◐ high contrast** (header) | Two buttons next to EN/FR. **A+** makes all text 12.5 % larger. **◐** switches to high contrast: darker text and borders, a white background and stronger focus outlines, which also helps on a projector. Each is a toggle (`aria-pressed`), remembered in this browser (try/catch), and applied before the page first appears. |
| **🖨 Print-friendly pages** (footer) | **Print this page** (or Ctrl/Cmd + P) prints the current section on white paper. Menus, buttons and pop-ups are hidden, cards are kept together, typed values print as plain text, and a heading appears on paper only (business name, section, date, "All amounts in CAD", fictional data). |
| **📱 Phone tab bar** | On phones, the sideways-scrolling tabs at the top are replaced by a bar at the bottom within thumb reach: Home, Business, Profit, Pricing and **☰ More** (the other five sections). The current section is highlighted, "More" is highlighted when you are in one of its sections, and the guided tour highlights the right tab. Desktop and tablet keep the top tabs. |
| **🌙 Dark mode** (header) | A third display button next to A+ and ◐: sage green on charcoal for cards, text, inputs, tables and chart labels, remembered like the other options. It combines with high contrast (white text), and printing automatically uses the light colours. Every screen was checked for readable text in both themes. |
| **✨ What changed?** | After Apply, a delete, an import or any other undoable change, the Undo message also shows **"Operating profit: before → after"**. After Undo, a short note confirms "Undone – operating profit is back to …". On the dashboard, any card whose number changed glows briefly (a static outline if "reduce motion" is on). |
| **📊 Business Report** | Preview, then **📥 Download My Business Report** as a PDF generated in the browser. It covers products, totals, a chart, break-even, inventory, shortages, production planning, any scenario comparison, and assumptions. All amounts are labelled CAD. **📊 Download my business as Excel** gives an .xlsx file with five sheets of real number cells. |
| **🇫🇷 EN / FR** (header) | Switches the whole app – screens, messages, Show the math, the PDF report and the Excel file – between English and **French (Canada)**. Amounts use fr-CA formats (`1 800 $`, `63,5 %`, `6,50 $`) and a French decimal comma can be typed (`6,50`). The choice is remembered in this browser. |

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
| `excelExport.ts` | "Download my business as Excel": five sheets of NUMBER cells with CAD / % / unit formats |
| `projection.ts` | 12-month projection with seasonal sales levels and monthly fixed costs |
| `optimizer.ts` | Exact product-mix optimizer (branch and bound): most contribution margin within all inventory and expected demand, whole units |
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

### 12-month projection (seasonality)
- Each month has a **sales level** (0–1,000 %, default 100 %) and its own **fixed costs** (default: the business's monthly fixed costs).
- Units in a month = expected units × sales level, **rounded down** to whole units, keeping the sales mix. Revenue, variable costs, contribution margin and operating profit are then worked out as usual (whole cents).
- **Annual totals = the sum of the 12 months** (added in whole cents), and annual operating profit = annual CM − annual fixed costs.
- **Best / worst month** = highest / lowest operating profit (the earlier month if tied). A month is **below break-even** when its operating profit is below $0.
- Example (demo café): every month at 100 % → 12 × $975 = **$11,700**. With January at 60 % (revenue $2,340, CM $1,485 → **−$15**, below break-even) and July at 130 % (CM $3,217.50 → $1,717.50), the year is $11,452.50. Monthly fixed costs matter too: December at 150 % with $2,000 of fixed costs earns $1,712.50, slightly *less* than a 130 % July with $1,500.
- The monthly settings are an experiment on the dashboard; they are not saved and never change the business.

### Exact product-mix optimizer ("Best mix")
- **Goal:** maximise total contribution margin. **Constraints:** for every inventory item, Σ (units × quantity per unit) ≤ available; 0 ≤ units ≤ expected demand; whole units. Fixed costs are the same for every plan, so the most contribution margin is also the most operating profit.
- **Method: branch and bound.** The search tries every quantity of each product in turn. It skips a group of plans only when an **upper bound** proves the group can't beat the best plan already found. The bound gives each remaining product the most it could make *on its own* from the stock left; no real plan can do better, so nothing better is ever skipped. If the search finishes, the plan is **proven optimal**. If it reaches 2,000,000 steps first, the best plan so far is shown as **"suggested – not proven optimal"**.
- Products with a contribution margin of $0 or less are set to 0 (making them can never add contribution). Products without a recipe can't be checked against stock, so they are left at expected demand and named.
- **Why we trust it:** the tests compare it with a separately written brute-force search that tries every plan. That covers 300 random problems, the Expert challenge bakery (3.7 million plans) and the demo café, and the answers match every time.

### Budget vs actual (flexible-budget variances)
- **Static budget profit** = the business as entered. **Flexible budget profit** = actual units at budget prices and costs.
- Sales volume variance = (actual units − budget units) × budget CM per unit, per product. It splits into:
  - **sales quantity variance** = (actual total units − budget total units) × budget weighted-average CM per unit, rounded to the nearest cent;
  - **sales mix variance** = volume variance − quantity variance. Because it is calculated as the remainder, the two always add up exactly.
- Selling price variance = (actual price − budget price) × actual units. Variable cost variance = (budget − actual variable cost per unit) × actual units. Fixed cost variance = budget − actual fixed costs.
- **Actual profit = static budget profit + all variances**, exactly, in whole cents. Positive = **F** (raised profit), negative = **U**.
- Hand-worked example (demo café): the actuals are 320 coffees at a $2.10 variable cost, 140 muffins, 90 sandwiches at $9.50, 200 cookies and $1,550 of fixed costs. Volume is +$5 F (+$80 coffee, −$25 muffin, −$50 sandwich). The same 750 units were sold in total, so that +$5 is all mix (coffee's $4 CM is above the $3.30 average) and the quantity variance is $0. Price is +$45 F, variable cost −$32 U and fixed costs −$50 U. **$975 + 5 + 45 − 32 − 50 = $943**, which matches the actual profit worked out directly.
- If the budget has no units there is no budget mix, so quantity and mix show N/A. The actual figures are an experiment on the dashboard; they are not saved.

### What should I buy? (purchase plan)
- Target = required for expected sales (all products sharing the item) × (1 + safety buffer), **rounded up** to a thousandth of a g/mL/piece. To buy = target − available, never below 0.
- With a pack size, packs = to buy ÷ pack size, **rounded up**; the quantity bought is then whole packs.
- Purchase cost = quantity bought × purchase cost per unit, in whole cents (nearest cent; the cost is held as millionths of a dollar so up-to-6-decimal costs stay exact). A missing purchase cost is **unknown** and is left out of the total, with a warning.
- Worked example (demo café, no buffer): milk 60 L needed − 50 L = **10 L × $2 = $20**; butter 4.25 kg − 3 kg = **1.25 kg × $9 = $11.25**; total **$31.25**. With a 10 % buffer: milk 16 L ($32), flour 0.3 kg ($1.20), butter 1.675 kg ($15.075 → $15.08), cheese 0.3 kg ($3.60) → **$51.88**. 10 L of milk in 4 L jugs = 3 jugs = 12 L ($24).
- Buying inventory is a cash payment, not an expense; its cost reaches operating profit through variable cost when products are sold.

### Cost-plus pricing (markup vs margin)
- **Markup on cost:** price = variable cost × (1 + markup %). **Margin on price:** price = variable cost ÷ (1 − margin %); a margin must be below 100 %.
- Markup → margin = markup ÷ (1 + markup); margin → markup = margin ÷ (1 − margin). E.g. **$2 + 50 % markup = $3.00 (a 33.3 % margin)**; **$2 at a 50 % margin = $4.00 (a 100 % markup)**; muffin $1.50 at 60 % margin = $3.75.
- The price is **rounded up** to the next cent so the requested rate is always reached ($2.10 + 33 % = $2.793 → $2.80; $2 at 70 % = $6.666… → $6.67, an actual 70.01 % margin). The actual markup and margin are shown.
- The cost is the **variable** cost per unit, so the margin is the contribution margin ratio. Fixed costs still have to be covered by total contribution margin. The profit shown at the new price uses the usual business calculation and assumes expected units don't change (customers may react to price). It is a starting point, not a guaranteed or market price.

### Saved scenarios
- A saved scenario stores only the **changes the user typed** in the What-If simulator. It is recalculated from the current business with the same `resolveScenario` + `businessSummary` code as the simulator, so its figures always match.
- "Highest profit of these" = the most operating profit **among the saved scenarios** (ties are all marked). It is not a claim that it is the best possible plan.
- Example (demo café): Coffee $7 → +$1 × 300 = **+$300 → $1,275**; fixed costs $1,300 → **$1,175**; muffins 200 → +50 × $2.50 = **$1,100**.
- A saved value that is no longer valid shows "—" (never 0). Scenarios are not written to the device or the backup file (the save file contains only the business).

### Step fixed costs (relevant range)
- Fixed costs are fixed only within a **relevant range**. A step adds fixed costs when total units are **above** its level. Steps are sorted and added up, so each range has its own fixed costs.
- Units keep the expected mix, so each earns the weighted-average CM ($2,475 ÷ 750 = **$3.30** for the demo café). Break-even in a range = that range's fixed costs ÷ weighted CM, **rounded up**. It counts only if it falls inside the range; if it would fall below the range, the range's first unit is already profitable.
- Example: +$500 above 600 units. Range 0–600 ($1,500): **455 units**. Range 601+ ($2,000): 2,000 ÷ 3.30 = 606.1 → **607 units**. At 601 units profit is 601 × 3.30 − 2,000 = **−$16.70**, so profit falls back below zero just after the step. At the expected 750 units profit is $2,475 − $2,000 = **$475** (instead of $975). With +$1,000 above 400 units there is no break-even in 0–400, and the upper range needs **758 units**, so the expected 750 make a **$25 loss**.
- Calculated in whole cents with BigInt. With no sales or no positive CM it shows Not available. Steps are an experiment and are not saved.

### Drop a product (relevant costs)
- Change in operating profit if dropped = **fixed costs really saved + contribution from the freed capacity − the product's total contribution margin − contribution lost on other products**. Drop only if this is positive. Shared fixed costs (rent…) are not saved, so they are left out.
- Example (demo café Sandwich, CM $5 × 100 = **$500**): saving $300 → **−$200**, profit $775, so keep. Saving $600 → **+$100**, profit $1,075, so drop. But if sandwich buyers also stop buying $150 of coffee contribution → **−$50**, keep. A product with a negative CM (e.g. −$0.50 × 40 = −$20) raises profit by $20 if dropped, even with no savings. Whole cents.

### Price change: units for the same profit
- Fixed costs don't change with price, so profit stays the same when the product's **total contribution margin** stays the same. Units needed = current total CM ÷ new CM per unit, **rounded up** (so profit is never lower). Variable cost per unit is assumed unchanged.
- Example (demo Coffee, CM $4 × 300 = **$1,200**): $5 → CM $3 → **400 units (+100, +33.3 %)**; $7 → CM $5 → **240 units (60 fewer, −20 %)**; $5.50 → 1,200 ÷ 3.50 = 342.86 → **343** (earns $0.50 more). At or below the variable cost ($2) no volume can make up the contribution → *Not possible*. It doesn't say whether customers will actually buy that many.

### 3-month cash budget (profit ≠ cash)
- Monthly sales = expected units × sales level (rounded down, same mix). **Cash from sales** = this month's sales × % paid now (nearest cent) + last month's unpaid sales (month 1: the amount still to collect at the start).
- **Cash paid out** = variable costs + fixed costs + extra stock bought + other cash payments. Closing cash = opening + in − out. Operating profit is shown beside it.
- Example (demo café, $500 at the start): if everything is paid at once, +$975 a month → $1,475 / $2,450 / $3,425. If only **60 %** is paid in the same month, month 1 collects $2,340 → **−$585 → −$85 cash** although profit is $975, then $890 and $1,865, with $1,560 still owed after month 3. Buying $500 of stock and repaying $200 of a loan in month 1 takes cash to $775 but leaves profit at $975.
- Not included: taxes, GST/HST, owner withdrawals and supplier credit (costs are paid in the month). Opening cash can't be negative. The inputs are an experiment and are not saved.

### Target costing
- Target cost = market price × (1 − target margin %), **rounded down** to the cent, so the margin is always at least the one asked for. It is the reverse of cost-plus.
- Example: Coffee at $6 with a 70 % margin → **$1.80**, so today's $2 cost must fall by **$0.20 (10 %)**. $4.99 at 60 % → $1.996 → **$1.99** (actual margin 60.12 %). A $0 price gives N/A, not NaN.

### Product ranking badges
- **High margin** = CM per unit ≥ the weighted-average CM per unit (total CM ÷ total units). **High volume** = expected units ≥ the average per product (total units ÷ number of products). Compared as whole-cent integers (no rounding; exactly average counts as high). A price below variable cost → ❗ loss on each sale.
- Demo café (average CM $3.30, average volume 187.5): **Coffee ⭐ star** ($4, 300), **Muffin ⚠️ review** ($2.50, 150), **Sandwich 💎 hidden gem** ($5, 100), **Cookie 🐴 popular** ($2, 200). A quick guide only: it ignores shared inventory and demand.

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
- **12-month projection** keeps prices and variable costs the same all year and has no opening/closing inventory, cash timing or year-end adjustments. Its monthly settings are not saved.
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

## Language: English / Français

- **One dictionary.** Every piece of on-screen text is written in English in the code and wrapped in `t('…')`. The French for each one lives in a single file, `src/i18n/fr.ts` (English → French). `src/i18n/i18n.ts` holds the small translator (`t`, `plural`, the current language and fr-CA number locale).
- **Nothing can be forgotten silently.** `dictionary.test.ts` scans the source for every `t('…')` text and fails if one has no French, if a French entry is empty, or if its `{placeholders}` don't match the English. `App.fr.test.tsx` also opens every screen in French and fails if any text was asked for that the dictionary doesn't have.
- **Same numbers in both languages.** Only words and formats change. All calculations stay in whole cents; tests check the French report and Excel file against the English figures (demo café: `3 900 $`, `975 $`, break-even 455 units / `2 363,64 $`, DOL `2,54`).
- **Formats:** fr-CA puts the dollar sign after the amount with a space (`1 800 $`), uses a decimal comma (`6,50 $`, `63,5 %`) and writes dates as `9 novembre 2026`. Inputs accept `6,50` or `6.50` in French; in English a comma is still read as a thousands separator, as before.
- **What is not translated:** the user's own data (business, product and item names) is kept exactly as typed. The fictional sample businesses are translated when they are loaded. Imports recognise French column headings and units (e.g. `Nom de l’article`, `grammes`, `unités`).
- **Remembered choice:** saved in this browser's storage under `price-it-right:language` (wrapped in try/catch; if storage is blocked the app simply starts in English).
- **Accounting terms used:** contribution margin = *marge sur coûts variables (MCV)*; operating profit = *bénéfice d’exploitation*; break-even = *seuil de rentabilité*; margin of safety = *marge de sécurité*; fixed / variable costs = *coûts fixes / variables*; relevant cost = *coût pertinent*; opportunity cost = *coût de renonciation*; revenue = *chiffre d’affaires*.

**Translations to review (the AI was not sure; please have a French-speaking team member check):**

| English | French used | Why it's uncertain |
|---|---|---|
| Degree of operating leverage | Coefficient de levier d’exploitation | *Levier d’exploitation* alone is also common in Québec textbooks |
| Spreadsheet | chiffrier | Québec usage; France says *tableur* |
| N/A | S.O. (sans objet) | Correct in Québec, but *N.D.* (non disponible) may fit some places better |
| Pricing Lab / Smart Inventory Hub | Labo des prix / Centre des stocks | Feature names – a free choice |
| Hoodie | Kangourou | Québec word; *chandail à capuchon* is also used |
| Cotton pads | Tampons d’ouate | Québec usage |
| Food (category) / Tops | Repas / Hauts | Category names in the fictional samples |
| {name}s to bake (challenge) | {name} : quantité à cuire | Reworded to avoid English-style plurals |

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
| `excelExport.test.ts` | Five sheets; money/units/% stored as numbers with CAD (`[$$-1009]#,##0.00`) and `0.0%` formats; fictional/CAD labels; invalid business → nothing exported; **file read back**: $3,900 / $1,425 / $2,475 / $975, break-even 455 (182/91/61/121), milk 10 L and butter 1.25 kg short, keep-my-mix plan 211/105/70/141 and $238.50 |
| `projection.test.ts` | 12 normal months = 12 × $975 = $11,700 (and $46,800 revenue); seasonal example (January −$15 below break-even, December $1,712.50, July best at $1,717.50, worst January with the tie rule); **annual totals equal the sum of the months** for every figure, and over 200 random seasonal patterns with no rounding drift or NaN; rounding units down; a zero-sales month loses its fixed costs; sales-level validation; exactly 12 months |
| `optimizer.test.ts` | **Agrees with an independent brute-force search** (written separately; tries every whole-unit plan) on 300 random problems, on the Expert challenge bakery (all 151 × 121 × 201 plans) and on the demo café; plans always fit inventory and demand; beats or equals the heuristic; a search stopped by its limit is labelled not proven but still fits; no-recipe products left at demand and reported; $0-margin products set to 0; no stock → 0 |
| `showMath.test.ts` | "Show the math": the demo café's explanations (profit $2,475 − $1,500 = $975, revenue, variable costs, CM, CM ratio, break-even 455 units and $2,363.64, margin of safety); **each explanation's result equals the figure the dashboard displays**; losses and negative numbers; $0 revenue (N/A, no NaN); rounded weighted CM note; one-product break-even; required price ($7.75) with its rounding step and profit check; profit goal gap |
| `accounting.test.ts`, `validation.test.ts`, `explain.test.ts`, `chartData.test.ts`, `inventory.test.ts` | The original single-product calculator, input validation and explanations (kept and still used) |
| `dictionary.test.ts` | Every `t('…')` text in the source has French; none empty; placeholders match |
| `frenchOutputs.test.ts` | The report in French (`9 novembre 2026`, `3 900 $` … `975 $`, `63,5 %`, `455 unités`, `2 363,64 $`) with the same figures as English; PDF text keeps accents and swaps narrow spaces and `œ`; Excel sheet names in French (≤ 31 characters) with the same number cells; after-tax target `1 250 $`; decimal comma in a tax rate |
| `App.fr.test.tsx` | The app in French: dashboard (`3 900 $`, `2 475 $`, `975 $`, `63,5 %`) and its Show the math (`2 475 $ − 1 500 $ = 975 $`); sensitivity `1 365 $` and DOL `2,54`; decimal comma accepted and invalid input kept as typed; switching back to English and remembering the choice; report preview; Best mix and Decisions in French; **every screen opened with no missing translation** |
| `variance.test.ts` | **Hand-worked month: $975 → $943** with volume +$5 (all mix, quantity $0), price +$45, variable cost −$32, fixed −$50, and the variances adding up exactly; no change → all $0; +10 % same mix → all quantity ($247.50), no mix; quantity rounding to the cent with quantity + mix = volume; budget with no units → N/A, not NaN; whole cents and very large numbers; F/U labels |
| `purchasing.test.ts` | **Demo shopping list by hand: $20 + $11.25 = $31.25**; 10 % buffer → $51.88 with the half-cent rounded up; pack sizes rounding up (5 × 2 L, 3 × 4 L = $24); unknown cost stays unknown, not $0; nothing short → empty list; cent rounding; buffer validation (blank, negative, letters, decimals, over 100 % rejected) |
| `costPlus.test.ts` | **$2 + 50 % = $3.00 (33.3 % margin); $2 at 50 % margin = $4.00 (100 % markup); $1.50 at 60 % = $3.75**; rounding up ($2.80, $6.67 at 70.01 %); no rounding when already whole cents; a grid of costs × rates always reaches the rate and is under 1 cent above exact; $0 cost → N/A, no NaN; rate validation (100 % margin and over 1,000 % markup rejected) |
| `scenarios.test.ts` | Saved scenarios: **Coffee $7 → $1,275 (+$300), rent $1,300 → $1,175, 200 muffins → $1,100**; the highest marked, ties all marked; an invalid saved value shows no figures and isn't marked; loading copies the scenario (later edits don't change the saved one) and leaves the business unchanged |
| `stepCosts.test.ts` | **No steps → 455 units, $975 (matches the dashboard); +$500 above 600 → break-even 455 and 607, −$16.70 at 601, $475 expected; +$1,000 above 400 → none then 758, −$25**; steps sorted and summed; break-even below a range starts at its first unit; no sales / no CM → N/A; $0 fixed → 0 units; chart shows both sides of a step |
| `tour.test.ts` | Every tour step points to a real section; "tour done" is remembered; blocked or missing storage never throws |
| `glossary.test.ts` | Every glossary entry has a term and a definition, and no term is listed twice |
| `undo.test.ts` | Deleting a product, applying the What-If plan, deleting/clearing stock and loading another business can all be undone exactly (baseline too); a later edit clears the undo; experiments don't; dismissing removes it; small edits aren't undo points; one step back at a time |
| `setupChecklist.test.ts` | Demo café 5 of 5; Coffee Shop example 4 of 5 (Sandwich has no recipe); blank name, invalid fixed costs or an invalid product are never ticked; no products/inventory → not done; inventory and recipes marked optional |
| `display.test.ts` | Display settings start normal and are remembered; damaged or odd saved values and blocked storage fall back to normal without errors; the page attributes are set and removed |
| `decisions.test.ts` (drop) | Drop a product: **Sandwich $500 CM; $300 saved → −$200 (keep, $775); $600 → +$100 (drop, $1,075); −$150 other sales → −$50 (keep)**; freed capacity making it indifferent; negative-CM product; whole cents |
| `volumeForPrice.test.ts` | **Coffee $1,200 CM: $5 → 400 (+100, +33.3 %); $7 → 240 (−60, −20 %); $5.50 → 343 (rounded up, +$0.50)**; no change; price ≤ variable cost → not possible (no division by zero); no current contribution → 0 units; 0 current units → % N/A |
| `cashBudget.test.ts` | **Demo: all paid now → $1,475 / $2,450 / $3,425; 60 % paid now → −$85 shortfall in month 1, $890, $1,865, $1,560 still owed**; extra stock and loan repayment use cash but not profit; opening receivables collected; a 60 % month; cent rounding adds up; % input validation |
| `costPlus.test.ts` (target) | Target costing: **$6 at 70 % → $1.80, cut $0.20 (10 %)**; $4.99 at 60 % → $1.99 (rounded down, ≥ 60 %); 0 % margin → cost = price; $0 → N/A; exact reverse of cost-plus |
| `productRanking.test.ts` | **Demo: Coffee star, Muffin review, Sandwich gem, Cookie popular**; exactly-average counts as high (no rounding); price below variable cost → loss-maker; no products or no sales → no ranking |
| `changeSummary.test.ts` | What changed: deleting the Muffin → $975 → $600; Coffee at $7 applied → $975 → $1,275; invalid numbers → null (never 0) |
| `App.test.tsx` | Click-through workflows in a simulated browser: home buttons and demo; Best mix (proven-optimal label, feasible, at least as much profit as "keep my mix" and the suggested plan; the heuristic keeps its "not proven optimal" label); 12-month projection ($11,700 default, January −$15 "below break-even", best July / worst January, year $11,452.50, invalid level pauses results); Decisions (special order +$15 when stock covers it, "not achievable" with "Sugar: 100 grams short" for a larger order, +$5 after giving up 10 regular sales; make-or-buy "Make it", $4,800 vs $5,000, unavoidable fixed costs marked irrelevant); price-sensitive demand (off by default; best price $11.50 / 190 units / $1,580 for demo Coffee; "Try" fills the What-If plan without changing the business; also in the price assistant; negative X rejected); after-tax target ($1,250 pre-tax, $195 tax, $780 after tax, price tool $6.92 and goal tracker −$275 using the pre-tax target, invalid rate shown and tools back on their own targets); sensitivity table, DOL 2.54 and its math, then "Not meaningful" after raising fixed costs to a loss; Save my work (auto-save and restore after "reopening" the app, storage blocked → "Saving is off", damaged saved copy, export read back, bad files rejected with friendly errors and nothing changed, import asks first, Start fresh asks first, privacy note); Show the math (opens, matches the card's figure, hides again; break-even and required price); add / duplicate / delete with confirmation; sorting; invalid input pausing results; confirmation before switching business; what-if compare / reset / apply; required price; CSV upload with mapping, problems and editing afterwards; unsupported file; saving a recipe; shared-inventory shortages; production planner; challenge success rules; PDF report generation |

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
- 9 November 2026, after adding the Excel export: **267 tests in 17 files passed**. `npm run build` completed (with Vite's "chunk larger than 800 kB" warning for the main file, 824 kB / 235 kB gzipped).
- 9 November 2026, after adding the 12-month projection: **281 tests in 18 files passed**. `npm run build` completed (same size warning).
- 9 November 2026, after adding the exact product-mix optimizer: **290 tests in 19 files passed**. `npm run build` completed (same size warning).
- 9 November 2026, after adding French (English / Français toggle): **307 tests in 22 files passed**. `npm run build` completed (same size warning; the main file is now 1,012 kB / 288 kB gzipped because it includes the French dictionary).
- 15 November 2026, after adding Budget vs actual: **319 tests in 23 files passed**. `npm run build` completed (same size warning).
- 15 November 2026, after adding What should I buy?: **327 tests in 24 files passed**. `npm run build` completed (same size warning).
- 15 November 2026, after adding the cost-plus pricing helper: **337 tests in 25 files passed**. `npm run build` completed (same size warning).
- 15 November 2026, after adding saved scenarios: **343 tests in 26 files passed**. `npm run build` completed (same size warning).
- 15 November 2026, after adding step fixed costs: **352 tests in 27 files passed**. `npm run build` completed (same size warning).
- 15 November 2026, after adding the guided tour: **357 tests in 28 files passed**. `npm run build` completed (same size warning).
- 15 November 2026, after adding term tooltips: **360 tests in 29 files passed**. `npm run build` completed (same size warning).
- 15 November 2026, after adding the live profit bar: **361 tests in 29 files passed**. `npm run build` completed (same size warning).
- 15 November 2026, after adding undo: **369 tests in 30 files passed**. `npm run build` completed (same size warning).
- 15 November 2026, after adding the setup checklist: **374 tests in 31 files passed**. `npm run build` completed (same size warning).
- 15 November 2026, after adding larger text / high contrast: **378 tests in 32 files passed**. `npm run build` completed (same size warning).
- 15 November 2026, after adding Drop a product?: **385 tests in 32 files passed**. `npm run build` completed (same size warning).
- 15 November 2026, after adding the price-change volume tool: **392 tests in 33 files passed**. `npm run build` completed (same size warning).
- 15 November 2026, after adding the 3-month cash budget: **399 tests in 34 files passed**. `npm run build` completed (same size warning).
- 15 November 2026, after adding target costing: **404 tests in 34 files passed**. `npm run build` completed (same size warning).
- 15 November 2026, after adding product ranking badges: **409 tests in 35 files passed**. `npm run build` completed (same size warning).
- 15 November 2026, after adding presentation mode: **410 tests in 35 files passed**. `npm run build` completed (same size warning).
- 15 November 2026, after adding print-friendly pages: **411 tests in 35 files passed**. `npm run build` completed (same size warning).
- 15 November 2026, after adding the phone tab bar: **412 tests in 35 files passed**. `npm run build` completed (same size warning).
- 15 November 2026, after adding dark mode and the readability fixes: **413 tests in 35 files passed**. `npm run build` completed (same size warning).
- 15 November 2026, after adding the what-changed highlights: **418 tests in 36 files passed**. `npm run build` completed (same size warning).

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
| 69 | Excel export | Demo → 📊 Business Report → *Download my business as Excel* | `price-it-right-maple-leaf-cafe-demo.xlsx` opens in Excel with 5 sheets | | |
| 70 | Excel numbers | In Excel, click the Summary profit cell and use =SUM on Products revenue | Cells are numbers in CAD format; profit $975; revenue sums to $3,900 | | |
| 71 | 12-month projection – default | Demo → Profit Dashboard → 📅 12-month projection | Annual operating profit $11,700; no months below break-even | | |
| 72 | Seasonal months | January 60 %, July 130 % | January −$15 "Below break-even"; best July, worst January; year $11,452.50 | | |
| 73 | Monthly fixed costs | December 150 % and fixed costs 2000 | December $1,712.50 – still below July | | |
| 74 | Totals add up | Add the 12 operating-profit cells by hand | Equals the "Year" row | | |
| 75 | Invalid month | March sales level "abc" | Message naming March; projection pauses (not treated as 0) | | |
| 76 | Best mix | Demo → 🏆 Production Planner → *🧮 Best mix (exact search)* | Green "proven optimal for these numbers" note; modified plan "✅ Feasible"; its operating profit ≥ *Keep my mix* and *Suggested plan* | | |
| 77 | Best mix vs Expert challenge | Compare with your best answer in 🎮 Expert | Best mix earns at least as much (enter the same products/stock in My Business to check) | | |
| 78 | French toggle | Click **FR** in the header, then open every section | All text in French; dashboard shows `3 900 $`, `975 $`, `63,5 %` | | |
| 79 | Remembered language | Choose FR, close and reopen the app | It opens in French; click **EN** to go back | | |
| 80 | Decimal comma | In French, type `6,50` as a price, then `abc` | `6,50` accepted; `abc` shows a French message and results pause | | |
| 81 | French PDF and Excel | In French, download the report and the Excel file | French headings, accents shown correctly, same amounts as in English; Excel sheets named Produits, Sommaire… | | |
| 82 | French at phone width | FR, phone width (≈375 px), every section | No sideways scrolling; long French words wrap | | |
| 83 | Budget vs actual – no change | Demo → Profit Dashboard → 📋 Budget vs actual | Every variance $0; actual profit $975 | | |
| 84 | Budget vs actual – worked month | Coffee 320 units, VC 2.10; Muffin 140; Sandwich 90 at 9.50; fixed 1550 | Volume $5 F (quantity $0, mix $5 F); price $45 F; VC $32 U; fixed $50 U; actual profit $943; total $32 U | | |
| 85 | Budget vs actual – invalid | Cookie actual units "abc" | Message naming Cookie; variances pause; dashboard still shows $975 | | |
| 86 | Shopping list | Demo → 📦 Smart Inventory Hub → 🛒 What should I buy? | Milk 10 L $20; Butter 1.25 kg $11.25; total $31.25 | | |
| 87 | Safety buffer | Buffer 10 | Milk, Flour, Butter, Cheese listed; total $51.88 | | |
| 88 | Pack size | Buffer 0, Milk pack size 4 (L) | Milk: 12 L, 3 packs, $24 | | |
| 89 | Unknown cost | Delete Butter's purchase cost in the inventory table | Butter shows "Unknown cost"; warning; total excludes it | | |
| 90 | Cost-plus by markup | Demo → 🎯 Pricing Lab → 🏷️ Cost-plus, Coffee, markup 50 | Price $3.00; "same as a 33.3% margin"; profit $75 if units stay the same | | |
| 91 | Cost-plus by margin | Switch to Margin on price, 50 | Price $4.00 (100 % markup); profit −$600 vs now | | |
| 92 | Try the price | Click *Try $4.00 in the What-If simulator* | Modified Coffee price = 4; business still $975 until Apply | | |
| 93 | Impossible margin | Margin 100 | Message "A margin must be less than 100 %"; no price shown | | |
| 94 | Save a scenario | Pricing Lab → What-If Coffee price 7 → name "Coffee $7" → 📸 Save this scenario | Column "Coffee $7": profit $1,275, +$300, ★ Highest profit of these | | |
| 95 | Compare | Reset Scenario, fixed costs 1300, save (no name) | Column "Scenario 2" $1,175; Coffee $7 still marked highest | | |
| 96 | Load and delete | ↩ Load on "Coffee $7"; 🗑 on "Scenario 2" → confirm | What-If shows Coffee 7; Scenario 2 removed after confirming; dashboard still $975 | | |
| 97 | Step fixed cost | Demo → Profit Dashboard → 🪜 Step fixed costs → Add a step: above 600, +500 | 0–600: 455 units; 601 and above: $2,000, 607 units; expected profit $475; warning about falling below zero | | |
| 98 | Step too early | Change to above 400, +1000 | 0–400 "Not reached"; 401+: 758 units; expected profit −$25 | | |
| 99 | Invalid step | Extra fixed costs "abc"; two steps with the same units | Clear messages; results pause | | |
| 100 | First-visit tour | Open the site in a private window | Tour card "step 1 of 8" appears; Next opens My Business with its tab outlined in gold | | |
| 101 | Skip and restart | Skip tour, reload, then Home → 🧭 Take the tour | Not shown again after skipping; Take the tour restarts it; Esc closes it | | |
| 102 | Tour on a phone | Phone width, step through the tour | Card fits at the bottom, no sideways scrolling, highlighted tab scrolls into view | | |
| 103 | Term tooltip | Demo → Profit Dashboard → tap the ⓘ next to Total Contribution Margin | Box: "Contribution margin: Selling price − variable cost…"; tap again closes it | | |
| 104 | Tooltip on a phone | Phone width, open the ⓘ on Overall CM Ratio (right side of the screen) | Box fully on screen just under the button; Esc or scrolling closes it | | |
| 105 | Live profit bar | Demo → My Business, scroll down | Bar at the bottom: Revenue $3,900 · CM $2,475 · Operating profit $975 | | |
| 106 | Bar updates | Change Coffee price to 7 | Bar shows Revenue $4,200 and Operating profit $1,275 immediately | | |
| 107 | Bar pauses | Coffee price "abc" | Bar: "Fix 1 highlighted field to see your results." – no $0 shown | | |
| 108 | Undo a delete | My Business → ✕ on Muffin → confirm | Message "Deleted the product 'Muffin'." → ↩ Undo brings it back; profit $975 | | |
| 109 | Undo Apply | Pricing Lab → Coffee 7 → Apply Changes → confirm → ↩ Undo | Coffee price back to 6 in My Business | | |
| 110 | Undo expires safely | Delete a product, then edit another value | The Undo message disappears (the edit is kept) | | |
| 111 | Setup checklist | Home with the Coffee Shop example | "4 of 5 done"; "Give every product a recipe" not ticked with a Go → link to the Inventory Hub | | |
| 112 | Checklist updates | My Business → fixed costs "abc" → back to Home | "3 of 5 done"; Enter monthly fixed costs unticked with a link | | |
| 113 | Larger text | Click A+ in the header | All text larger; no sideways scrolling at phone width | | |
| 114 | High contrast | Click ◐ | Darker text and borders, white background; click again to turn off | | |
| 115 | Remembered | Turn both on, reload the page | Both still on | | |
| 116 | Drop a product – keep | Demo → 🧭 Decisions → ✂️ Drop a product?, Sandwich, fixed costs saved 300 | "Keep Sandwich"; profit $975 → $775 (−$200) | | |
| 117 | Drop a product – drop | Fixed costs saved 600 | "Drop Sandwich"; $1,075 (+$100) | | |
| 118 | Other products affected | Contribution lost on other products 150 | Back to "Keep Sandwich" (−$50) | | |
| 119 | Price cut volume | Demo → Pricing Lab → 🔁 Price change, Coffee, new price 5 | "Sell 400 units"; "100 more than now (+33.3%)" | | |
| 120 | Price rise | New price 7 | "Sell 240 units"; 60 fewer (−20%); Try it → What-If Coffee 7 / 240 | | |
| 121 | Impossible price | New price 2 | "Not possible" message | | |
| 122 | Cash budget | Demo → Profit Dashboard → 💵 3-month cash budget | Cash at end of month $1,475 / $2,450 / $3,425; profit $975 each month | | |
| 123 | Slow payers | % paid in the same month 60 | Month 1 cash −$85 with a shortfall warning; profit still $975; $1,560 still owed after month 3 | | |
| 124 | Stock purchase | Month 1 extra stock bought 500 (back to 100 % paid) | Month 1 cash $975 lower than before; profit unchanged | | |
| 125 | Target costing | Demo → Pricing Lab → 🎯 Target costing, Coffee, margin 70 | Target cost $1.80; "must fall by $0.20 (10%)" | | |
| 126 | Already meets target | Margin 50 | "already meets this margin, with $1.00 to spare" | | |
| 127 | Product badges | Demo → My Business, below the product table | Coffee Star, Muffin Review, Sandwich Hidden gem, Cookie Popular | | |
| 128 | Loss-maker badge | Cookie price 0.50 | Cookie – Loss on each sale | | |
| 129 | Presentation mode | Demo → Profit Dashboard → 🎬 Presentation mode | Full-screen "Slide 1 of 6" with the café name; → shows $3,900 / $2,475 / $975 | | |
| 130 | Slides | Keep pressing → | Break-even 455 units, $2,363.64; Inventory slide names Milk and Butter; ← goes back; Esc exits | | |
| 131 | On a projector / phone | Try at phone width and full screen (F11) | Large text, nothing cut off | | |
| 132 | Print a page | Demo → Profit Dashboard → footer 🖨 Print this page → print preview | Heading "Price It Right – Maple Leaf Café (demo) – Profit Dashboard"; no menu or buttons; white background; cards not split | | |
| 133 | Print another section | My Business → Ctrl + P | Only My Business content, product values readable as plain text | | |
| 134 | Phone tab bar | Phone width (≈375 px) | No tabs at the top; bottom bar with Home, Business, Profit, Pricing, More | | |
| 135 | More menu | Tap ☰ More → Smart Inventory Hub | Menu lists the other 5 sections; it closes and opens the Inventory Hub; More stays highlighted | | |
| 136 | Nothing covered | My Business at phone width, scroll down | Live profit bar sits just above the tab bar, not under it | | |
| 137 | Dark mode | Click 🌙 in the header and visit every section | Dark background, light readable text, charts' labels readable; click again to return | | |
| 138 | Dark mode printing | Dark mode on → Ctrl + P → print preview | Preview is in the normal light colours on white paper | | |
| 139 | Dark + high contrast | Turn on 🌙 and ◐ | Text turns pure white | | |
| 140 | What changed – Undo message | My Business → delete Muffin → confirm | Message also says "Operating profit: $975 → $600" | | |
| 141 | Undone note | Click ↩ Undo | "Undone – operating profit is back to $975." | | |
| 142 | Glow | Pricing Lab → Coffee 7 → Apply → open the dashboard | The profit card's number glows briefly; Monthly Fixed Costs does not | | |

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

#### Second independent check – new features (9 November 2026)
A separate AI agent that had **not seen the code or tests** was given only the problem statements and rules. It recalculated each example from first principles in exact integer cents and fractions (Node.js with BigInt; Python is not installed on this machine). The app's own functions were then run on the same inputs. The checker's script is kept outside the repository.

| # | Scenario | Independent value | App value | Match |
|---|---|---|---|---|
| 1 | Demo café totals | Revenue $3,900; VC $1,425; CM $2,475; profit $975; CM ratio 63.46 % | Same | ✅ |
| 1 | Sales-mix break-even | Weighted CM $3.30; 454.5454… → **455** units; split 182/91/61/121 (profit $2.50 ≥ 0); revenue $2,363.64; MOS $1,536.36 (39.39 %) | Same | ✅ |
| 2 | Sensitivity ±10 % | Prices +$390 → $1,365 / −$390 → $585; VC −$142.50 → $832.50 / +$142.50 → $1,117.50; volume +$247.50 → $1,222.50 (+25.38 %) / $727.50; fixed −$150 → $825 / $1,125 | Same | ✅ |
| 2 | Degree of operating leverage | 2,475 ÷ 975 = 2.54 | 2.54 | ✅ |
| 3 | After-tax target | $1,000 at 20 % → $1,250 (tax $250); at 30 % → $1,428.58 (tax $428.57, after tax $1,000.01); $975 at 20 % → tax $195, after tax $780 | Same | ✅ |
| 4 | Price-sensitive demand | $9 → 220 units, $240; best $11 → 180 units, $320 (no ties); ≥ $200 from $8.58 to $13.40 | Same | ✅ |
| 4 | Prices in between | $13.36 gives only $199.52 (units stuck at 132) – not every cent in the range qualifies | The app reports only the lowest and highest price and says prices in between can fall short | ✅ |
| 5 | Special order | (4 − 2) × 100 − 50 − (6 − 2) × 20 = **+$70**, accept | +$70, accept | ✅ |
| 6 | Make or buy | $4,800 vs $5,000 → make, saves $200; with $600 opportunity cost $5,100 → buy, saves $100 | Same | ✅ |
| 7 | 12-month projection | 12 × $975 = $11,700; January 60 % → revenue $2,340, CM $1,485, **−$15**; July 130 % → $1,717.50; year $11,452.50; with December 150 % and $2,000 fixed → $1,712.50, best July, year $12,190 | Same | ✅ |
| 8 | Inventory capacity | 25 coffees, milk limiting; 15,000 mL short for 100 | 25, milk | ✅ |
| 9 | Best mix (brute force, all 3,672,471 plans) | Max CM $650, profit $100, plan 100 muffins / 0 croissants / 200 cookies (unique) | Proven optimal, $650, same plan, $100 | ✅ |

**No discrepancies were found.** The checker's one extra observation (the $13.36 gap inside the ≥ $200 price range) is already how the app behaves. It is why the app shows only the lowest and highest prices that reach a target. The app's milk-shortage figure for 100 coffees was checked in the 2 November verification above.

#### Third independent check – features added on 15 November 2026
Again a separate AI agent that had **not seen the code or tests** worked only from the problem statements and rules, in exact integer cents with BigInt in Node.js, and also by hand. A temporary script ran the app's own functions on the same inputs and was then deleted.

| # | Scenario | Independent value | App value | Match |
|---|---|---|---|---|
| 1 | Budget vs actual (Coffee 320 @ VC $2.10, Muffin 140, Sandwich 90 @ $9.50, Cookie 200, fixed $1,550) | Static $975; volume +$5 (+80 / −25 / −50 / 0); quantity $0, mix +$5; flexible $980; price +$45; VC −$32; fixed −$50; actual **$943** (direct), revenue $3,935 | Same | ✅ |
| 1 | Variance splits | Coffee 301 → volume $4.00, quantity $3.30, mix $0.70; all units +10 % → $247.50 all quantity, mix $0 | Same | ✅ |
| 2 | Purchase plan, no buffer | Milk 10 L $20 + butter 1.25 kg $11.25 = **$31.25** (cheese exactly covered) | Same | ✅ |
| 2 | Purchase plan, 10 % buffer | Milk $32, flour $1.20, butter $15.075 → $15.08, cheese $3.60 = **$51.88** | Same | ✅ |
| 2 | Pack sizes | 4 L jugs: 3 = 12 L, $24; 2 L cartons: 5 = 10 L, $20 | Same | ✅ |
| 3 | Cost-plus | $2 + 50 % = **$3.00** (33.33 % margin); $2 at 50 % margin = **$4.00** (100 % markup); $1.50 at 60 % = $3.75 (150 %); $2.10 + 33 % = $2.80 (25 % margin); $2 at 70 % = $6.67 (233.5 %, 70.015 %); café profit at $3 / $4 coffee = $75 / $375 | Same | ✅ |
| 4 | Saved scenarios | Coffee $7 → $1,275 (+$300, highest); fixed $1,300 → $1,175; 200 muffins → $1,100 | Same | ✅ |
| 5 | Step fixed costs | None → 455, $975; +$500 above 600 → 455 and **607**, profit $480 / −$16.70 / $3.10 / $475 at 600 / 601 / 607 / 750; +$1,000 above 400 → none, then 758, −$25; steps +$100 > 100 and +$200 > 300 → none, none, 546; +$1 above 500 → upper range profitable from 501 | Same | ✅ |

**No discrepancies were found.** The checker read "above 600 units" as *more than* 600, which is how the app works: at exactly 600 units the step has not started yet.

> **For the project team:** also check a few results yourselves, by hand or in Excel, and record them in the manual testing table above.

## Real user testing and feedback

> **TO BE COMPLETED BY THE PROJECT TEAM.** No real user testing has been done yet. Do not fill this in until a real person has used the app.

Use [docs/USER_TESTING_KIT.md](docs/USER_TESTING_KIT.md) (tasks, questions and a record sheet) to run the sessions, and [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) for the 5-minute oral demo.

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
- **Optimizer scope.** "Best mix" maximises contribution margin for the numbers entered: it trusts expected demand, prices, costs and recipes, uses current stock only (not the hypothetical extra inventory), and leaves products without a recipe at expected demand. It finds one best plan; others may tie. On very large problems the search can stop at its 2,000,000-step limit, and then the plan is labelled "not proven optimal". The older "Suggested plan" is still a labelled rule of thumb.
- **Recipes:** one fixed recipe per product. There is no waste, spoilage, expiry, batch sizes or labour/time constraints (for services, staff and appointment capacity are not modelled).
- **Units:** weight (g, kg), volume (mL, L) and pieces only. There are no imperial units and no conversion between weight and volume. Quantities allow up to 3 decimals, costs up to 6 decimals and money up to 2; each value is capped at 1,000,000,000.
- **Imports:** .xlsx and .csv only (not .xls), first worksheet row as headings (optional), up to 5 MB / 2,000 rows. Formulas in Excel are read as their saved values.
- **Inventory is a snapshot**; there is no purchasing, reorder points, lead times or inventory turnover.
- **Taxes:** only the optional after-tax target estimates income tax, at one flat user-entered rate on operating profit. There is no GST/PST/HST, interest, deductions, loss carry-forward or financing costs anywhere. Operating profit is not net income.
- **Rounding:** itemized variable costs are rounded to the nearest cent per unit before multiplying by volume.
- **Sensitivity analysis** is fixed at ±10 % and moves one input at a time; it does not model inputs changing together, step costs, or demand reacting to price. DOL only describes small changes around the current sales level.
- **Show the math** covers the main figures only. It does not explain every table cell, the charts, the inventory figures, the challenges or the PDF report, and it gives no explanation when a break-even point does not exist (the screen already says why). With many products the revenue and variable-cost explanations become long lists.
- **PDF fonts** use standard Latin characters, so emojis and some symbols are left out of the PDF (French accents are kept; `œ` is written `oe`).
- **French translations were written by an AI** and checked by tests for completeness, not for style. A French-speaking person should review them (see the list under *Language*). The user's own data is never translated, and the Excel money format code stays the English-Canada one (Excel shows it in the reader's own regional format).
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
